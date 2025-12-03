import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { OpenrouterService } from './openrouter.service';

@Controller('ia')
export class OpenrouterController {
    constructor(private readonly openrouterService: OpenrouterService) {}

    @Post('motivos')
    async generarMotivos(
        @Body() body: { nombre: string; descripcion?: string; n?: number }
    ) {
        if (!body?.nombre) {
        throw new BadRequestException("El campo 'nombre' del servicio es obligatorio.");
        }

        return this.openrouterService.suggestMotivos({
        nombre: body.nombre,
        descripcion: body.descripcion,
        n: body.n ?? 5
        });
    }
}

