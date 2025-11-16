import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { FilterIngresosDto } from './dto/filtro-ingreso.dto';
import { AbonarIngresoDto } from './dto/abonar-ingreso.dto';
import { CreateCorteDto } from './dto/create-corte-caja.dto';
import { CloseCorteDto } from './dto/close-corte-caja.dto';
import { StatusIngreso, StatusDetIngreso, StatusPagIngreso } from 'src/common/enums';
import { Decimal } from '@prisma/client/runtime/library';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';

@Injectable()
export class IngresoService {
    constructor(private prisma: PrismaService) {}

    private fechaHoyString() {
        return new Date().toISOString().slice(0, 10);
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

        const fecha_apertura = dto.fecha_apertura ? new Date(dto.fecha_apertura) : new Date();

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

    async cerrarCorte(dto: CloseCorteDto) {
        const corte = await this.obtenerCorteAbierto(dto.id_consultorio);
        if (!corte) throw new BadRequestException('No hay corte abierto.');

        const fechaDesde = corte.fecha_apertura;
        const fechaHasta = new Date();

        const ingresos = await this.prisma.ingreso.findMany({
            where: {
                id_consultorio: dto.id_consultorio,
                fecha: { gte: fechaDesde, lte: fechaHasta },
            },
            include: { pago_ingreso: true },
        });

        let ingresosTot = new Decimal(0);
        let pagosTot = new Decimal(0);

        for (const ing of ingresos) {
            ingresosTot = ingresosTot.plus(new Decimal(ing.monto_total as any));

            const pagosConfirmados = ing.pago_ingreso
                .filter((p) => p.status === StatusPagIngreso.CONFIRMADO)
                .reduce((acc, p) => acc.plus(new Decimal(p.monto as any)), new Decimal(0));

            pagosTot = pagosTot.plus(pagosConfirmados);
        }

        // Si no viene monto_cierre, lo calculamos como la suma de ingresos
        const montoCierre = dto.monto_cierre !== undefined ? new Decimal(dto.monto_cierre) : ingresosTot;

        const diferencia = pagosTot.minus(new Decimal(corte.monto_apertura as any));

        return this.prisma.corte_caja.update({
            where: { id_corte: corte.id_corte },
            data: {
                fecha_cierre: new Date(),
                usuario_cierre: dto.usuario_cierre,
                monto_cierre: montoCierre,
                ingresos_totales: ingresosTot,
                pagos_totales: pagosTot,
                diferencia,
            },
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

        // calcular monto_total seguro (sumar subtotales)
        const monto_total_num = dto.detalles.reduce((acc, d) => acc + Number(d.subtotal), 0);
        const monto_total = new Decimal(monto_total_num);

        // calcular total de pagos inicial
        const totalPagos = dto.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0;

        // definir status
        let status: StatusIngreso = StatusIngreso.PENDIENTE;
        if (totalPagos >= monto_total.toNumber()) {
            status = StatusIngreso.PAGADO;
        } else if (totalPagos > 0 && totalPagos < monto_total.toNumber()) {
            status = StatusIngreso.PARCIAL;
        }

        return this.prisma.ingreso.create({
            data: {
                id_paciente: dto.id_paciente,
                id_consultorio,
                monto_total,
                fecha: new Date(),
                notas: dto.notas ?? '',
                status: status,

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
                    dto.pagos?.length > 0
                        ?   {
                                create: dto.pagos.map((p) => ({
                                    id_metodo_pago: p.id_metodo_pago,
                                    monto: new Decimal(p.monto),
                                    referencia: p.referencia ?? '',
                                    status: p.status ?? StatusPagIngreso.CONFIRMADO,
                                })),
                            }
                        : undefined,
            },

            include: {
                detalle_ingreso: true,
                pago_ingreso: true,
            },
        });
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

    async abonar(id: number, dto: AbonarIngresoDto, id_consultorio: number) {
        const ingreso = await this.findOne(id, id_consultorio);
        if (!ingreso) throw new BadRequestException('Ingreso no encontrado.');

        if (ingreso.status === StatusIngreso.PAGADO) {
            throw new BadRequestException('No se puede abonar un ingreso ya pagado.');
        }

        const totalPagado = ingreso.pago_ingreso
            .filter((p) => p.status === StatusPagIngreso.CONFIRMADO)
            .reduce((acc, p) => acc + Number(p.monto), 0);

        const pendiente = Number(ingreso.monto_total) - totalPagado;

        if (dto.monto > pendiente) {
            throw new BadRequestException('El abono supera el pendiente.');
        }

        await this.prisma.pago_ingreso.create({
            data: {
                id_ingreso: ingreso.id_ingreso,
                id_metodo_pago: dto.id_metodo_pago,
                monto: new Decimal(dto.monto),
                referencia: dto.referencia ?? '',
                status: StatusPagIngreso.CONFIRMADO,
            },
        });

        const sumaPagos = await this.prisma.pago_ingreso.aggregate({
            _sum: { monto: true },
            where: { id_ingreso: ingreso.id_ingreso, status: StatusPagIngreso.CONFIRMADO },
        });

        const totalPagadoNuevo = Number(sumaPagos._sum.monto ?? 0);

        const nuevoStatus =
            totalPagadoNuevo >= Number(ingreso.monto_total)
                ? StatusIngreso.PAGADO
                : StatusIngreso.PARCIAL;

        return this.prisma.ingreso.update({
            where: { id_ingreso: ingreso.id_ingreso },
            data: { status: nuevoStatus },
        });
    }
}
