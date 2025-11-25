import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { Status } from 'src/common/enums';

@Injectable()
export class HorarioService {
    constructor(private prisma: PrismaService) {}

    private convertirHora(hora: string): number {
        // Espera formatos: "8 AM", "1 PM", "12 AM", "12 PM"
        const partes = hora.trim().split(' ');
        const numero = parseInt(partes[0], 10);
        const meridiano = partes[1]?.toUpperCase() ?? '';

        if (meridiano === 'PM' && numero !== 12) return numero + 12;
        if (meridiano === 'AM' && numero === 12) return 0;

        return numero;
    }

    //VALIDACIONES SUPER IMPORTANTES
    private validarHoras(inicio: string, fin: string) {
        if (!inicio || !fin) {
            throw new BadRequestException('Las horas no pueden estar vacías');
        }

        const inicio24 = this.convertirHora(inicio);
        const fin24 = this.convertirHora(fin);

        if (inicio24 >= fin24) {
            throw new BadRequestException(
                'La hora de inicio debe ser menor que la hora de fin'
            );
        }
    }

    private async validarTraslape(
        id_consultorio: number,
        dia: number,
        inicio: string,
        fin: string,
        ignorarId?: number
    ) {
        const horarios = await this.prisma.horario.findMany({
            where: { id_consultorio, dia, status: Status.ACTIVO }
        });

        const inicio24 = this.convertirHora(inicio);
        const fin24 = this.convertirHora(fin);

        const traslape = horarios.some(h => {
            const hInicio24 = this.convertirHora(h.hora_inicio);
            const hFin24 = this.convertirHora(h.hora_fin);

            return (
                h.id_horario !== ignorarId &&
                (
                    (inicio24 >= hInicio24 && inicio24 < hFin24) ||
                    (fin24 > hInicio24 && fin24 <= hFin24) ||
                    (inicio24 <= hInicio24 && fin24 >= hFin24)
                )
            );
        });

        if (traslape) {
            throw new BadRequestException('Las horas se traslapan con otro turno existente');
        }
    }

    // Listar todos los horarios de un consultorio
    async obtenerHorarios(id_consultorio: number) {
        return this.prisma.horario.findMany({
            where: { id_consultorio, status: Status.ACTIVO },
            orderBy: [{ dia: 'asc' }, { hora_inicio: 'asc' }],
        });
    }

    // Crear un nuevo horario
    async crearHorario(id_consultorio: number, dto: CreateHorarioDto) {
        this.validarHoras(dto.hora_inicio, dto.hora_fin);
        await this.validarTraslape(id_consultorio, dto.dia, dto.hora_inicio, dto.hora_fin);

        return this.prisma.horario.create({
            data: {
                id_consultorio,
                dia: dto.dia,
                hora_inicio: dto.hora_inicio,
                hora_fin: dto.hora_fin,
                status: Status.ACTIVO,
            },
        });
    }

    // Actualizar un horario existente
    async actualizarHorario(id_horario: number, dto: UpdateHorarioDto) {
        const horario = await this.prisma.horario.findUnique({ where: { id_horario } });
        if (!horario) throw new NotFoundException('Horario no encontrado');

        const inicio = dto.hora_inicio ?? horario.hora_inicio;
        const fin = dto.hora_fin ?? horario.hora_fin;

        this.validarHoras(inicio, fin);
        await this.validarTraslape(horario.id_consultorio, horario.dia, inicio, fin, id_horario);

        return this.prisma.horario.update({
            where: { id_horario },
            data: { hora_inicio: inicio, hora_fin: fin }
        });
    }

    //desactivar (soft delete)
    async desactivarTurno(id_horario: number) {
        const horario = await this.prisma.horario.findUnique({ where: { id_horario } });
        if (!horario) throw new NotFoundException('Horario no encontrado');

        return this.prisma.horario.update({
            where: { id_horario },
            data: { status: Status.INACTIVO },
        });
    }

    async eliminarHorario(id_horario: number) {
        const horario = await this.prisma.horario.findUnique({ where: { id_horario } });
        if (!horario) throw new NotFoundException('Horario no encontrado');

        return this.prisma.horario.delete({
            where: { id_horario }
        });
    }

    async sincronizarHorarios(id_consultorio: number, payload: any[]) {
        for (const item of payload) {

            // ELIMINAR
            if (item.delete) {
                await this.eliminarHorario(item.delete);
                continue;
            }

            // CREAR
            if (!item.id) {
                this.validarHoras(item.inicio, item.fin);
                await this.validarTraslape(id_consultorio, item.dia, item.inicio, item.fin);

                await this.prisma.horario.create({
                    data: {
                        id_consultorio,
                        dia: item.dia,
                        hora_inicio: item.inicio,
                        hora_fin: item.fin,
                        status: Status.ACTIVO
                    }
                });
                continue;
            }

            // ACTUALIZAR
            await this.actualizarHorario(item.id, {
                hora_inicio: item.inicio,
                hora_fin: item.fin
            });
        }

        return { message: 'Horarios sincronizados correctamente' };
    }


}
