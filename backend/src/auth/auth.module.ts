import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { UsuarioService } from 'src/modules/usuario/usuario.service';
import { MailModule } from 'src/common/mail/mail.module';

const accessTokenExp = Number(process.env.ACCESS_TOKEN_EXP_MINUTES || 10) * 60;

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: accessTokenExp },
        }),
        MailModule,
    ],
    providers: [AuthService, PrismaService, JwtStrategy, UsuarioService],
    controllers: [AuthController],
})
export class AuthModule {}


