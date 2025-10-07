import { Module } from '@nestjs/common';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { MailModule } from 'src/common/mail/mail.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'clave_por_defecto', 
      signOptions: { expiresIn: '10m' }, // duración por defecto
    }),
    MailModule
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService]
})
export class UsuarioModule {}

