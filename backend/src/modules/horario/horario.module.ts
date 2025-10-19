import { Module } from '@nestjs/common';
import { HorarioController } from './horario.controller';
import { HorarioService } from './horario.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [HorarioService, PrismaService],
  controllers: [HorarioController]
})
export class HorarioModule {}
