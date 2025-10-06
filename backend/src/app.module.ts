import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { MailerService } from './common/mail/mail.service';

@Module({
  imports: [PrismaModule, UsuarioModule],
  controllers: [AppController],
  providers: [AppService, MailerService],
})
export class AppModule {}
