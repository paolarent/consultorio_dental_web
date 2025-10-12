import { Controller, Get, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConsultorioService } from './consultorio.service';
import { CreateConsultorioDto } from './dto/create-consultorio.dto';

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
}