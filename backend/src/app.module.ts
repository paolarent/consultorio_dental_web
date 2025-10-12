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

@Module({
  imports: [PrismaModule, UsuarioModule, PacienteModule, RegistroModule, ConsultorioModule, CloudinaryModule],
  controllers: [AppController],
  providers: [AppService, MailerService],
})
export class AppModule {}
