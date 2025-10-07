import { IsString, IsEmail, IsEnum, IsOptional, IsInt, MinLength } from 'class-validator';
import { Rol, ProveedorLogin, Status } from '../../../common/enums';

export class CreateUsuarioDto {
    @IsEmail()
    correo: string;

    @IsString()
    @MinLength(8)
    contrase_a: string;

    @IsEnum(Rol)
    rol: Rol;

    @IsOptional()
    @IsEnum(ProveedorLogin)
    proveedor_login?: ProveedorLogin;

    @IsOptional()
    @IsEnum(Status)
    status?: Status;

    @IsInt()
    id_consultorio: number;
}
