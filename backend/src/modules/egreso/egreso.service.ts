import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { PrismaService } from 'prisma/prisma.service';
import { StatusEgreso } from 'src/common/enums';
import { Prisma, status_egreso } from '@prisma/client';


@Injectable()
export class EgresoService {
    constructor( private prisma: PrismaService ) {}

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

    async create(data: CreateEgresoDto) {
        const tipoEgreso = await this.prisma.tipo_egreso.findUnique({
            where: {id_tipo_egreso: data.id_tipo_egreso}
        });

        if (!tipoEgreso) throw new Error('Tipo de egreso no encontrado');
        if (!tipoEgreso) { throw new NotFoundException( `El tipo de egreso con ID ${data.id_tipo_egreso} no existe.`,);}

        return this.prisma.egreso.create({
            data: {
                ...data,
                fecha: new Date(data.fecha),
                status: StatusEgreso.REGISTRADO,
            },
        });
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
}
