import { Injectable } from '@nestjs/common';
import { MailerService } from 'src/common/mail/mail.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UsuarioService {
    constructor(
        private prisma: PrismaService,
        private mailerService: MailerService,  // injecta el servicio mail
    ) {}

    findAll() {
        return this.prisma.usuario.findMany();
    }

    findAllActive() {
        return this.prisma.usuario.findMany({
            where: { status: 'activo'},         //listar solo usuarios activos
        });
    }

    async create(data: CreateUsuarioDto) {
        // Generar hash de la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.contrase_a, saltRounds);

        // Crear usuario con correo_verificado = false
        const newUser = await this.prisma.usuario.create({
            data: {
                correo: data.correo,
                contrase_a: hashedPassword,
                rol: data.rol,
                proveedor_login: data.proveedor_login,
                status: data.status,
                id_consultorio: data.id_consultorio,
                correo_verificado: false,
            },
        });

        //Generar el token de verificación
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos de validez

        //Guardar el token en verificacion_correo
        await this.prisma.verificacion_correo.create({
            data: {
                id_usuario: newUser.id_usuario,
                token,
                fecha_expira: expiresAt,
                usado: false,
            },
        });

        //Enviar el correo con enlace de confirmación usando MailerService
        await this.mailerService.sendVerificationEmail(newUser.correo, token, 'registro');

        return { message: 'Usuario creado, correo de verificación enviado' };
    }

    async deleteLogical(id: number) {
        return this.prisma.usuario.update({
            where: {id_usuario: id},
            data: {status: 'inactivo'}, //al "eliminar el usuario", en realidad solo se da de baja no se borra literal
        });
    }

    // Confirmación de registro inicial
    async confirmRegistro(token: string) {
        const record = await this.prisma.verificacion_correo.findFirst({
            where: { token, usado: false, fecha_expira: { gt: new Date() } },
        });
        if (!record) throw new Error('Token inválido o expirado');

        await this.prisma.usuario.update({
            where: { id_usuario: record.id_usuario },
            data: { correo_verificado: true },
        });

        await this.prisma.verificacion_correo.update({
            where: { id_token: record.id_token },
            data: { usado: true },
        });

        return { message: 'Registro confirmado correctamente.' };
    }

    //Generar token y enviar correo de verificación
    async requestCorreoUpdate(id: number, newCorreo: string) {
        // Validamos que no exista otro usuario con ese correo
        const existingUser = await this.prisma.usuario.findFirst({
            where: { correo: newCorreo },
        });
        if (existingUser) throw new Error('El correo ya está en uso');

        // Generar token temporal
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min de validez

        // Guardamos token en tabla temporal (puede ser otra tabla llamada VerificacionCorreo)
        await this.prisma.verificacion_correo.create({
            data: {
                id_usuario: id,
                nuevo_correo: newCorreo,
                token,
                fecha_expira: expiresAt,
                usado: false,
            },
        });

        //Usamos el MailerService para enviar el correo con link
        await this.mailerService.sendVerificationEmail(newCorreo, token, 'actualizacion');

        return { message: 'Correo de verificación enviado para actualización.' };
    }

    // Confirmación de cambio de correo
    async confirmCorreoUpdate(token: string) {
        const record = await this.prisma.verificacion_correo.findFirst({
            where: { token, usado: false, fecha_expira: { gt: new Date() } },
        });
        if (!record || !record.nuevo_correo) throw new Error('Token inválido o expirado');

        await this.prisma.usuario.update({
            where: { id_usuario: record.id_usuario },
            data: { correo: record.nuevo_correo },
        });

        await this.prisma.verificacion_correo.update({
            where: { id_token: record.id_token },
            data: { usado: true },
        });

        return { message: 'Correo actualizado correctamente.' };
    }
}

/* USO FUTURO EN CONDICIONES
const isMatch = await bcrypt.compare(inputPassword, usuario.contrase_a);
if (!isMatch) throw new Error('Contraseña incorrecta');
 */
