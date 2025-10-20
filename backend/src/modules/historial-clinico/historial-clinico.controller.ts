import { Body, Controller, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { HistorialClinicoService } from './historial-clinico.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Rol } from 'src/common/enums';
import { CreateHistorialDto } from './dto/create-historial.dto';
import { UpdateHistorialDto } from './dto/update-historial.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('historial-clinico')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HistorialClinicoController {
    constructor( private readonly historialService: HistorialClinicoService ) {}

    @Post()
    @UseInterceptors(FilesInterceptor('fotos')) // Formulario envía array 'fotos'
    @Roles(Rol.DENTISTA)
    crear(@Body() dto: CreateHistorialDto, @UploadedFiles() fotos?: Express.Multer.File[]) {
        if (fotos) dto.fotos = fotos;
        return this.historialService.crearHistorial(dto);
    }

    @Get(':id_paciente')
    @Roles(Rol.DENTISTA)
    listar(@Param('id_paciente') id_paciente: string) {
        return this.historialService.obtenerHistorial(Number(id_paciente));
    }

    @Patch('update/:id_historial')
    @UseInterceptors(FilesInterceptor('fotos'))
    @Roles(Rol.DENTISTA)
    actualizar(
        @Param('id_historial') id_historial: string,
        @Body() dto: UpdateHistorialDto,
        @UploadedFiles() fotos?: Express.Multer.File[],
    ) {
        return this.historialService.actualizarHistorial(Number(id_historial), dto, fotos);
    }


    @Patch('foto/delete/:id_foto')
    @Roles(Rol.DENTISTA)
    eliminarFoto(@Param('id_foto') id_foto: string) {
        return this.historialService.eliminarFoto(Number(id_foto));
    }

    @Patch('delete/:id_historial')
    @Roles(Rol.DENTISTA)
    desactivar(@Param('id_historial') id_historial: string) {
        return this.historialService.desactivarHistorial(Number(id_historial));
    }
}
