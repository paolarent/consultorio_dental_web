import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { Status } from 'src/common/enums';

@Injectable()
export class ServicioService {
    constructor(
        private readonly prisma: PrismaService, 
        private readonly cloudinaryService: CloudinaryService
    ) {}

    async findAllActive(id_consultorio?: number) {
        const where: any = { status: 'activo' };
        
        if (id_consultorio) where.id_consultorio = id_consultorio;

        return this.prisma.servicio.findMany({
            where,
            orderBy: { nombre: 'asc' },
            select: {
                id_servicio: true,
                nombre: true,
                descripcion: true,
                url_imagen: true,
                precio_base: true,
                duracion_base: true,
                id_consultorio: true
            },
        });
    }

    //Creacion un servicio
    async createServicio(dto: CreateServicioDto, file: Express.Multer.File) {
        if (!file) throw new Error('La imagen es obligatoria');

        const result: any = await this.cloudinaryService.uploadImage(file, 'servicios');

        return this.prisma.servicio.create({
        data: {
            ...dto,
            precio_base: Number(dto.precio_base),       //convertir a number
            duracion_base: Number(dto.duracion_base),   //convertir a number
            url_imagen: result.secure_url,
            imagen_public_id: result.public_id,
            status: Status.ACTIVO,
        },
    });
    }

    async updateServicio(id: number, dto: UpdateServicioDto, file?: Express.Multer.File) {
        const servicio = await this.prisma.servicio.findUnique({ where: { id_servicio: id } });
        if (!servicio) throw new NotFoundException('Servicio no encontrado');

        let imageData = {};
        if (file) {
            if (servicio.imagen_public_id) await this.cloudinaryService.deleteImage(servicio.imagen_public_id);
            const result: any = await this.cloudinaryService.uploadImage(file, 'servicios');
            imageData = { url_imagen: result.secure_url, imagen_public_id: result.public_id };
        }

        return this.prisma.servicio.update({
            where: { id_servicio: id },
            data: { ...dto, ...imageData },
        });
    }

    async softDelete(id: number) {
        const servicio = await this.prisma.servicio.findUnique({ where: { id_servicio: id } });
        
        if (!servicio) throw new NotFoundException('Servicio no encontrado');

        return this.prisma.servicio.update({
            where: { id_servicio: id },
            data: { status: Status.INACTIVO },
        });
    }

}
