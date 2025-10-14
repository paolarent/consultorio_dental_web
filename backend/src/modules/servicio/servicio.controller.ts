import { Controller, Query, Get, Post, Patch, Body, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Controller('servicio')
export class ServicioController {
    constructor( private readonly servicioService: ServicioService ) {}

    @Get('activo')
    findAllActive(@Query('id_consultorio') id_consultorio?: string) {
        return this.servicioService.findAllActive(id_consultorio ? Number(id_consultorio) : undefined);
    }

    @Post()
    @UseInterceptors(FileInterceptor('imagen'))
    createServicio(@Body() dto: CreateServicioDto, @UploadedFile() file: Express.Multer.File) {
        return this.servicioService.createServicio(dto, file);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('imagen'))
    updateServicio(
        @Param('id') id: string,
        @Body() dto: UpdateServicioDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.servicioService.updateServicio(Number(id), dto, file);
    }

    @Patch('soft-delete/:id')
    softDelete(@Param('id') id: string) {
        return this.servicioService.softDelete(Number(id));
    }
}
