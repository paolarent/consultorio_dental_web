import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { FilterIngresosDto } from './dto/filtro-ingreso.dto';
import { AbonarIngresoDto } from './dto/abonar-ingreso.dto';
import { CreateCorteDto } from './dto/create-corte-caja.dto';
import { CloseCorteDto } from './dto/close-corte-caja.dto';
import { StatusIngreso, StatusDetIngreso, StatusPagIngreso, Status, StatusEgreso } from 'src/common/enums';
import { Decimal } from '@prisma/client/runtime/library';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';
import { formatFechaLocal } from 'src/utils/format-date';
import { CreatePagoIngresoDto } from './dto/create-pago.dto';


@Injectable()
export class IngresoService {
    constructor(private prisma: PrismaService) {}

    private fechaHoyString() {
        return new Date().toISOString().slice(0, 10);
    }

    async listarFormasPago() {
        return this.prisma.metodo_pago.findMany({
            where: { status: Status.ACTIVO },
            select: {
                id_metodo_pago: true,
                nombre: true
            }
        });
    }

    // ==========================
    // CORTE
    // ==========================

    async obtenerCorteAbierto(id_consultorio: number) {
        return this.prisma.corte_caja.findFirst({
            where: {
                id_consultorio,
                fecha_cierre: null,
            },
        });
    }

    async abrirCorte(dto: CreateCorteDto, id_consultorio: number, id_usuario: number) {
        const existe = await this.obtenerCorteAbierto(id_consultorio);
        if (existe) throw new BadRequestException('Ya existe un corte abierto.');

        // --- AJUSTE DE FECHA SIN LIBRERÍAS ---
        const ahora = new Date();
        const offset = -6; // Ciudad de México UTC-6 (ajustar según horario real)
        const fechaLocal = new Date(ahora.getTime() + offset * 60 * 60 * 1000);

        const fecha_apertura = dto.fecha_apertura ? new Date(dto.fecha_apertura) : fechaLocal;

        return this.prisma.corte_caja.create({
            data: {
                id_consultorio,
                fecha_apertura,
                usuario_apertura: id_usuario,
                monto_apertura: new Decimal(dto.monto_apertura),
                notas: dto.notas ?? '',
            },
        });
    }

    async cerrarCorte(id_consultorio: number, usuario_cierre: number) {
        const corte = await this.obtenerCorteAbierto(id_consultorio);
        if (!corte) throw new BadRequestException('No hay corte abierto.');

        const montoCierre = new Decimal(corte.monto_apertura)
            .plus(corte.pagos_totales || 0)
            .minus(corte.egresos_totales || 0);
        const diferencia = montoCierre.minus(corte.monto_apertura);

        return this.prisma.corte_caja.update({
            where: { id_corte: corte.id_corte },
            data: {
                fecha_cierre: new Date(),
                usuario_cierre,
                monto_cierre: montoCierre,
                diferencia
            }
        });
    }



    async obtenerCorteDelDia(id_consultorio: number) {
        const inicio = new Date();
        inicio.setHours(0, 0, 0, 0);

        return this.prisma.corte_caja.findMany({
            where: {
                id_consultorio,
                fecha_apertura: { gte: inicio },
            },
            orderBy: { fecha_apertura: 'desc' },
        });
    }

    // ==========================
    // INGRESOS
    // ==========================

