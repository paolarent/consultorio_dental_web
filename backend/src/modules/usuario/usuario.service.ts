import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { MailerService } from 'src/common/mail/mail.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateContrasenaDto } from './dto/update-contrasena.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Rol, Status, ProveedorLogin } from 'src/common/enums';
import { CreateDentistaDto } from './dto/create-dentista.dto';

@Injectable()
export class UsuarioService {
    constructor(
        private prisma: PrismaService,
        private mailerService: MailerService,  //el servicio de mail
        private jwtService: JwtService, //inyectar JwtService para lo de contraseña
    ) {}

    findAll() {
        return this.prisma.usuario.findMany();
    }

    async findAllByRol(rol: Rol) {
        return this.prisma.usuario.findMany({
            where: {
            status: 'activo',
            rol,
            },
        });
    }

    async create(data: CreateUsuarioDto) {
        // Generar hash de la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.contrasena, saltRounds);

        // Crear usuario con correo_verificado = false
        const newUser = await this.prisma.usuario.create({
            data: {
                correo: data.correo,
                contrasena: hashedPassword,
                rol: data.rol,
                proveedor_login: data.proveedor_login,
                status: data.status,
                id_consultorio: data.id_consultorio,
                correo_verificado: false,
            },
            include: {
                consultorio: {
                    select: {
                        logo_url: true,
                        titular_nombre: true,
                        titular_ap1: true,
                    },
                },
            },
        });

        //Generar el token de verificación
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de validez

        //Guardar el token en verificacion_correo
        await this.prisma.verificacion_correo.create({
            data: {
                id_usuario: newUser.id_usuario,
                token,
                fecha_expira: expiresAt,
                usado: false,
            },
        });

        const logoUrl = newUser.consultorio?.logo_url || '';
        const nombreTitular = newUser.consultorio?.titular_nombre || '';
        const apellidoTitular = newUser.consultorio?.titular_ap1 || '';
        const nombreDoc = `${nombreTitular} ${apellidoTitular}`.trim();

        //Enviar el correo con enlace de confirmación usando MailerService
        await this.mailerService.sendVerificationEmail(newUser.correo, token, 'registro', logoUrl, nombreDoc);

        //return { message: 'Usuario creado, correo de verificación enviado' };
        // Devuelve tanto el usuario como un mensaje
        return {
            usuario: newUser,
            message: 'Usuario creado, correo de verificación enviado'
        };
    }

    async deleteLogical(id: number) {
        return this.prisma.usuario.update({
            where: {id_usuario: id},
            data: {status: 'inactivo'}, //al "eliminar el usuario", en realidad solo se da de baja no se borra literal
        });
    }

    //Confirmación de registro inicial
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

