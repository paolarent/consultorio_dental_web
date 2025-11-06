import { Module } from '@nestjs/common';
import { IngresoService } from './ingreso.service';
import { IngresoController } from './ingreso.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [IngresoService, PrismaService],
  controllers: [IngresoController]
})
export class IngresoModule {}
