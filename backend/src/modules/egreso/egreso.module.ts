import { Module } from '@nestjs/common';
import { EgresoService } from './egreso.service';

@Module({
  providers: [EgresoService]
})
export class EgresoModule {}
