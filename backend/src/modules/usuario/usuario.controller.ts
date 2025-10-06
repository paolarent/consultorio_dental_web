import { Body, Controller, Get, ParseIntPipe, Post, Param, Patch } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateCorreoDto } from './dto/update-correo.dto';

@Controller('usuario')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

    @Get()
    findAll() {
        return this.usuarioService.findAll();
    }

    @Get('activo') 
    findAllActive() {
        return this.usuarioService.findAllActive();
    }

    @Post()
    create(@Body() data: CreateUsuarioDto) {
        return this.usuarioService.create(data);
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

    /*/Confirmar token y actualizar correo
    @Patch('correo/confirm/:token')
    confirmCorreoUpdate(@Param('token') token: string) {
        return this.usuarioService.confirmCorreoUpdate(token);
    }*/
}