    //ACTUALIZAR EL CORREO DEL USUARIO
    async requestCorreoUpdate(id: number, newCorreo: string) {
        // Validamos que no exista otro usuario con ese correo
        const existingUser = await this.prisma.usuario.findFirst({
            where: { correo: newCorreo },
        });
        if (existingUser) throw new Error('El correo ya está en uso');

        const usuario = await this.prisma.usuario.findUnique({ where: { id_usuario: id }, include: {consultorio: { select: { logo_url: true, titular_nombre: true, titular_ap1: true } }} });
        if (!usuario) throw new Error('Usuario no encontrado');

        // Generar token temporal
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min de validez

        // Guardamos el token en tabla temporal 
        await this.prisma.verificacion_correo.create({
            data: {
                id_usuario: id,
                nuevo_correo: newCorreo,
                token,
                fecha_expira: expiresAt,
                usado: false,
            },
        });

        // Armamos los datos q mandaremos al service del correo
        const logoUrl = usuario.consultorio?.logo_url || '';
        const nombreTitular = usuario.consultorio?.titular_nombre || '';
        const apellidoTitular = usuario.consultorio?.titular_ap1 || '';
        const nombreDoc = `${nombreTitular} ${apellidoTitular}`.trim();

        //Usamos el MailerService para enviar el correo con link
        await this.mailerService.sendVerificationEmail(newCorreo, token, 'actualizacion', logoUrl, nombreDoc);

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

    async solicitarRecuperacion(correo: string) {
        const usuario = await this.prisma.usuario.findUnique({ where: { correo }, include: {consultorio: { select: { logo_url: true, titular_nombre: true, titular_ap1: true } }} });
        if (!usuario) {
            // Por seguridad, no revelamos si el correo existe o no
            return { message: 'Si el correo está registrado, se enviará un enlace de recuperación.' };
        }

        // Generar token JWT válido por 10 minutos
        const payload = { id_usuario: usuario.id_usuario };
        const token = this.jwtService.sign(payload);


        // Registrar el intento de recuperación
        await this.prisma.recuperacion_contraseña.create({
            data: { id_usuario: usuario.id_usuario },
        });

        // Enviar el correo con enlace
        //const enlace = `${process.env.APP_URL}/login/restore-password?token=${token}`;
        const enlace = `${process.env.FRONTEND_URL}/login/restore-password?token=${token}`;
        const logoUrl = usuario.consultorio?.logo_url || ''; // sacamos la URL del logo
        const nombreTitular = usuario.consultorio?.titular_nombre || '';
        const apellidoTitular = usuario.consultorio?.titular_ap1 || '';
        const nombreDoc = `${nombreTitular} ${apellidoTitular}`.trim();
        //const nombreDoc = usuario.consultorio?.titular_nombre || 'Prueba';

        await this.mailerService.enviarCorreoRecuperacion(usuario.correo, enlace, logoUrl, nombreDoc);
        return { message: 'Si el correo está registrado, se ha enviado un enlace de recuperación.' };
    }

    async restablecerContrasena(token: string, nuevaContrasena: string) {
        try {
            const payload = this.jwtService.verify(token) as { id_usuario: number };


            const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario: payload.id_usuario },
            });
            if (!usuario) throw new Error('Usuario no encontrado');

            const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

            await this.prisma.usuario.update({
            where: { id_usuario: usuario.id_usuario },
            data: { contrasena: hashedPassword },
            });

            await this.prisma.recuperacion_contraseña.updateMany({
            where: { id_usuario: usuario.id_usuario, usado: false },
            data: { usado: true, fecha_uso: new Date() },
            });

            return { message: 'Contraseña actualizada correctamente.' };
        } catch (error) {
            throw new UnauthorizedException('Token inválido o expirado.');
        }
    }

    //ACTUALIZACION DE CONTRASEÑA INTERNA(USUARIO YA LOGGEADO)
    async cambiarContrasena(id_usuario: number, dto: UpdateContrasenaDto) {
        const { actual, nueva, confirmar } = dto;

        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario }
        });

        if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

        //Verificar contraseña actual
        const coincide = await bcrypt.compare(actual, usuario.contrasena);
        if (!coincide) throw new BadRequestException('La contraseña actual es incorrecta');

        //Verificar que nueva y confirmación coincidan
        if (nueva !== confirmar) throw new BadRequestException('La nueva contraseña no coincide con la confirmación');

        //Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(nueva, 10);

        //Actualizar la BD
        await this.prisma.usuario.update({
            where: { id_usuario },
            data: { contrasena: hashedPassword },
        });

        return { message: 'Contraseña actualizada correctamente' };
    }

    async createDentista(data: CreateDentistaDto) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.contrasena, saltRounds);

        const newDentista = await this.prisma.usuario.create({
        data: {
            correo: data.correo,
            contrasena: hashedPassword,
            rol: Rol.DENTISTA, //asignamos automáticamente
            proveedor_login: data.proveedor_login || ProveedorLogin.LOCAL,
            status: data.status || Status.ACTIVO,
            id_consultorio: data.id_consultorio,
            correo_verificado: true, // omitimos verificación por token
        },
        });

        return {
            message: 'Dentista creado correctamente',
            usuario: newDentista,
        };
    }
}
