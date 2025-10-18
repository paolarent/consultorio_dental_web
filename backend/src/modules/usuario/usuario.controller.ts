import { Body, Controller, Get, ParseIntPipe, Post, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateCorreoDto } from './dto/update-correo.dto';
import { UpdateContrasenaDto } from './dto/update-contrasena.dto';
import { Rol } from 'src/common/enums';
import { CreateDentistaDto } from './dto/create-dentista.dto';
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
    create(@Body() data: CreateUsuarioDto) {
        return this.usuarioService.create(data);
    }

    @Post('dentista')
    createDentista(@Body() data: CreateDentistaDto) {
        return this.usuarioService.createDentista(data);
    }

    @Patch(':id/delete')
    async delete(@Param('id', ParseIntPipe) id:number) {
        return this.usuarioService.deleteLogical(id);
    }

    // Confirmación de registro inicial
    @Patch('correo/confirmar-registro/:token')
    confirmRegistro(@Param('token') token: string) {
        return this.usuarioService.confirmRegistro(token);
    }

    // Confirmación de cambio de correo
    @Patch('correo/confirm/:token')
    confirmCorreoUpdate(@Param('token') token: string) {
        return this.usuarioService.confirmCorreoUpdate(token);
    }

    //Solicitar actualización de correo (envía token)
    @Patch(':id/correo/request')
    requestCorreoUpdate(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateCorreoDto,
    ) {
        return this.usuarioService.requestCorreoUpdate(id, body.correo);
    }

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

    //@UseGuards(JwtAuthGuard) // asegurarse que solo usuarios loggeados accedan
    @Patch('contrasena')
    cambiarContrasena(@Body() body: { id_usuario: number } & UpdateContrasenaDto) { //@Req() req, @Body() dto: UpdateContrasenaDto
        const { id_usuario, ...dto } = body;
        return this.usuarioService.cambiarContrasena(id_usuario, dto);
        //req.user.id_usuario viene del payload del JWT
        //return this.usuarioService.cambiarContrasena(req.user.id_usuario, dto);
    }
}
