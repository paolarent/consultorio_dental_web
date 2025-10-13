import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';

@Module({
    controllers: [EventoController],
    providers: [EventoService, PrismaService],
})
export class EventoModule {}

