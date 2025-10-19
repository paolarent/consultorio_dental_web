import { Controller, Post, Body, Get, Query, Patch, Param, UseGuards } from '@nestjs/common';
import { TipoEventoService } from './tipo-evento.service';
import { CreateTipoEventoDto } from './dto/create-tipo-evento.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Rol } from 'src/common/enums';

@Controller('tipo-evento')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
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

    @Patch('desactivar/:id')
    softDelete(@Param('id') id: string) {
        return this.tipoEventoService.softDelete(Number(id));
    }
}
