import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CreateConsultorioDto } from './dto/create-consultorio.dto';

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
}