import { Module } from '@nestjs/common';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { MailModule } from 'src/common/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [UsuarioController],
  providers: [UsuarioService]
})
export class UsuarioModule {}
