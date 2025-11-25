import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Delete } from '@nestjs/common';
import { HorarioService } from './horario.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Rol } from 'src/common/enums';
import { SyncHorarioDto } from './dto/sincronizar-horario.dto';

@Controller('horario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HorarioController {
    constructor(private readonly horarioService: HorarioService) {}

    @Get()
    @Roles(Rol.DENTISTA)
    listar(@Req() req: any) {
        const usuario = req.user;
        return this.horarioService.obtenerHorarios(usuario.id_consultorio);
    }

    @Post()
    @Roles(Rol.DENTISTA, Rol.ADMINISTRADOR)
    crear(@Body() dto: CreateHorarioDto, @Req() req: any) {
        const usuario = req.user;
        return this.horarioService.crearHorario(usuario.id_consultorio, dto);
    }

    @Patch('update/:id')
    @Roles(Rol.DENTISTA)
    actualizar(@Param('id') id: string, @Body() dto: UpdateHorarioDto) {
        return this.horarioService.actualizarHorario(Number(id), dto);
    }

    /*@Patch('delete/:id')
    @Roles(Rol.DENTISTA)
    desactivarTurno(@Param('id') id: string) {
        return this.horarioService.desactivarTurno(Number(id));
    }*/

    @Delete('delete/:id')
    @Roles(Rol.DENTISTA)
    eliminar(@Param('id') id: string) {
        return this.horarioService.eliminarHorario(Number(id));
    }

    @Post('sync')
    @Roles(Rol.DENTISTA)
    sincronizar(@Body() payload: SyncHorarioDto[], @Req() req: any) {
        const usuario = req.user;
        return this.horarioService.sincronizarHorarios(usuario.id_consultorio, payload);
    }


}

