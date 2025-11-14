import { Module } from '@nestjs/common';
import { FormularioController } from './formulario.controller';
import { FormularioService } from './formulario.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
    controllers: [FormularioController],
    providers: [FormularioService, PrismaService]
})
export class FormularioModule {}
