import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateHistorialDto } from './dto/create-historial.dto';
import { UpdateHistorialDto } from './dto/update-historial.dto';
import { Status } from 'src/common/enums';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { formatFechaLocal } from 'src/utils/format-date';

@Injectable()
export class HistorialClinicoService {
    constructor(
        private prisma: PrismaService,
        private cloudinary: CloudinaryService
    ) {}

    async crearHistorial(dto: CreateHistorialDto) {
        //Crear el 'historial'
        const historial = await this.prisma.historial_clinico.create({
            data: {
                id_paciente: Number(dto.id_paciente),
                id_servicio: Number(dto.id_servicio),
                fecha: new Date(dto.fecha),
                descripcion: dto.descripcion,
                status: Status.ACTIVO,
            },
        });

        //Verificar límite de fotos (máx 3)
        const fotosExistentes = await this.prisma.fotografia_historial.count({
            where: { id_historial: historial.id_historial },
        });

        if (dto.fotos && fotosExistentes + dto.fotos.length > 3) {
            throw new BadRequestException(
                'Se ha alcanzado el límite máximo de 3 fotografías por registro de historial.'
            );
        }

        //Subir las fotos si vienen
        if (dto.fotos && dto.fotos.length > 0) {
            for (const file of dto.fotos) {
                const uploadResult: any = await this.cloudinary.uploadImage(file, `historial-clinico/fotografias/paciente/${dto.id_paciente}`);
                await this.prisma.fotografia_historial.create({
                    data: {
                        id_historial: historial.id_historial,
                        url_fotografia: uploadResult.secure_url,
                        foto_public_id: uploadResult.public_id,
                    },
                });
            }
        }

        return historial;
    }

    // Listar historial con fotos de un paciente
    async obtenerHistorial(id_paciente: number) {
        // Primero obtenemos los historiales
        const historiales = await this.prisma.historial_clinico.findMany({
            where: { id_paciente, status: Status.ACTIVO },
            include: { 
                fotografia_historial: true, 
                servicio: {
                    select: {
                        id_servicio: true,
                        nombre: true,
                    }, 
                },
            },
            orderBy: { fecha: 'desc' },
        });

        // Formateamos solo la fecha antes de devolver
        return historiales.map(h => ({
            ...h,
            fecha: h.fecha.toISOString().split('T')[0] // "2022-04-07"
        }));
    }

    async actualizarHistorial(id_historial: number, dto: UpdateHistorialDto, fotos?: Express.Multer.File[]) {
        const historial = await this.prisma.historial_clinico.findUnique({ where: { id_historial }});
        if(!historial) throw new NotFoundException('Historial no encontrado');

        //Verificar límite de fotos antes de subir nuevas
        const fotosExistentes = await this.prisma.fotografia_historial.count({
            where: { id_historial },
        });

        if (fotos && fotosExistentes + fotos.length > 3) {
            throw new BadRequestException(
                'Se ha alcanzado el límite máximo de 3 fotografías por registro de historial.'
            );
        }

        // Actualiza datos básicos
        const updated = await this.prisma.historial_clinico.update({
            where: { id_historial },
            data: {
                id_servicio: dto.id_servicio ? Number(dto.id_servicio) : historial.id_servicio,
                fecha: dto.fecha ? new Date(dto.fecha) : historial.fecha,
                descripcion: dto.descripcion ?? historial.descripcion,
            },
        });

        // Si vienen fotos nuevas, súbelas
        if (fotos && fotos.length > 0) {
            for (const file of fotos) {
                const uploadResult: any = await this.cloudinary.uploadImage(file, `historial-clinico/fotografias/paciente/${historial.id_paciente}`);
                await this.prisma.fotografia_historial.create({
                    data: {
                        id_historial,
                        url_fotografia: uploadResult.secure_url,
                        foto_public_id: uploadResult.public_id,
                    },
                });
            }
        }

        return updated;
    }

    // Eliminar foto individual
    async eliminarFoto(id_foto: number) {
        const foto = await this.prisma.fotografia_historial.findUnique({ where: { id_foto } });
        if (!foto) throw new NotFoundException('Foto no encontrada');

        if (foto.foto_public_id) {
            await this.cloudinary.deleteImage(foto.foto_public_id);
        }

        return this.prisma.fotografia_historial.delete({ where: { id_foto } });
    }

    async desactivarHistorial(id_historial: number) {
        const historial = await this.prisma.historial_clinico.findUnique({ where: { id_historial }});
        if(!historial) throw new NotFoundException('Historial no encontrado');

        return this.prisma.historial_clinico.update({
            where: { id_historial },
            data: { status: Status.INACTIVO },
        });
    }
}
