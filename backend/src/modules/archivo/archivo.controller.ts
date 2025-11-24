import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ArchivoService } from './archivo.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Rol, StatusArchivo } from 'src/common/enums';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateArchivoDto } from './dto/create-archivo.dto';
import { UpdateArchivoDto } from './dto/update-archivo.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('archivo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArchivoController {
    constructor( private readonly archivoService: ArchivoService ) {}

    @Get('paciente/:id')
    @Roles(Rol.DENTISTA)
    listar(@Param('id') id: string) {
        return this.archivoService.obtenerArchivos(Number(id));
    }

    @Post('paciente/:id')
    @UseInterceptors(FileInterceptor('file'))
    @Roles(Rol.DENTISTA)
    subir(
        @Param('id') id: string,
        @Body() dto: CreateArchivoDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.archivoService.subirArchivo(Number(id), dto, file);
    }

    @Patch('update/:id')
    @UseInterceptors(FileInterceptor('file'))
    @Roles(Rol.DENTISTA)
    actualizar(
    @Param('id') id: string, @Body() dto: UpdateArchivoDto, @UploadedFile() file?: Express.Multer.File ) 
    {
        return this.archivoService.actualizarArchivo(Number(id), dto, file);
    }


    @Patch('ocultar/:id')
    @Roles(Rol.DENTISTA)
    ocultar(@Param('id') id: string) {
        return this.archivoService.ocultarArchivo(Number(id));
    }
}