    async create(dto: CreateIngresoDto, id_consultorio: number) {

        const corte = await this.obtenerCorteAbierto(id_consultorio);
        if (!corte) throw new BadRequestException('Debe abrir caja antes.');

        if (!dto.detalles || dto.detalles.length === 0) {
            throw new BadRequestException('Debe haber al menos un detalle.');
        }

        //VALIDACIONES IMPORTANTES
        // Validar cada detalle
        for (const d of dto.detalles) {
            if (d.cantidad <= 0) throw new BadRequestException('La cantidad debe ser mayor a cero.');
            if (d.precio_unitario <= 0) throw new BadRequestException('El precio unitario debe ser mayor a cero.');
            const subtotalEsperado = d.cantidad * d.precio_unitario;
            if (Math.abs(subtotalEsperado - d.subtotal) > 0.01) {
            throw new BadRequestException('El subtotal no coincide con cantidad * precio unitario.');
            }
        }

        // Calcular monto total como suma de subtotales de los detalles
        const monto_total = new Decimal(
            dto.detalles.reduce((acc, d) => acc + Number(d.subtotal), 0)
        );

        // calcular total de pagos inicial
        const totalPagos = dto.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0;

        if (totalPagos > monto_total.toNumber()) {
            throw new BadRequestException('La suma de pagos no puede exceder el monto total.');
        }

        if (dto.pagos) {
            for (const p of dto.pagos) {
            if (p.monto <= 0) throw new BadRequestException('Cada pago debe tener un monto mayor a cero.');
            if (!p.id_metodo_pago) throw new BadRequestException('Cada pago debe tener un método de pago.');
            }
        }

        // definir status
        let status: StatusIngreso = StatusIngreso.PENDIENTE;
        if (totalPagos >= monto_total.toNumber()) {
            status = StatusIngreso.PAGADO;
        } else if (totalPagos > 0) {
            status = StatusIngreso.PARCIAL;
        }

        // --- AJUSTE DE FECHA SIN LIBRERÍAS ---
        const ahora = new Date();

        // Ajustar a Ciudad de México (UTC-6 estándar / UTC-5 horario de verano)
        const offset = -6; // ajusta según horario real
        const fechaLocal = new Date(
            ahora.getTime() + offset * 60 * 60 * 1000
        );

        // Crear ingreso y guardar resultado
        const ingresoCreado = await this.prisma.ingreso.create({
        data: {
            id_paciente: dto.id_paciente,
            id_consultorio,
            monto_total,
            fecha: fechaLocal,
            notas: dto.notas ?? '',
            status,

            detalle_ingreso: {
            create: dto.detalles.map((d) => ({
                id_servicio: d.id_servicio,
                cantidad: d.cantidad,
                precio_unitario: new Decimal(d.precio_unitario),
                subtotal: new Decimal(d.subtotal),
                status: StatusDetIngreso.ACTIVO,
            })),
            },

            pago_ingreso:
            dto.pagos?.length
                ? {
                    create: dto.pagos.map((p) => ({
                    id_metodo_pago: p.id_metodo_pago,
                    monto: new Decimal(p.monto),
                    referencia: p.referencia ?? '',
                    status: p.status ?? StatusPagIngreso.CONFIRMADO,
                    })),
                }
                : undefined,
        },
            include: { detalle_ingreso: true, pago_ingreso: true },
        });

        // --- ACTUALIZAR CORTE ---
        await this.prisma.corte_caja.update({
        where: { id_corte: corte.id_corte },
        data: {
            ingresos_totales: new Decimal(corte.ingresos_totales || 0).plus(monto_total),
            pagos_totales: new Decimal(corte.pagos_totales || 0).plus(totalPagos),
            diferencia: new Decimal(corte.diferencia || 0).plus(totalPagos)
        }
        });

        // --- RETORNAR EL INGRESO CREADO ---
        return ingresoCreado;
    }

    async findAll(id_consultorio: number) {
        return this.prisma.ingreso.findMany({
            where: { id_consultorio },
            include: { detalle_ingreso: true, pago_ingreso: true },
            orderBy: { fecha: 'desc' },
        });
    }

    async findOne(id: number, id_consultorio: number) {
        const ingreso = await this.prisma.ingreso.findFirst({
            where: { id_ingreso: id, id_consultorio },
            include: { detalle_ingreso: true, pago_ingreso: true },
        });

        if (!ingreso) throw new NotFoundException('Ingreso no encontrado.');
        return ingreso;
    }

    async update(id: number, dto: UpdateIngresoDto, id_consultorio: number) {
        const ingreso = await this.findOne(id, id_consultorio);

        if (ingreso.status === StatusIngreso.PAGADO) {
            throw new BadRequestException('No se puede modificar un ingreso pagado.');
        }

        return this.prisma.ingreso.update({
            where: { id_ingreso: id },
            data: {
                notas: dto.notas ?? ingreso.notas,
                status: dto.status ?? ingreso.status,
            },
        });
    }

    async cancelar(id: number, id_consultorio: number) {
        await this.findOne(id, id_consultorio);

        return this.prisma.ingreso.update({
            where: { id_ingreso: id },
            data: {
                status: StatusIngreso.CANCELADO,
                pago_ingreso: {
                    updateMany: {
                        where: {},
                        data: { status: StatusPagIngreso.REEMBOLSADO },
                    },
                },
            },
        });
    }

    async abonar(id_ingreso: number, dto: AbonarIngresoDto, id_consultorio: number) {
        const ingreso = await this.prisma.ingreso.findUnique({ where: { id_ingreso }, include: { pago_ingreso: true } });
        if (!ingreso) throw new NotFoundException('Ingreso no encontrado');

        const totalPagos = ingreso.pago_ingreso.reduce((acc, p) => acc + Number(p.monto), 0);
        let pagosNuevos: CreatePagoIngresoDto[] = [];

        if (dto.pagosDivididos && dto.pagosDivididos.length > 0) {
            pagosNuevos = dto.pagosDivididos;
        } else {
            if (!dto.id_metodo_pago) throw new BadRequestException('Debe especificar método de pago');
            pagosNuevos = [{ monto: dto.monto, id_metodo_pago: dto.id_metodo_pago, referencia: dto.referencia }];
        }

        
        //const saldoPendiente = ingreso.monto_total - totalPagos;
        const saldoPendiente = ingreso.monto_total.minus(new Decimal(totalPagos)).toNumber();
        const sumaPagos = pagosNuevos.reduce((acc, p) => acc + Number(p.monto), 0);
        
        if (sumaPagos > saldoPendiente) throw new BadRequestException('Los pagos exceden el saldo pendiente');

        // Guardar pagos nuevos
        await this.prisma.pago_ingreso.createMany({
            data: pagosNuevos.map(p => ({
                id_ingreso,
                monto: new Decimal(p.monto),
                id_metodo_pago: p.id_metodo_pago,
                referencia: p.referencia ?? '',
                status: p.status ?? StatusPagIngreso.CONFIRMADO,
            }))
        });

        // Recalcular estado del ingreso
        const totalActualizado = totalPagos + sumaPagos;
        let status: StatusIngreso = StatusIngreso.PENDIENTE;
        //if (totalActualizado >= ingreso.monto_total) status = StatusIngreso.PAGADO;
        if (new Decimal(totalActualizado).gte(ingreso.monto_total)) status = StatusIngreso.PAGADO;
        else if (totalActualizado > 0) status = StatusIngreso.PARCIAL;

        await this.prisma.ingreso.update({
            where: { id_ingreso },
            data: { status }
        });

        // Actualizar corte
        const corte = await this.obtenerCorteAbierto(id_consultorio);
        if (corte) {
            await this.prisma.corte_caja.update({
                where: { id_corte: corte.id_corte },
                data: {
                    pagos_totales: new Decimal(corte.pagos_totales || 0).plus(sumaPagos),
                    diferencia: new Decimal(corte.diferencia || 0).plus(sumaPagos)
                }
            });
        }

        return { message: 'Abono registrado correctamente' };
    }



