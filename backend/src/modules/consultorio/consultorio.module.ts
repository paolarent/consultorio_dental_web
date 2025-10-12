import { Module } from '@nestjs/common';
import { ConsultorioService } from './consultorio.service';
import { ConsultorioController } from './consultorio.controller';
import { PrismaService } from 'prisma/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
    imports: [CloudinaryModule], //para poder subir imágenes
    controllers: [ConsultorioController],
    providers: [ConsultorioService, PrismaService],
})
export class ConsultorioModule {}
