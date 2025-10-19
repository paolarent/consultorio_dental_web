import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    // LOGIN: retorna access + refresh tokens
    async login(correo: string, contrasena: string) {
        const usuario = await this.prisma.usuario.findUnique({ where: { correo } });
        
        if (!usuario || usuario.status !== 'activo') {
            throw new UnauthorizedException('Correo o contraseña incorrectos');
        }

        const match = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!match) throw new UnauthorizedException('Correo o contraseña incorrectos');

        // Generar access token
        const payload = { id_usuario: usuario.id_usuario, rol: usuario.rol, id_consultorio: usuario.id_consultorio, };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: Number(process.env.ACCESS_TOKEN_EXP_MINUTES || 10) * 60,
        });

        // Generar refresh token
        const refreshPayload = { id_usuario: usuario.id_usuario, rol: usuario.rol, id_consultorio: usuario.id_consultorio, };
        const refreshToken = this.jwtService.sign(refreshPayload, {
            expiresIn: Number(process.env.REFRESH_TOKEN_EXP_DAYS || 7) * 24 * 60 * 60,
        });

        // Guardar hash del refresh token en BD (sesion)
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        // Cerrar sesiones activas previas (1 sesión a la vez)
        await this.prisma.sesion.updateMany({
            where: { id_usuario: usuario.id_usuario, activo: true },
            data: { activo: false },
        });

        await this.prisma.sesion.create({
            data: {
                id_usuario: usuario.id_usuario,
                refresh_token_hash: refreshTokenHash,
                fecha_expira: new Date(
                    Date.now() + Number(process.env.REFRESH_TOKEN_EXP_DAYS ?? 7) * 24 * 60 * 60 * 1000,
                ),
                activo: true,
            },
        });

        return { accessToken, refreshToken };
    }

    // LOGOUT (desactivar la sesión actual por refresh token)
    async logoutByToken(refreshToken: string) {
        const sesiones = await this.prisma.sesion.findMany({ where: { activo: true } });

        for (const sesion of sesiones) {
            const match = await bcrypt.compare(refreshToken, sesion.refresh_token_hash);
            if (match) {
                await this.prisma.sesion.update({
                    where: { id_sesion: sesion.id_sesion },
                    data: { activo: false },
                });
                return;
            }
        }

        throw new UnauthorizedException('Refresh token inválido');
    }

    // Renovar tokens usando refresh token
    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken) as { id_usuario: number };

            const sesiones = await this.prisma.sesion.findMany({
                where: { id_usuario: payload.id_usuario, activo: true },
            });

            const sesion = await Promise.all(
                sesiones.map(async (s) => {
                    const match = await bcrypt.compare(refreshToken, s.refresh_token_hash);
                    return match ? s : null;
                }),
            ).then((arr) => arr.find((s) => s !== null));

            if (!sesion) throw new UnauthorizedException('Refresh token inválido o sesión cerrada');

            const usuario = await this.prisma.usuario.findUnique({ where: { id_usuario: payload.id_usuario } });
            if (!usuario || usuario.status !== 'activo') throw new UnauthorizedException('Usuario no válido');

            // Generar nuevos tokens
            const newAccessToken = this.jwtService.sign(
                { id_usuario: usuario.id_usuario, rol: usuario.rol, id_consultorio: usuario.id_consultorio },
                {
                    expiresIn: Number(process.env.ACCESS_TOKEN_EXP_MINUTES ?? 10) * 60, // minutos a segundos
                },
            );

            const newRefreshToken = this.jwtService.sign(
                { id_usuario: usuario.id_usuario, rol: usuario.rol, id_consultorio: usuario.id_consultorio },
                {
                    expiresIn: Number(process.env.REFRESH_TOKEN_EXP_DAYS ?? 7) * 24 * 60 * 60, // días a segundos
                },
            );

            const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

            // Desactivar sesión antigua y crear nueva
            await this.prisma.sesion.update({
                where: { id_sesion: sesion.id_sesion },
                data: { activo: false },
            });

            await this.prisma.sesion.create({
                data: {
                    id_usuario: usuario.id_usuario,
                    refresh_token_hash: newRefreshTokenHash,
                    fecha_expira: new Date(
                        Date.now() + Number(process.env.REFRESH_TOKEN_EXP_DAYS ?? 7) * 24 * 60 * 60 * 1000,
                    ),
                    activo: true,
                },
            });

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (error) {
            throw new UnauthorizedException('Refresh token inválido o expirado');
        }
    }
}