    async totalIngresos(id_consultorio: number) {
        const result = await this.prisma.pago_ingreso.aggregate({
            _sum: { monto: true },
            where: {
                ingreso: {
                    id_consultorio: id_consultorio
                },
                status: StatusPagIngreso.CONFIRMADO
            }
        });

        return { total: result._sum.monto || 0 };

    }

    async totalIngresosMensuales(id_consultorio: number) {
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0,0,0,0);

        const finMes = new Date(inicioMes);
        finMes.setMonth(finMes.getMonth() + 1);
        finMes.setMilliseconds(-1);

        const result = await this.prisma.pago_ingreso.aggregate({
            _sum: { monto: true },
            where: {
                status: StatusPagIngreso.CONFIRMADO,
                fecha_pago: {
                    gte: inicioMes,
                    lte: finMes
                },
                ingreso: {   
                    id_consultorio: id_consultorio
                }
            }
        });

        return { total: result._sum.monto || 0 };
    }

    async historialFinanzas(id_consultorio: number) {
        const ingresos = await this.prisma.ingreso.findMany({
            where: {
                id_consultorio,
                status: StatusIngreso.PAGADO
            },
            select: {
                id_ingreso: true,
                fecha: true,
                notas: true,
                monto_total: true,
                paciente: {
                    select: {
                        nombre: true,
                        apellido1: true
                    }
                },
                detalle_ingreso: {
                    select: {
                        servicio: { select: { nombre: true } }
                    }
                }
            }
        });

        const egresos = await this.prisma.egreso.findMany({
            where: {
                id_consultorio,
                status: StatusEgreso.REGISTRADO
            },
            select: {
                id_egreso: true,
                fecha: true,
                monto: true,
                descripcion: true,
                tipo_egreso: {
                    select: { nombre: true }
                }
            }
        });

        const formateados = [
            ...ingresos.map(i => ({
                tipo: "ingreso",
                fecha: formatFechaLocal(i.fecha),
                monto: i.monto_total,
                titulo: `${i.detalle_ingreso[0]?.servicio.nombre || "Servicio"} - ${i.paciente.nombre} ${i.paciente.apellido1}`,
                subtitulo: i.notas || ""
            })),

            ...egresos.map(e => ({
                tipo: "egreso",
                fecha: formatFechaLocal(e.fecha),
                monto: e.monto,
                titulo: e.descripcion,
                subtitulo: e.tipo_egreso.nombre
            }))
        ];

        return formateados.sort((a, b) => {
            return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
    }

    async historialIngresosPendientes(id_consultorio: number) {
        const ingresos = await this.prisma.ingreso.findMany({
            where: {
                id_consultorio,
                status: { in: [StatusIngreso.PARCIAL, StatusIngreso.PENDIENTE] },
            },
            include: {
                paciente: { select: { nombre: true, apellido1: true, apellido2: true } },
                detalle_ingreso: { select: { servicio: { select: { nombre: true } } } },
                pago_ingreso: { select: { monto: true, status: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        return ingresos.map(i => {
            const totalPagado = i.pago_ingreso
                .filter(p => p.status === StatusPagIngreso.CONFIRMADO)
                .reduce((acc, p) => acc + Number(p.monto), 0);

            return {
                id_ingreso: i.id_ingreso,
                paciente: `${i.paciente.nombre} ${i.paciente.apellido1} ${i.paciente.apellido2 || ''}`,
                servicio: i.detalle_ingreso[0]?.servicio.nombre || 'Servicio',
                fecha: formatFechaLocal(i.fecha),
                monto_total: Number(i.monto_total),
                totalPagado,
                saldoPendiente: Number(i.monto_total) - totalPagado,
                status: i.status
            }
        });
    }


}
