import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PacienteUtilsService } from './services/paciente-utils.service';

@Module({
    providers: [PrismaService, PacienteUtilsService],
    exports: [PacienteUtilsService], // permite que otros módulos inyecten el servicio
})
export class CommonModule {}
