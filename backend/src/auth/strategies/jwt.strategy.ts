import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor( private prisma: PrismaService ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET!,
        });
    }

    async validate(payload: any) {
        const sesion = await this.prisma.sesion.findFirst({
            where: {
                id_usuario: payload.id_usuario,
                activo: true,
            },
        });

        if (!sesion) {
            throw new UnauthorizedException('Sesión expirada o no válida');
        }

        //si todo sale bien, devuelve los datos del usuario autenticado
        return { id_usuario: payload.id_usuario, rol: payload.rol, id_consultorio: payload.id_consultorio };
    }

}