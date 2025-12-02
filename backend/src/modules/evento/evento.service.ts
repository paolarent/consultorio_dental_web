import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { Status, StatusEvento } from 'src/common/enums';
import { status_evento } from '@prisma/client';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventoService {
    constructor( private prisma: PrismaService ) {}

    async listarEventosActivos(id_consultorio: number) {
        return this.prisma.evento.findMany({
            where: {
                id_consultorio,
                status: StatusEvento.ACTIVO
            },
            include: {
                tipo_evento: true
            },
                orderBy: {
                fecha_inicio: 'asc'
            }
        });
    }

    async obtenerEvento(id_evento: number, id_consultorio: number) {
        const evento = await this.prisma.evento.findUnique({
            where: { id_evento },
            include: {
                tipo_evento: true
            }
        });

        if (!evento) {
            throw new Error('Evento no encontrado');
        }

        if (evento.id_consultorio !== id_consultorio) {
            throw new Error('No tienes permiso para ver este evento');
        }

        return evento;
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

    async updateEventoCompleto(
        id_evento: number, 
        data: UpdateEventoDto, 
        id_consultorio: number
    ) {
    // Verificar que el evento existe y pertenece al consultorio
    const eventoExistente = await this.prisma.evento.findUnique({
        where: { id_evento }
    });

    if (!eventoExistente) {
        throw new Error('Evento no encontrado');
    }

    if (eventoExistente.id_consultorio !== id_consultorio) {
        throw new Error('No tienes permiso para editar este evento');
    }

    // Si se está actualizando el tipo de evento, validarlo
    if (data.id_tipo_evento) {
        const tipoEvento = await this.prisma.tipo_evento.findUnique({
            where: { id_tipo_evento: data.id_tipo_evento }
        });

        if (!tipoEvento) {
            throw new Error('Tipo de evento no encontrado');
        }

        if (tipoEvento.id_consultorio !== id_consultorio) {
            throw new Error('El tipo de evento no pertenece a tu consultorio');
        }
    }

        // Preparar datos para actualizar
        const updateData: any = {};

        if (data.titulo !== undefined) updateData.titulo = data.titulo;
        if (data.id_tipo_evento !== undefined) updateData.id_tipo_evento = data.id_tipo_evento;
        if (data.fecha_inicio !== undefined) updateData.fecha_inicio = new Date(data.fecha_inicio);
        if (data.fecha_fin !== undefined) updateData.fecha_fin = new Date(data.fecha_fin);

        if (data.evento_todo_el_dia !== undefined) {
            updateData.evento_todo_el_dia = data.evento_todo_el_dia;

            if (data.evento_todo_el_dia === 'si') {
                // Todo el día → limpiar horas
                updateData.hora_inicio = null;
                updateData.hora_fin = null;
            } else {
                // No es todo el día → tomar horas del payload si vienen
                if (data.hora_inicio !== undefined) updateData.hora_inicio = data.hora_inicio;
                if (data.hora_fin !== undefined) updateData.hora_fin = data.hora_fin;
            }
        } else {
            // No se envió el cambio de todo el día → actualizar horas solo si vienen
            if (data.hora_inicio !== undefined) updateData.hora_inicio = data.hora_inicio;
            if (data.hora_fin !== undefined) updateData.hora_fin = data.hora_fin;
        }

        if (data.notas !== undefined) updateData.notas = data.notas;

        return this.prisma.evento.update({
            where: { id_evento },
            data: updateData
        });
    }

    async updateStatusEvento(id_evento: number, nuevoStatus: status_evento) {
        return this.prisma.evento.update({
            where: { id_evento },
            data: { status: nuevoStatus }
        });
    }
}
