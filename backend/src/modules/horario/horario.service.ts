import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { status } from '@prisma/client';
import { Status } from 'src/common/enums';

@Injectable()
export class HorarioService {
    constructor(private prisma: PrismaService) {}

    // Listar todos los horarios de un consultorio
    async obtenerHorarios(id_consultorio: number) {
        return this.prisma.horario.findMany({
            where: { id_consultorio, status: Status.ACTIVO },
            orderBy: [{ dia: 'asc' }, { hora_inicio: 'asc' }],
        });
    }

    // Crear un nuevo horario
    async crearHorario(id_consultorio: number, dto: CreateHorarioDto) {
        return this.prisma.horario.create({
            data: {
                id_consultorio,
                dia: dto.dia,
                hora_inicio: dto.hora_inicio,
                hora_fin: dto.hora_fin,
                status: dto.status ?? Status.ACTIVO,
            },
        });
    }

    // Actualizar un horario existente
    async actualizarHorario(id_horario: number, dto: UpdateHorarioDto) {
        const horario = await this.prisma.horario.findUnique({ where: { id_horario } });
        if (!horario) throw new NotFoundException('Horario no encontrado');

        return this.prisma.horario.update({
            where: { id_horario },
            data: {
                dia: dto.dia ?? horario.dia,
                hora_inicio: dto.hora_inicio ?? horario.hora_inicio,
                hora_fin: dto.hora_fin ?? horario.hora_fin,
            },
        });
    }

    // Activar / desactivar (soft delete)
    async desactivarTurno(id_horario: number) {
        const horario = await this.prisma.horario.findUnique({ where: { id_horario } });
        if (!horario) throw new NotFoundException('Horario no encontrado');

        return this.prisma.horario.update({
            where: { id_horario },
            data: { status: Status.INACTIVO },
        });
    }
}
