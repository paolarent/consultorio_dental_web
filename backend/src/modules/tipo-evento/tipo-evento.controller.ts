import { Controller, Post, Body, Get, Query, Patch, Param } from '@nestjs/common';
import { TipoEventoService } from './tipo-evento.service';
import { CreateTipoEventoDto } from './dto/create-tipo-evento.dto';

@Controller('tipo-evento')
export class TipoEventoController {
    constructor(private readonly tipoEventoService: TipoEventoService) {}

    @Post()
    create(@Body() dto: CreateTipoEventoDto) {
        return this.tipoEventoService.create(dto);
    }

    @Get()
    findAll(@Query('id_consultorio') id_consultorio?: string) {
        return this.tipoEventoService.findAll(id_consultorio ? Number(id_consultorio) : undefined);
    }

    @Patch(':id/desactivar')
    softDelete(@Param('id') id: string) {
        return this.tipoEventoService.softDelete(Number(id));
    }
}
