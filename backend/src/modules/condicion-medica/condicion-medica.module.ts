import { Module } from '@nestjs/common';
import { CondicionMedicaService } from './condicion-medica.service';
import { PrismaService } from 'prisma/prisma.service';
import { CondicionMedicaController } from './condicion-medica.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  providers: [CondicionMedicaService, PrismaService],
  controllers: [CondicionMedicaController]
})
export class CondicionMedicaModule {}
