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
                id_consultorio: true,
                tipo_cobro: true
            },
        });
    }

    async listarServicios(id_consultorio: number) {
        return this.prisma.servicio.findMany({
            where: {
                status: Status.ACTIVO,
                id_consultorio: id_consultorio
            },
            select: {
                id_servicio: true,
                nombre: true,
                tipo_cobro: true,
                precio_base: true
            }
        });
    }


    //Creacion un servicio
    /*async createServicio(dto: CreateServicioDto, file: Express.Multer.File) {
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
    }*/
    async createServicio(dto: CreateServicioDto, file: Express.Multer.File) {
        if (!file) throw new Error('La imagen es obligatoria');

        const result: any = await this.cloudinaryService.uploadImage(file, 'servicios');

        //Primero CREAR SERVICIO
        const servicio = await this.prisma.servicio.create({
            data: {
                nombre: dto.nombre,
                descripcion: dto.descripcion,
                tipo_cobro: dto.tipo_cobro,
                precio_base: Number(dto.precio_base),
                duracion_base: Number(dto.duracion_base),
                url_imagen: result.secure_url,
                imagen_public_id: result.public_id,
                status: Status.ACTIVO,
                id_consultorio: dto.id_consultorio,
            }
        });

        // INSERTAR LOS MOTIVOS
        if (Array.isArray(dto.motivos) && dto.motivos.length > 0) {
            await this.prisma.motivo_consulta.createMany({
                data: dto.motivos.map(m => ({
                    nombre: m.trim(),
                    id_servicio: servicio.id_servicio,
                    id_consultorio: dto.id_consultorio,
                    status: Status.ACTIVO
                }))
            });
        }

        return servicio;
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

        // Convertir los campos numéricos a Int antes de actualizar pq ya dio error
        const updatedData = {
            ...dto,
            precio_base: Number(dto.precio_base),
            duracion_base: Number(dto.duracion_base),
            ...imageData,
        };

        return this.prisma.servicio.update({
            where: { id_servicio: id },
            data: updatedData,
        });
    }

    async softDelete(id: number) {
        const servicio = await this.prisma.servicio.findUnique({ where: { id_servicio: id } });
        if (!servicio) throw new NotFoundException('Servicio no encontrado');

        //Transacción: servicio + motivos
        return this.prisma.$transaction([
            this.prisma.servicio.update({
                where: { id_servicio: id },
                data: { status: Status.INACTIVO },
            }),
            this.prisma.motivo_consulta.updateMany({
                where: { id_servicio: id },
                data: { status: Status.INACTIVO },
            })
        ]);
    }

}
