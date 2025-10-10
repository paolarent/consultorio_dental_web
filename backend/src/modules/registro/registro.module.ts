import { Module } from '@nestjs/common';
import { RegistroService } from './registro.service';
import { RegistroController } from './registro.controller';
import { UsuarioModule } from '../usuario/usuario.module';
import { PacienteModule } from '../paciente/paciente.module';

@Module({
  imports: [UsuarioModule, PacienteModule],
  providers: [RegistroService],
  controllers: [RegistroController]
})
export class RegistroModule {}
