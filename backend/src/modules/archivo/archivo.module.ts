import { Module } from '@nestjs/common';
import { ArchivoService } from './archivo.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ArchivoController } from './archivo.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [CloudinaryModule],
  providers: [ArchivoService, PrismaService],
  controllers: [ArchivoController]
})
export class ArchivoModule {}
