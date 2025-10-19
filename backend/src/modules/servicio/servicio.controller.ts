import { Controller, Query, Get, Post, Patch, Body, UseInterceptors, UploadedFile, Param, UseGuards, Req } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Rol } from 'src/common/enums';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('servicio')
export class ServicioController {
    constructor( private readonly servicioService: ServicioService ) {}

    @Get('activo')
    findAllActive(@Query('id_consultorio') id_consultorio?: string) {
        return this.servicioService.findAllActive(id_consultorio ? Number(id_consultorio) : undefined);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    @UseInterceptors(FileInterceptor('imagen'))
    createServicio(@Body() dto: CreateServicioDto, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
        const usuarioAuth = req.user; 
        
        dto.id_consultorio = usuarioAuth.id_consultorio;

        return this.servicioService.createServicio(dto, file);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    @UseInterceptors(FileInterceptor('imagen'))
    updateServicio(
        @Param('id') id: string,
        @Body() dto: UpdateServicioDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.servicioService.updateServicio(Number(id), dto, file);
    }

    @Patch('soft-delete/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    softDelete(@Param('id') id: string) {
        return this.servicioService.softDelete(Number(id));
    }
}
