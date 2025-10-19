import { Controller, Post, Body, Param, Patch, UseGuards, Req} from '@nestjs/common';
import { RegistroService } from './registro.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Rol } from 'src/common/enums';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('registro')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistroController {
    constructor(private readonly registroService: RegistroService) {}

    // Endpoint para registrar paciente completo (ambas tablas)
    @Post('paciente-completo')
    @Roles(Rol.DENTISTA)
    async createPacienteCompleto(@Body() data: CreateRegistroDto, @Req() req: any) {
        const usuarioAuth = req.user; // { id_usuario, rol, id_consultorio }

        // Asignar automáticamente el id_consultorio del dentista q registra el usuario
        data.id_consultorio = usuarioAuth.id_consultorio;

        return this.registroService.registrarPacienteCompleto(data);
    }


    @Patch('paciente-logical/:usuarioId/:pacienteId')
    @Roles(Rol.DENTISTA)
    async deletePacienteLogical(
        @Param('usuarioId') usuarioId: number,
        @Param('pacienteId') pacienteId: number,
    ) {
        return this.registroService.deletePacienteLogical(usuarioId, pacienteId);
    }

}


