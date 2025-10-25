import { Controller, Post, Body, Req, UseGuards, Res, Get, UnauthorizedException } from '@nestjs/common';
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
    async getMe(@CurrentUser() user: any) {
        if (!user) throw new UnauthorizedException('Usuario no autenticado');
        return this.authService.getUsuarioById(user.id_usuario);
    }

    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response,) {
        const { accessToken, refreshToken } = await this.authService.login(dto.correo, dto.contrasena);
        
        // cookie de access token (corto plazo)
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: (Number(process.env.ACCESS_TOKEN_EXP_MINUTES || 10) * 60 * 1000),
            sameSite: 'lax',
        });

        // cookie de refresh token (más larga duración)
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '7') * 24 * 60 * 60 * 1000),
            sameSite: 'lax',
        });

        const { usuario } = await this.authService.login(dto.correo, dto.contrasena);

        return { accessToken, usuario }; // ahora Angular recibirá usuario completo

    }


    @Post('logout')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA, Rol.PACIENTE, Rol.ADMINISTRADOR)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies['refresh_token'];
        if (refreshToken) {
            await this.authService.logoutByToken(refreshToken);
        }

        res.clearCookie('refresh_token');
        res.clearCookie('access_token');
        return { message: 'Sesión cerrada correctamente' };
    }


    @Post('refresh')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA, Rol.PACIENTE, Rol.ADMINISTRADOR)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) throw new Error('No hay refresh token');

        const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);
        
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '7') * 24 * 60 * 60 * 1000),
            sameSite: 'lax',
        });

        return { accessToken };
    }

}


