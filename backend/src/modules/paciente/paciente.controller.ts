import { Controller, Get, Post, Body, Param, Patch, Req, Query, UseGuards } from '@nestjs/common';
import { PacienteService } from './paciente.service';
import { CreatePacienteDto } from '../paciente/dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Rol } from 'src/common/enums';

@Controller('paciente')
export class PacienteController {
    constructor(private readonly pacienteService: PacienteService) {}

    @Get('buscar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    buscarPacientes(@Query('q') q: string, @Req() req) {
        console.log('QUERY', q); // <-- aquí solo 'q'
        const id_consultorio = req.user.consultorioId;
        return this.pacienteService.buscarPacientes(id_consultorio, q);
    }

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
