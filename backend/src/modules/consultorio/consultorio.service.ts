import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CreateConsultorioDto } from './dto/create-consultorio.dto';
import { UpdateConsultorioDto } from './dto/update-consultorio.dto';

@Injectable()
export class ConsultorioService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async findAll() {
        return this.prisma.consultorio.findMany();
    }

    async createConsultorio(dto: CreateConsultorioDto, file?: Express.Multer.File) {
        let logoData = {};

        if (file) {
            const result: any = await this.cloudinaryService.uploadImage(file, 'consultorios/logos');
            logoData = {
                logo_url: result.secure_url,
                logo_public_id: result.public_id,
            };
        }

        return this.prisma.consultorio.create({
            data: {
                ...dto,
                fecha_registro: new Date(),
                ...logoData,
            },
        });
    }

    async deleteLogical(id: number) {
        return this.prisma.consultorio.update({
            where: {id_consultorio: id},
            data: {status: 'inactivo'}
        });
    }

    async updateConsultorio(
        id: number,
        dto: UpdateConsultorioDto,
        file?: Express.Multer.File,
    ) {
        //Obtenemos el consultorio actual
        const consultorio = await this.prisma.consultorio.findUnique({
            where: { id_consultorio: id },
        });

        if (!consultorio) {
            throw new Error('Consultorio no encontrado');
        }

        let logoData = {};
        
        //si hay archivo de logo nuevo, lo sobreescribimos
        if (file) {
            //borramos el logo anterior si existe
            if (consultorio.logo_public_id) {
                await this.cloudinaryService.deleteImage(consultorio.logo_public_id);
            }

            //subir el logo nuevo
            const result: any = await this.cloudinaryService.uploadImage(file, 'consultorios/logos');
            logoData = {
                logo_url: result.secure_url,
                logo_public_id: result.public_id,
            };
        }

        return this.prisma.consultorio.update({
            where: { id_consultorio: id },
            data: {
                ...dto,
                ...logoData,
            },
        });
    }
}