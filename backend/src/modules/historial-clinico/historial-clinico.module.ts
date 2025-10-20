import { Module } from '@nestjs/common';
import { HistorialClinicoController } from './historial-clinico.controller';
import { PrismaService } from 'prisma/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { HistorialClinicoService } from './historial-clinico.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [HistorialClinicoController],
  providers: [PrismaService, HistorialClinicoService]
})
export class HistorialClinicoModule {}
