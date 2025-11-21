import { Body, Controller, Get, ParseIntPipe, Post, Param, Patch, UseGuards, Req, Query, Res, ValidationPipe } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateCorreoDto } from './dto/update-correo.dto';
import { UpdateContrasenaDto } from './dto/update-contrasena.dto';
import { Rol } from 'src/common/enums';
import { CreateDentistaDto } from './dto/create-dentista.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Response } from 'express';
//import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // pienso usar JWT tmb para login

@Controller('usuario')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

    @Get()
    findAll() {
        return this.usuarioService.findAll();
    }

    @Get('rol/:rol')
    findAllByRol(@Param('rol') rol: Rol) {
        return this.usuarioService.findAllByRol(rol);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA)
    create(@Body() data: CreateUsuarioDto) {
        return this.usuarioService.create(data);
    }

    @Post('dentista')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.ADMINISTRADOR)
    createDentista(@Body() data: CreateDentistaDto) {
        return this.usuarioService.createDentista(data);
    }

    @Patch(':id/delete')
    async delete(@Param('id', ParseIntPipe) id:number) {
        return this.usuarioService.deleteLogical(id);
    }

    // Confirmación de registro inicial (verifica el correo)
    @Patch('correo/confirmar-registro/:token')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.PACIENTE)
    confirmRegistro(@Param('token') token: string) {
        return this.usuarioService.confirmRegistro(token);
    }

    //endpoint que maneja la validacion del registro (CORREO + CONTRASEÑA)
    @Patch('/confirmar-registro')
    async confirmRegistroCorreoContrasena(
    @Body('token') token: string,
    @Body('nuevaContrasena') nuevaContrasena: string
    ) {
        return this.usuarioService.confirmRegistroCorreoContrasena(token, nuevaContrasena);
    }


    //Solicitar actualización de correo (envía token)
    @Patch(':id/correo/request')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    requestCorreoUpdate(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateCorreoDto,
    ) {
        return this.usuarioService.requestCorreoUpdate(id, body.correo);
    }

    // Confirmación de cambio de correo
    @Patch('correo/confirm/:token')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    confirmCorreoUpdate(@Param('token') token: string) {
        return this.usuarioService.confirmCorreoUpdate(token);
    }

    @Get('confirmar-cambio-correo')
    async confirmarCambioCorreo(
    @Query('token') token: string,
    @Res() res: Response,
    ) {
        try {
            await this.usuarioService.confirmCorreoUpdate(token);

            //Redirige a /home/mi-perfil
            return res.redirect('http://localhost:4200/home/mi-perfil?confirm=success');
        } catch (error) {
            // Si falla, redirige con un indicador de error
            return res.redirect('http://localhost:4200/home/mi-perfil?confirm=error');
        }
    }

    //--------------------------------------------------

    //ACTUALIZACION DE CONTRASEÑA (CORREO VERSION)
    // Solicitar recuperación (envía enlace por correo)
    @Post('recuperacion')
    solicitarRecuperacion(@Body('correo') correo: string) {
        return this.usuarioService.solicitarRecuperacion(correo);
    }

    // Restablecer la contraseña usando el token JWT
    @Patch('restablecer')
    restablecerContrasena(
    @Body('token') token: string,
    @Body('nuevaContrasena') nuevaContrasena: string,
    ) {
        return this.usuarioService.restablecerContrasena(token, nuevaContrasena);
    }

    @Patch('cambiar-contrasena')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.PACIENTE)
    cambiarContrasena(@Req() req, @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) dto: UpdateContrasenaDto) {
        const id_usuario = req.user.id_usuario; // viene del JWT
        return this.usuarioService.cambiarContrasena(id_usuario, dto);
    }

}
