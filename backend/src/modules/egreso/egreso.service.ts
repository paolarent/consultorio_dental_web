import { BadRequestException, Injectable, NotFoundException, Request } from '@nestjs/common';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { PrismaService } from 'prisma/prisma.service';
import { StatusEgreso } from 'src/common/enums';
import { Prisma, status_egreso } from '@prisma/client';
import { IngresoService } from '../ingreso/ingreso.service';
import { Decimal } from '@prisma/client/runtime/binary';


@Injectable()
export class EgresoService {
    constructor( 
        private prisma: PrismaService,
        private readonly ingresoService: IngresoService
    ) {}

    async findAllRegistered(id_consultorio?: number) {
        if (id_consultorio) {
            const consultorioExiste = await this.prisma.consultorio.findUnique({
            where: { id_consultorio },
            });

            if (!consultorioExiste) {
                throw new Error(`El consultorio con id ${id_consultorio} no existe`);
            }
        }

        return this.prisma.egreso.findMany({
            where: {
            status: 'registrado',
            ...(id_consultorio && { id_consultorio }), 
            },
        });
    }

    async listarTiposGasto() {
        return this.prisma.tipo_egreso.findMany({
            select: {
            id_tipo_egreso: true,
            nombre: true
            }
        });
    }

    async create(data: CreateEgresoDto, id_consultorio: number) {
        //Obtener corte abierto desde IngresoService
        const corte = await this.ingresoService.obtenerCorteAbierto(id_consultorio);
        if (!corte) throw new BadRequestException('Debe abrir caja antes.');

        //Validar tipo de egreso
        const tipoEgreso = await this.prisma.tipo_egreso.findUnique({
        where: { id_tipo_egreso: data.id_tipo_egreso },
        });

        if (!tipoEgreso) {
        throw new NotFoundException(
            `El tipo de egreso con ID ${data.id_tipo_egreso} no existe.`,
        );
        }

        //Crear egreso
        const egresoCreado = await this.prisma.egreso.create({
        data: {
            ...data,
            fecha: new Date(data.fecha),
            status: StatusEgreso.REGISTRADO,
            id_consultorio,
        },
        });

        //Actualizar corte abierto
        await this.prisma.corte_caja.update({
        where: { id_corte: corte.id_corte },
        data: {
            egresos_totales: new Decimal(corte.egresos_totales || 0).plus(egresoCreado.monto),
            diferencia: new Decimal(corte.diferencia || 0).minus(egresoCreado.monto),
        },
        });

        return egresoCreado;
    }


    async updateEgreso(id_egreso: number, nuevoStatus: status_egreso) {
        const egreso = await this.prisma.egreso.findUnique({
            where: { id_egreso },
        });

        if (!egreso) {
        throw new NotFoundException(`No se encontró el egreso con id ${id_egreso}`);
        }

        return this.prisma.egreso.update({
            where: { id_egreso },
            data: { status: nuevoStatus },
        });
    }

    async calcularTotalGastos(id_consultorio: number) {
        const result = await this.prisma.egreso.aggregate({
            _sum: { monto: true },
            where: {
            id_consultorio,
            status: StatusEgreso.REGISTRADO, // solo gastos activos, tecnicamente son los que cuentan
            },
        });

        // _sum.monto puede ser null si no hay registros
        return result._sum.monto ?? 0;
    }

    async totalGastosMensuales(id_consultorio: number) {
        const inicioMes = new Date();
        inicioMes.setDate(1); // primer día del mes
        inicioMes.setHours(0,0,0,0);

        const finMes = new Date(inicioMes);
        finMes.setMonth(finMes.getMonth() + 1); 
        finMes.setMilliseconds(-1); // último instante del mes

        const total = await this.prisma.egreso.aggregate({
            _sum: { monto: true },
            where: {
            id_consultorio,
            fecha: { gte: inicioMes, lte: finMes },
            status: StatusEgreso.REGISTRADO,
            },
        });

        return { total: total._sum.monto || 0 };
    }

}
