import { Module } from '@nestjs/common';
import { EgresoService } from './egreso.service';
import { EgresoController } from './egreso.controller';
import { PrismaService } from 'prisma/prisma.service';
import { IngresoModule } from '../ingreso/ingreso.module';

@Module({
  controllers: [EgresoController],
  providers: [EgresoService, PrismaService],
  imports: [IngresoModule],
})
export class EgresoModule {}
