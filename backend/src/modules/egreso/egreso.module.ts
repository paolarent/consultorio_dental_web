import { Module } from '@nestjs/common';
import { EgresoService } from './egreso.service';
import { EgresoController } from './egreso.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [EgresoController],
  providers: [EgresoService, PrismaService],
})
export class EgresoModule {}
