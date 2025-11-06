import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { PacienteModule } from './modules/paciente/paciente.module';
import { MailerService } from './common/mail/mail.service';
import { RegistroModule } from './modules/registro/registro.module';
import { ConsultorioModule } from './modules/consultorio/consultorio.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { TipoEventoModule } from './modules/tipo-evento/tipo-evento.module';
import { EventoModule } from './modules/evento/evento.module';
import { EgresoModule } from './modules/egreso/egreso.module';
import { ServicioModule } from './modules/servicio/servicio.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';
import { HorarioModule } from './modules/horario/horario.module';
import { ArchivoModule } from './modules/archivo/archivo.module';
import { HistorialClinicoModule } from './modules/historial-clinico/historial-clinico.module';
import { AlergiaModule } from './modules/alergia/alergia.module';
import { CondicionMedicaModule } from './modules/condicion-medica/condicion-medica.module';
import { IngresoModule } from './modules/ingreso/ingreso.module';

@Module({
  imports: [PrismaModule, UsuarioModule, PacienteModule, RegistroModule, ConsultorioModule, CloudinaryModule, TipoEventoModule, EventoModule, 
            EgresoModule, ServicioModule, AuthModule, HorarioModule, ArchivoModule, HistorialClinicoModule, AlergiaModule, CondicionMedicaModule,
            IngresoModule],
  controllers: [AppController],
  providers: [AppService, MailerService]//, { provide: APP_GUARD, useClass: RolesGuard }],
})
export class AppModule {}
