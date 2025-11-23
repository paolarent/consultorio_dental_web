import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, Request, BadRequestException, Query } from '@nestjs/common';
import { PacienteUtilsService } from 'src/common/services/paciente-utils.service';
import { CondicionMedicaService } from './condicion-medica.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Rol } from 'src/common/enums';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateCondicionMedicaDto } from './dto/create-condicion-med.dto';

@Controller('condiciones-medicas')
export class CondicionMedicaController {
    constructor(
        private readonly condicionMedService: CondicionMedicaService,
        private pacienteUtils: PacienteUtilsService
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.PACIENTE, Rol.DENTISTA)
    agregar(@Body() dto: CreateCondicionMedicaDto, @Request() req: any) {
        let id_paciente: number;

        if (req.user.rol === Rol.PACIENTE) {
            // Para pacientes, obtenemos id_paciente desde el service a partir de id_usuario
            id_paciente = req.user.id_usuario; // temporal, el service hará la conversión
        } else {
            // Para dentista, se envía explícitamente en el DTO
            if (!dto.id_paciente) throw new BadRequestException('Debe enviar id_paciente');
            id_paciente = dto.id_paciente;
        }

        return this.condicionMedService.agregarCondicion(dto, id_paciente, req.user.rol);
    }

    @Get('tipos')
    listarTipos() {
        return this.condicionMedService.listarTiposCondMed();
    }

    @Get('mis-condiciones-medicas')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.PACIENTE, Rol.DENTISTA)
    async listarPaciente(@Req() req, @Query('idPaciente') idPaciente?: string) {
        let pacienteId: number;

        if (idPaciente) {
            // Si manda idPaciente (dentista desde expediente)
            pacienteId = Number(idPaciente);
        } else {
            // Si no, tomar de la sesión (paciente)
            const paciente = await this.pacienteUtils.obtenerPacientePorUsuario(req.user.id_usuario);
            pacienteId = paciente.id_paciente;
        }

        return this.condicionMedService.listarCMPorPaciente(pacienteId);
    }

    @Get('paciente/:id_paciente')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    listarPorPaciente(@Param('id_paciente') id_paciente: string) {
        return this.condicionMedService.listarCMPorPaciente(Number(id_paciente));
    }

    @Patch('descartar/:id_condicion_medica')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.PACIENTE, Rol.DENTISTA)
    descartar(@Param('id_condicion_medica') id_condicion_medica: string) {
        return this.condicionMedService.descartarCondMed(Number(id_condicion_medica));
    }
}
