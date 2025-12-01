import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { StatusEvento } from 'src/common/enums';

@Controller('evento')
export class EventoController {
    constructor(private readonly eventoService: EventoService) {}

    @Get('activo')
    async findAllActive(@Query('id_consultorio') id_consultorio?: string) {
        try {
            return await this.eventoService.findAllActive(
                id_consultorio ? Number(id_consultorio) : undefined
            );
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Get('tipos')
    //@Public()
    listarTipos() {
        return this.eventoService.listarTiposEvento();
    }

    @Post()
    create(@Body() data: CreateEventoDto) {
        return this.eventoService.createEvento(data);
    }

    @Patch(':id/cancelar')
    cancelar(@Param('id') id: string) {
        return this.eventoService.updateEvento(Number(id), StatusEvento.CANCELADO);
    }

    @Patch(':id/finalizar')
    finalizar(@Param('id') id: string) {
        return this.eventoService.updateEvento(Number(id), StatusEvento.FINALIZADO);
    }
}


