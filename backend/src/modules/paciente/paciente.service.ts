import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePacienteDto } from '../paciente/dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacienteService {
    constructor( private prisma: PrismaService, ) {}

    findAllActive() {
        return this.prisma.paciente.findMany({
            where: { status: 'activo'},         //listar solo los pacientes activos
        });
    }

    async getPacienteById(id: number) {
        const paciente = await this.prisma.paciente.findUnique({
            where: { id_paciente: id },
            select: {
                nombre: true,
                apellido1: true,
                apellido2: true,
                telefono: true,
                fecha_nacimiento: true,
                sexo: true,      
                tiene_tutor: true,
                tutor_nombre: true,
                tutor_apellido1: true,
                tutor_apellido2: true,
                tutor_telefono: true,
                tutor_correo: true,
                tutor_relacion: true,
                d_calle: true,
                d_num_exterior: true,
                d_colonia: true,
                d_cp: true,
                d_entidadfed: true,
                d_municipio: true,
                d_localidad: true
            },
        });

        if (!paciente) {
            throw new NotFoundException('Paciente no encontrado');
        }

        return paciente;
    }

    async create(data: CreatePacienteDto) {
        // Validación de tutor
        if (data.tiene_tutor === 'si') {
        const camposTutor = [
            'tutor_nombre',
            'tutor_apellido1',
            'tutor_telefono',
            'tutor_correo',
            'tutor_relacion',
        ];

        const faltantes = camposTutor.filter(
            (campo) => !data[campo as keyof CreatePacienteDto],
        );

        if (faltantes.length > 0) {
            throw new BadRequestException(
            `Debe llenar todos los campos del tutor: ${faltantes.join(', ')}`,
            );
        }
        }

        // Crear paciente en la base de datos
        const newPaciente = await this.prisma.paciente.create({
        data: {
            nombre: data.nombre,
            apellido1: data.apellido1,
            apellido2: data.apellido2 || '',
            //apellido2: data.apellido2 || null,
            telefono: data.telefono,
            fecha_nacimiento: new Date(data.fecha_nacimiento),
            sexo: data.sexo,
            d_calle: data.d_calle || null,
            d_num_exterior: data.d_num_exterior || null,
            d_colonia: data.d_colonia || null,
            d_cp: data.d_cp || null,
            d_entidadfed: data.d_entidadfed || null,
            d_municipio: data.d_municipio || null,
            d_localidad: data.d_localidad || null,
            id_usuario: data.id_usuario,
            id_consultorio: data.id_consultorio,
            tiene_tutor: data.tiene_tutor,
            tutor_nombre: data.tutor_nombre || null,
            tutor_apellido1: data.tutor_apellido1 || null,
            tutor_apellido2: data.tutor_apellido2 || null,
            tutor_telefono: data.tutor_telefono || null,
            tutor_correo: data.tutor_correo || null,
            tutor_relacion: data.tutor_relacion || null,
            status: data.status || 'activo',
        },
        });

        return newPaciente;
    }

    async deleteLogical(id: number) {
        return this.prisma.paciente.update({
            where: {id_paciente: id},
            data: {status: 'inactivo'},
        });
    }

    async updatePaciente(id: number, data: UpdatePacienteDto) {
        // Validar que si tiene tutor, se llenen los campos requeridos
        if (data.tiene_tutor === 'si') {
            const camposTutor = [
            'tutor_nombre',
            'tutor_apellido1',
            'tutor_telefono',
            'tutor_correo',
            'tutor_relacion',
            ];

            const faltantes = camposTutor.filter(
            (campo) => !(data as any)[campo],
            );

            if (faltantes.length > 0) {
            throw new BadRequestException(
                `Debe llenar todos los campos del tutor: ${faltantes.join(', ')}`,
            );
            }
        }

        // Convertir fecha a Date si viene
        if (data.fecha_nacimiento) {
            (data as any).fecha_nacimiento = new Date(data.fecha_nacimiento);
        }

        return this.prisma.paciente.update({
            where: { id_paciente: id },
            data: { ...data },
        });
    }

}
