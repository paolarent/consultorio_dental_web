import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { Status, StatusEvento } from 'src/common/enums';
import { status_evento } from '@prisma/client';

@Injectable()
export class EventoService {
    constructor( private prisma: PrismaService ) {}

    async listarEventosActivos(id_consultorio: number) {
        return this.prisma.evento.findMany({
            where: {
            id_consultorio,
            status: StatusEvento.ACTIVO
            }
        });
    }

    async listarTiposEvento() {
        return this.prisma.tipo_evento.findMany({
            where: { status: Status.ACTIVO },
            select: {
                id_tipo_evento: true,
                nombre: true
            },
                orderBy: {
                id_tipo_evento: 'asc'
            }
        });
    }

    async createEvento(data: CreateEventoDto, id_consultorio: number) { 
        const tipoEvento = await this.prisma.tipo_evento.findUnique({
            where: {id_tipo_evento: data.id_tipo_evento}
        });

        if (!tipoEvento) throw new Error('Tipo de evento no encontrado');

        if (tipoEvento.id_consultorio !== id_consultorio) {
            throw new Error('El tipo de evento no pertenece al consultorio seleccionado');
        }

        return this.prisma.evento.create({
            data: {
                ...data,
                fecha_inicio: new Date(data.fecha_inicio), 
                fecha_fin: new Date(data.fecha_fin),  
                id_consultorio,
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
