import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { PacienteUtilsService } from 'src/common/services/paciente-utils.service';
import { CondicionMedicaService } from './condicion-medica.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Rol } from 'src/common/enums';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateCondicionMedicaDto } from './dto/create-condicion-med.dto';

@Controller('condiciones-medicas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CondicionMedicaController {
    constructor(
        private readonly condicionMedService: CondicionMedicaService,
        private pacienteUtils: PacienteUtilsService
    ) {}

    @Post()
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

    @Get('mis-condiciones-medicas')
    @Roles(Rol.PACIENTE)
    async listarPaciente(@Req() req) {
        // Obtener id_paciente a partir del id_usuario del JWT
        const paciente = await this.pacienteUtils.obtenerPacientePorUsuario(req.user.id_usuario);
        return this.condicionMedService.listarCMPorPaciente(paciente.id_paciente);
    }

    @Get('paciente/:id_paciente')
    @Roles(Rol.DENTISTA)
    listarPorPaciente(@Param('id_paciente') id_paciente: string) {
        return this.condicionMedService.listarCMPorPaciente(Number(id_paciente));
    }

    @Patch('descartar/:id_condicion_medica')
    @Roles(Rol.PACIENTE, Rol.DENTISTA)
    descartar(@Param('id_condicion_medica') id_condicion_medica: string) {
        return this.condicionMedService.descartarCondMed(Number(id_condicion_medica));
    }
}
