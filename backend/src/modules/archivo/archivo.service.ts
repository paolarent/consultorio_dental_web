import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { StatusArchivo } from 'src/common/enums';
import { CreateArchivoDto } from './dto/create-archivo.dto';
import { UpdateArchivoDto } from './dto/update-archivo.dto';

@Injectable()
export class ArchivoService {
    constructor(
        private prisma: PrismaService,
        private cloudinary: CloudinaryService,
    ) {}

    // Subir nueva imagen
    async subirArchivo(id_paciente: number, dto: CreateArchivoDto, file: Express.Multer.File) {
        const uploadResult: any = await this.cloudinary.uploadImage(file, `pacientes/archivo/${id_paciente}`);

        if (!uploadResult.secure_url || !uploadResult.public_id) {
            throw new Error('Error al subir la imagen a Cloudinary');
        }

        return this.prisma.archivo.create({
            data: {
                id_paciente,
                nombre: dto.nombre,
                descripcion: dto.descripcion,
                url_imagen: uploadResult.secure_url,
                imagen_public_id: uploadResult.public_id,
                status: StatusArchivo.ACTIVO,
            },
        });
    }

    // Listar archivos de un paciente (solo activos)
    async obtenerArchivos(id_paciente: number, soloActivos = true) {
        const where = { id_paciente } as any;
        if (soloActivos) where.status = StatusArchivo.ACTIVO;

        return this.prisma.archivo.findMany({
            where,
            orderBy: { fecha_subida: 'desc' },
        });
    }

    // Editar nombre o descripcion de X archivo
    async actualizarArchivo(id_archivo: number, dto: UpdateArchivoDto) {
        const archivo = await this.prisma.archivo.findUnique({ where: { id_archivo } });
        if (!archivo) throw new NotFoundException('Archivo no encontrado');

        return this.prisma.archivo.update({
            where: { id_archivo },
            data: {
                nombre: dto.nombre ?? archivo.nombre,
                descripcion: dto.descripcion ?? archivo.descripcion,
            },
        });
    }

    // Soft-delete (ocultar el archivo)
    async ocultarArchivo(id_archivo: number) {
        const archivo = await this.prisma.archivo.findUnique({ where: { id_archivo } });
        if (!archivo) throw new NotFoundException('Archivo no encontrado');

        return this.prisma.archivo.update({
            where: { id_archivo },
            data: { status: StatusArchivo.OCULTO },
        });
    }
}
