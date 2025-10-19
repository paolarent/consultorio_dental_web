import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        //Obtenemos roles requeridos del decorador @Roles()
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        const { user } = context.switchToHttp().getRequest();

        // Si no hay usuario autenticado
        if (!user) {
            throw new ForbiddenException('Usuario no autenticado');
        }
        
        // Si la ruta no tiene roles definidos entonces acceso denegado por seguridad
        if (!requiredRoles || requiredRoles.length === 0) {
            throw new ForbiddenException('Ruta sin roles definidos. Acceso denegado.');
        }
        
        //Si el usuario no tiene rol valido
        if (!user.rol) {
            throw new ForbiddenException('Usuario sin rol válido');
        }

        //Hay q verificar si el rol del usuario esta en los roles permitidos
        if (!requiredRoles.includes(user.rol)) {
            throw new ForbiddenException('No tienes permisos de acceso');
        }

        return true;
    }
}