import { Controller, Get, Post, Body } from '@nestjs/common';
import { PacienteService } from './paciente.service';
import { CreatePacienteDto } from './create-paciente.dto';

@Controller('paciente')
export class PacienteController {
    constructor(private readonly pacienteService: PacienteService) {}

    @Get('activo') 
    findAllActive() {
        return this.pacienteService.findAllActive();
    }

    @Post()
    create(@Body() createPacienteDto: CreatePacienteDto) {
        return this.pacienteService.create(createPacienteDto);
    }
}
