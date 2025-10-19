import { Controller, Post, Body, Req, UseGuards, Res} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Rol } from 'src/common/enums';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response,) {
        const { accessToken, refreshToken } = await this.authService.login(dto.correo, dto.contrasena);
        
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '7') * 24 * 60 * 60 * 1000),
        });

        return { accessToken };
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
        return { message: 'Sesión cerrada correctamente' };
    }

    @Post('refresh')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Rol.DENTISTA, Rol.PACIENTE, Rol.ADMINISTRADOR)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) throw new Error('No hay refresh token');

        const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);
        
        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: (parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '7') * 24 * 60 * 60 * 1000),
        });

        return { accessToken };
    }

}
