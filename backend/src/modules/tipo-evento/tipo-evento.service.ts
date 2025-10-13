import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTipoEventoDto } from './dto/create-tipo-evento.dto';

@Injectable()
export class TipoEventoService {
    constructor(private prisma: PrismaService) {}

    //Crear un nuevo tipo de evento
    async create(data: CreateTipoEventoDto) {
        return this.prisma.tipo_evento.create({
            data,
        });
    }

    //Listar todos los tipos de evento (opcionalmente filtrando por consultorio)
    async findAll(id_consultorio?: number) {
        return this.prisma.tipo_evento.findMany({
        where: id_consultorio ? { id_consultorio } : {},
        /*include: {
            consultorio: true,
        },*/
        });
    }

    //cambio status a "inactivo"
    async softDelete(id: number) {
        return this.prisma.tipo_evento.update({
        where: { id_tipo_evento: id },
        data: { status: 'inactivo' },
        });
    }
}
