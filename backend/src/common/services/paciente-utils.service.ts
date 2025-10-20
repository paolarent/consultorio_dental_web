import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PacienteUtilsService {
    constructor(private prisma: PrismaService) {}

    async obtenerPacientePorUsuario(id_usuario: number) {
        const paciente = await this.prisma.paciente.findUnique({
            where: { id_usuario },
        });
        if (!paciente) throw new NotFoundException('Paciente no encontrado');
        return paciente;
    }
}
