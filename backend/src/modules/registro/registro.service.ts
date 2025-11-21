import { Injectable, BadRequestException } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { PacienteService } from '../paciente/paciente.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { Rol, ProveedorLogin, Status } from '../../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegistroService {
    constructor(
        private readonly usuarioService: UsuarioService,
        private readonly pacienteService: PacienteService,
    ) {}

    async registrarPacienteCompleto(data: CreateRegistroDto) {
        // Generar contraseña temporal simple
        const randomPassword = Math.random().toString(36).slice(-8);

        // Hashear contraseña temporal
        const tempPassword = await bcrypt.hash(randomPassword, 10);

        // Crear usuario
        const { usuario } = await this.usuarioService.create({
            correo: data.correo,
            contrasena: tempPassword,
            rol: Rol.PACIENTE,
            proveedor_login: ProveedorLogin.LOCAL,
            status: Status.ACTIVO,
            id_consultorio: data.id_consultorio!, // ya viene del controller
        });

        if (!usuario) {
            throw new BadRequestException('Error al crear el usuario');
        }

        // Crear paciente
        const paciente = await this.pacienteService.create({
            nombre: data.nombre,
            apellido1: data.apellido1,
            apellido2: data.apellido2 || '',
            telefono: data.telefono,
            fecha_nacimiento: data.fecha_nacimiento,
            sexo: data.sexo,
            // Dirección opcional
            d_calle: data.d_calle ?? undefined,
            d_num_exterior: data.d_num_exterior ?? undefined,
            d_colonia: data.d_colonia ?? undefined,
            d_cp: data.d_cp ?? undefined,
            d_entidadfed: data.d_entidadfed ?? undefined,
            d_municipio: data.d_municipio ?? undefined,
            d_localidad: data.d_localidad ?? undefined,
            // Tutor opcional
            tiene_tutor: data.tiene_tutor,
            tutor_nombre: data.tutor_nombre ?? undefined,
            tutor_apellido1: data.tutor_apellido1 ?? undefined,
            tutor_apellido2: data.tutor_apellido2 ?? undefined,
            tutor_telefono: data.tutor_telefono ?? undefined,
            tutor_correo: data.tutor_correo ?? undefined,
            tutor_relacion: data.tutor_relacion ?? undefined,
            id_usuario: usuario.id_usuario, // enlace con el usuario
            id_consultorio: data.id_consultorio!,
        });

        return {
            message: 'Paciente y usuario creados correctamente',
            usuario,
            paciente,
        };
    }

    async deletePacienteLogical(usuarioId: number, pacienteId: number) {
        // Primero damos de baja al usuario
        const usuario = await this.usuarioService.deleteLogical(usuarioId);

        // Luego damos de baja al paciente
        const paciente = await this.pacienteService.deleteLogical(usuarioId);

        return {
            message: 'Paciente y usuario dados de baja',
            usuario,
            paciente,
        };
    }

}

