import { Controller, Get, Post, Body, UploadedFile, UseInterceptors, Patch, ParseIntPipe, Param, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConsultorioService } from './consultorio.service';
import { CreateConsultorioDto } from './dto/create-consultorio.dto';
import { UpdateConsultorioDto } from './dto/update-consultorio.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Rol } from 'src/common/enums';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('consultorios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
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

    @Patch('delete/:id')
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