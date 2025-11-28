import { Module } from '@nestjs/common';
import { CitaService } from './cita.service';
import { CitaController } from './cita.controller';
import { PrismaService } from 'prisma/prisma.service';
import { MailModule } from 'src/common/mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [CitaService, PrismaService],
  controllers: [CitaController],
  exports: [CitaService]
})
export class CitaModule {}
