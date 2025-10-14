import { Module } from '@nestjs/common';
import { ServicioController } from './servicio.controller';
import { ServicioService } from './servicio.service';
import { PrismaService } from 'prisma/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
    imports: [CloudinaryModule], //para poder subir imágenes
    controllers: [ServicioController],
    providers: [PrismaService, ServicioService],
})
export class ServicioModule {}
