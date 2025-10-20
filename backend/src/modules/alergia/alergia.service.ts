import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAlergiaDto } from './dto/create-alergia.dto';
import { Rol, StatusAlergia } from 'src/common/enums';
import { PacienteUtilsService } from 'src/common/services/paciente-utils.service';

@Injectable()
export class AlergiaService {
    constructor(
        private prisma: PrismaService,
        private pacienteUtils: PacienteUtilsService 
    ) {}

    // Crear alergia (paciente o dentista)
    async agregarAlergia(dto: CreateAlergiaDto, id: number, rol: Rol) {
        let id_paciente: number;

        if (rol === Rol.PACIENTE) {
            const paciente = await this.pacienteUtils.obtenerPacientePorUsuario(id); // Reutilizas la función
            id_paciente = paciente.id_paciente;
        } else {
            id_paciente = id; // Dentista ya envió id_paciente
        }

        return this.prisma.alergia.create({
            data: {
                id_paciente,
                id_tipo_alergia: dto.id_tipo_alergia!,
                nombre: dto.nombre,
                severidad: dto.severidad,
                notas: dto.notas,
                status: StatusAlergia.ACTIVA,
            },
        });
    }

    // Listar alergias activas de un paciente
    async listarPorPaciente(id_paciente: number) {
        return this.prisma.alergia.findMany({
        where: { id_paciente, status: StatusAlergia.ACTIVA },
        select: {
            id_alergia: true,
            nombre: true,
            notas: true,
            severidad: true,
            tipo_alergia: {
            select: {
                id_tipo_alergia: true,
                nombre: true,
            },
            },
        },
        });
    }

    // Desactivar (cambiar status a DESCARTADA)
    async desactivarAlergia(id_alergia: number) {
        const alergia = await this.prisma.alergia.findUnique({
        where: { id_alergia },
        });
        if (!alergia) throw new NotFoundException('Alergia no encontrada');

        return this.prisma.alergia.update({
        where: { id_alergia },
        data: { status: StatusAlergia.DESCARTADA },
        });
    }
}
