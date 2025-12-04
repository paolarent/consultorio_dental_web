import { Controller, Post, Body, Req, UseGuards, Res, Get, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Rol } from 'src/common/enums';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    //Endpoint para obtener info del usuario logueado
    @Get('me')
    @UseGuards(JwtAuthGuard)
    @Roles(Rol.DENTISTA, Rol.PACIENTE)
    async getMe(@CurrentUser() user: any) {
        if (!user) throw new UnauthorizedException('Usuario no autenticado');
        return this.authService.getUsuarioById(user.id_usuario);
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response,) {
        // Llamada única al servicio: recibe accessToken, refreshToken y usuario
        const { accessToken, refreshToken, usuario } = await this.authService.login(dto.correo, dto.contrasena);
        //const { accessToken, refreshToken, usuario } = await this.authService.login(dto.correo, dto.contrasena);
        
        // << LOGS para depuración >>
        //console.log('Login: accessToken:', accessToken);
        //console.log('Login: refreshToken:', refreshToken);


        // cookie de access token (corto plazo)
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: (Number(process.env.ACCESS_TOKEN_EXP_MINUTES || 10) * 60 * 1000),
            sameSite: 'none',
            path: '/', // asegurarse que reemplace la cookie correctamente
        });

        // cookie de refresh token (más larga duración)
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '7') * 24 * 60 * 60 * 1000),
            sameSite: 'none',
            path: '/', // asegurarse que reemplace la cookie correctamente
        });

        //const { usuario } = await this.authService.login(dto.correo, dto.contrasena);

        return { accessToken, usuario }; // ahora Angular recibirá usuario completo
    }


    @Post('logout')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA, Rol.PACIENTE, Rol.ADMINISTRADOR)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.['refresh_token'];
        if (refreshToken) {
            await this.authService.logoutByToken(refreshToken);
        }

        res.clearCookie('refresh_token');
        res.clearCookie('access_token');
        return { message: 'Sesión cerrada correctamente' };
    }

    // REFRESH: ** YA NO usar JwtAuthGuard** (se renuevan los tokens mediante refresh token)
    // Recibir refresh token desde cookie, validar y devolver nuevos tokens (y setear cookies).
    @Post('refresh')
    //@UseGuards(JwtAuthGuard, RolesGuard)
    //@Roles(Rol.DENTISTA, Rol.PACIENTE, Rol.ADMINISTRADOR)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        try {
            const refreshToken = req.cookies?.['refresh_token'];
            if (!refreshToken) throw new BadRequestException('No hay refresh token');

            // authService.refreshToken valida el refresh token y devuelve nuevos tokens
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);
            
            // << LOGS para depuración >>
            //console.log('Refresh: token recibido:', refreshToken);
            //console.log('Refresh: newAccessToken:', newAccessToken);
            //console.log('Refresh: newRefreshToken:', newRefreshToken);

            // Setear cookies con los tokens nuevos
            res.cookie('access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: Number(process.env.ACCESS_TOKEN_EXP_MINUTES || 10) * 60 * 1000,
                sameSite: 'none',
                path: '/',
            });

            res.cookie('refresh_token', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '7', 10) * 24 * 60 * 60 * 1000),
                sameSite: 'none',
                path: '/',
            });

            return { accessToken: newAccessToken };
        } catch (err) {
            // Normalizar error como 401 para que el frontend sepa que debe pedir re-login
            throw new UnauthorizedException('Refresh token inválido o expirado');
        }
        
    }

}


