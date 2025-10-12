import { Controller, Get, Post, Body, UploadedFile, UseInterceptors, Patch, ParseIntPipe, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConsultorioService } from './consultorio.service';
import { CreateConsultorioDto } from './dto/create-consultorio.dto';
import { UpdateConsultorioDto } from './dto/update-consultorio.dto';

@Controller('consultorios')
export class ConsultorioController {
    constructor(private readonly consultorioService: ConsultorioService) {}

    @Get()
    async getAll() {
        return this.consultorioService.findAll();
    }

    @Post()
    @UseInterceptors(FileInterceptor('logo'))
    async create(
        @Body() dto:CreateConsultorioDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.consultorioService.createConsultorio(dto, file);
    }

    @Patch(':id/delete')
    async delete(@Param('id', ParseIntPipe) id:number) {
        return this.consultorioService.deleteLogical(id);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('logo'))
    async updatePartial(
        @Param('id') id: string,
        @Body() dto: UpdateConsultorioDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.consultorioService.updateConsultorio(Number(id), dto, file);
    }
    
}