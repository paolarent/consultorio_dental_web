import { Module } from '@nestjs/common';
import { TipoEventoService } from './tipo-evento.service';
import { TipoEventoController } from './tipo-evento.controller';

@Module({
  providers: [TipoEventoService],
  controllers: [TipoEventoController]
})
export class TipoEventoModule {}
