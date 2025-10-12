import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { RegistroService } from './registro.service';
import { CreateRegistroDto } from './dto/create-registro.dto';

@Controller('registro')
export class RegistroController {
    constructor(private readonly registroService: RegistroService) {}

    @Post('paciente-completo')
    createPacienteCompleto(@Body() data: CreateRegistroDto) {
        return this.registroService.registrarPacienteCompleto(data);
    }
    
    @Patch('paciente-logical/:usuarioId/:pacienteId')
    deletePacienteLogical(
        @Param('usuarioId') usuarioId: number,
        @Param('pacienteId') pacienteId: number
    ) {
        return this.registroService.deletePacienteLogical(usuarioId, pacienteId);
    }
}


