import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { StatusEvento } from 'src/common/enums';
import { status_evento } from '@prisma/client';

@Injectable()
export class EventoService {
    constructor( private readonly prisma: PrismaService ) {}

    async findAllActive(id_consultorio?: number) {
        if (id_consultorio) {
            const consultorioExiste = await this.prisma.consultorio.findUnique({
            where: { id_consultorio },
            });

            if (!consultorioExiste) {
            throw new Error(`El consultorio con id ${id_consultorio} no existe`);
            }
        }

        return this.prisma.evento.findMany({
            where: {
            status: 'activo',
            ...(id_consultorio && { id_consultorio }), // solo agrega si existe
            },
            orderBy: { fecha_inicio: 'asc' },
        });
    }

    async createEvento(data: CreateEventoDto) { 
        const tipoEvento = await this.prisma.tipo_evento.findUnique({
            where: {id_tipo_evento: data.id_tipo_evento}
        });

        if (!tipoEvento) throw new Error('Tipo de evento no encontrado');

        if (tipoEvento.id_consultorio !== data.id_consultorio) {
            throw new Error('El tipo de evento no pertenece al consultorio seleccionado');
        }

        return this.prisma.evento.create({
            data: {
                ...data,
                status: StatusEvento.ACTIVO,
            },
        });
    }

    async updateEvento(id_evento: number, nuevoStatus: status_evento) {
        return this.prisma.evento.update({
            where: { id_evento },
            data: { status: nuevoStatus }
        });
    }
}
