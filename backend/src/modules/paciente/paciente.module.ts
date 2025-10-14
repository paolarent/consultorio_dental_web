import { Module } from '@nestjs/common';
import { PacienteService } from './paciente.service';
import { PacienteController } from './paciente.controller';


@Module({
  controllers: [PacienteController],
  providers: [PacienteService],
  exports: [PacienteService],  //así otros módulos pueden usarlo
})
export class PacienteModule {}
