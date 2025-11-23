import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request, Req, BadRequestException, Query } from '@nestjs/common';
import { AlergiaService } from './alergia.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Rol } from 'src/common/enums';
import { CreateAlergiaDto } from './dto/create-alergia.dto';
import { PacienteUtilsService } from 'src/common/services/paciente-utils.service';

@Controller('alergias')
export class AlergiaController {
    constructor(
        private readonly alergiaService: AlergiaService,
        private pacienteUtils: PacienteUtilsService
    ) {}

    //Crear alergia (puede ser desde paciente o dentista)
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.PACIENTE, Rol.DENTISTA)
    agregar(@Body() dto: CreateAlergiaDto, @Request() req: any) {
        let id_paciente: number;

        if (req.user.rol === Rol.PACIENTE) {
            // Para pacientes, obtenemos id_paciente desde el service a partir de id_usuario
            id_paciente = req.user.id_usuario; // temporal, el service hará la conversión
        } else {
            // Para dentista, se envía explícitamente en el DTO
            if (!dto.id_paciente) throw new BadRequestException('Debe enviar id_paciente');
            id_paciente = dto.id_paciente;
        }

        return this.alergiaService.agregarAlergia(dto, id_paciente, req.user.rol);
    }

    @Get('tipos')
    //@Public()
    listarTipos() {
        return this.alergiaService.listarTiposAlergia();
    }

    //LISTAR LAS ALERGIAS
    //Para el paciente
    @Get('mis-alergias')
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

        return this.alergiaService.listarPorPaciente(pacienteId);
    }

    //Para el dentista que consulta un paciente específico
    @Get('paciente/:id_paciente')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    listarPorPaciente(@Param('id_paciente') id_paciente: string) {
        return this.alergiaService.listarPorPaciente(Number(id_paciente));
    }

    //Desactivar alergia
    @Patch('desactivar/:id_alergia')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.PACIENTE, Rol.DENTISTA)
    desactivar(@Param('id_alergia') id_alergia: string) {
        return this.alergiaService.desactivarAlergia(Number(id_alergia));
    }
}
