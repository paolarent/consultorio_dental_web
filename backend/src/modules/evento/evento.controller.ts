import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { Rol, StatusEvento } from 'src/common/enums';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Controller('evento')
export class EventoController {
    constructor(private readonly eventoService: EventoService) {}

    @Get('activos')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    listarActivos(@Req() req: any) {
        return this.eventoService.listarEventosActivos(req.user.id_consultorio);
    }

    @Get('tipos')
    //@Public()
    listarTipos() {
        return this.eventoService.listarTiposEvento();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    create(@Body() data: CreateEventoDto, @Req() req: any) {
        const id_consultorio = req.user.id_consultorio;
        return this.eventoService.createEvento(data, id_consultorio);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    obtenerEvento(@Param('id') id: string, @Req() req: any) {
        const id_consultorio = req.user.id_consultorio;
        return this.eventoService.obtenerEvento(Number(id), id_consultorio);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    update(
        @Param('id') id: string, 
        @Body() data: UpdateEventoDto, 
        @Req() req: any
    ) {
        const id_consultorio = req.user.id_consultorio;
        return this.eventoService.updateEventoCompleto(Number(id), data, id_consultorio);
    }

    @Patch(':id/cancelar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    cancelar(@Param('id') id: string) {
        return this.eventoService.updateStatusEvento(Number(id), StatusEvento.CANCELADO);
    }

    @Patch(':id/finalizar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    finalizar(@Param('id') id: string) {
        return this.eventoService.updateStatusEvento(Number(id), StatusEvento.FINALIZADO);
    }
}


