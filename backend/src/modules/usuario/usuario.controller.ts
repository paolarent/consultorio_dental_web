import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Controller('usuario')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

    @Get()
    findAll() {
        return this.usuarioService.findAll();
    }

    @Post()
    create(@Body() data: CreateUsuarioDto) {
        return this.usuarioService.create(data);
    }
}
