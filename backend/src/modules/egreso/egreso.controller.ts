import { Controller, Get, Query, BadRequestException, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { EgresoService } from './egreso.service';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { Rol, StatusEgreso } from 'src/common/enums';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('egreso')
export class EgresoController {
    constructor(private readonly egresoService: EgresoService) {}

    @Get('registrado')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    async findAllActive(@Query('id_consultorio') id_consultorio?: string) {
        try {
            return await this.egresoService.findAllRegistered(
            id_consultorio ? Number(id_consultorio) : undefined
            );
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Get('tipos')
    //@Public()
    listarTipos() {
        return this.egresoService.listarTiposGasto();
    }

    
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    create(@Body() dto: CreateEgresoDto, @Req() req) {
    // id_consultorio lo tomamos del JWT validado
    const id_consultorio = req.user.id_consultorio;
    return this.egresoService.create(dto, id_consultorio);
    }



    @Patch(':id/anular')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    updateStatus(@Param('id') id: string) {
        return this.egresoService.updateEgreso(Number(id), StatusEgreso.ANULADO);
    }
}
