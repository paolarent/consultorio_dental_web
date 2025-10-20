import { Module } from '@nestjs/common';
import { AlergiaController } from './alergia.controller';
import { PrismaService } from 'prisma/prisma.service';
import { AlergiaService } from './alergia.service';

@Module({
  controllers: [AlergiaController],
  providers: [PrismaService, AlergiaService]
})
export class AlergiaModule {}
