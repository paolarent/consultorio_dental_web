import { SetMetadata } from '@nestjs/common';

/* Decorador para asignar roles permitidos a un endpoint. Por Ejemplo: @Roles(Rol.DENTISTA, Rol.ADMIN) o depende el caso*/
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
