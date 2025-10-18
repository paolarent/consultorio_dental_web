import { Controller, Post, Body, Param, Patch, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { RegistroService } from './registro.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Rol } from 'src/common/enums';

@Controller('registro')
export class RegistroController {
    constructor(private readonly registroService: RegistroService) {}

    // Endpoint para registrar paciente completo
    @Post('paciente-completo')
    @UseGuards(JwtAuthGuard)
    async createPacienteCompleto(@Body() data: CreateRegistroDto, @Req() req: any) {
        const usuarioAuth = req.user; // { id_usuario, rol, id_consultorio }

        // Solo dentistas pueden registrar
        if (usuarioAuth.rol !== Rol.DENTISTA) {
            throw new UnauthorizedException('Solo dentistas pueden registrar pacientes');
        }

        // Asignar automáticamente el id_consultorio del dentista q registra el usuario
        data.id_consultorio = usuarioAuth.id_consultorio;

        return this.registroService.registrarPacienteCompleto(data);
    }


    @Patch('paciente-logical/:usuarioId/:pacienteId')
    @UseGuards(JwtAuthGuard)
    async deletePacienteLogical(
        @Param('usuarioId') usuarioId: number,
        @Param('pacienteId') pacienteId: number,
        @Req() req: any,  // para obtener info del usuario logueado
    ) {
        const usuarioAuth = req.user; // { id_usuario, rol, id_consultorio }

        // Validar que solo dentistas puedan 'eliminar' pacientes
        if (usuarioAuth.rol !== Rol.DENTISTA) {
            throw new UnauthorizedException('Solo dentistas pueden desactivar pacientes');
        }

        return this.registroService.deletePacienteLogical(usuarioId, pacienteId);
    }

}


