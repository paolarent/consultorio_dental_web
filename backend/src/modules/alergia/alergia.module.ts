import { Module } from '@nestjs/common';
import { AlergiaController } from './alergia.controller';
import { PrismaService } from 'prisma/prisma.service';
import { AlergiaService } from './alergia.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [AlergiaController],
  providers: [PrismaService, AlergiaService]
})
export class AlergiaModule {}
