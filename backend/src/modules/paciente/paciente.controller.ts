import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { PacienteService } from './paciente.service';
import { CreatePacienteDto } from '../paciente/dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Controller('paciente')
export class PacienteController {
    constructor(private readonly pacienteService: PacienteService) {}

    @Get('activo') 
    findAllActive() {
        return this.pacienteService.findAllActive();
    }

    @Get(':id')
    async getPacienteById(@Param('id') id: string) {
        return this.pacienteService.getPacienteById(Number(id));
    }

    @Post()
    create(@Body() createPacienteDto: CreatePacienteDto) {
        return this.pacienteService.create(createPacienteDto);
    }

    @Patch(':id')
    updatePaciente(
        @Param('id') id: string,
        @Body() data: UpdatePacienteDto,
    ) {
        return this.pacienteService.updatePaciente(Number(id), data);
    }
}
