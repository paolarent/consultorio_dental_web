import { Controller, Get, Query, BadRequestException, Post, Patch, Body, Param } from '@nestjs/common';
import { EgresoService } from './egreso.service';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { StatusEgreso } from 'src/common/enums';

@Controller('egreso')
export class EgresoController {
    constructor(private readonly egresoService: EgresoService) {}

    @Get('registrado')
    async findAllActive(@Query('id_consultorio') id_consultorio?: string) {
        try {
            return await this.egresoService.findAllRegistered(
            id_consultorio ? Number(id_consultorio) : undefined
            );
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Post()
    create(@Body() dto: CreateEgresoDto) {
        return this.egresoService.create(dto);
    }

    @Patch(':id/anular')
    updateStatus(@Param('id') id: string) {
        return this.egresoService.updateEgreso(Number(id), StatusEgreso.ANULADO);
    }
}
