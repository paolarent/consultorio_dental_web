import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCondicionMedicaDto } from './dto/create-condicion-med.dto';
import { Rol, StatusCondicionMed } from 'src/common/enums';
import { PacienteUtilsService } from 'src/common/services/paciente-utils.service';

@Injectable()
export class CondicionMedicaService {
    constructor(
        private prisma: PrismaService, 
        private pacienteUtils: PacienteUtilsService
    ) {}

    async agregarCondicion(dto: CreateCondicionMedicaDto, id: number, rol: Rol) {
        let id_paciente: number;

        if (rol === Rol.PACIENTE) {
            const paciente = await this.pacienteUtils.obtenerPacientePorUsuario(id);
            id_paciente = paciente.id_paciente;
        } else {
            id_paciente = id;
        }

        return this.prisma.condicion_medica.create({
            data: {
                id_paciente,
                id_tipo_condicion: dto.id_tipo_condicion!,
                nombre: dto.nombre,
                a_o_diagnostico: dto.a_o_diagnostico,
                medicamentos_actuales: dto.medicamentos_actuales,
                condicion_controlada: dto.condicion_controlada,
                status: StatusCondicionMed.ACTIVA
            },
        });
    }

    async listarTiposCondMed() {
        return this.prisma.tipo_condicion_med.findMany({
            select: {
            id_tipo_condicion: true,
            nombre: true
            }
        });
    }

    async listarCMPorPaciente(id_paciente: number) {
        return this.prisma.condicion_medica.findMany({
            where: { id_paciente, status: StatusCondicionMed.ACTIVA },
            select: {
                id_condicion_medica: true,
                nombre: true,
                a_o_diagnostico: true,
                medicamentos_actuales: true,
                condicion_controlada: true
            },
            orderBy: { a_o_diagnostico: 'desc' },
        });
    }

    async descartarCondMed(id_condicion_medica: number) {
        const condicion = await this.prisma.condicion_medica.findUnique({ where: { id_condicion_medica } });
        if (!condicion) throw new NotFoundException('Condicion Medica no encontrada');

        return this.prisma.condicion_medica.update({
            where: { id_condicion_medica },
            data: { status:  StatusCondicionMed.DESCARTADA },
        });
    }
}

