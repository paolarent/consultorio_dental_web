import { IsString, IsEmail, IsEnum, IsOptional, IsInt, Matches, ValidateIf } from 'class-validator'; 
import { Rol, ProveedorLogin, Status } from '../../../common/enums';

export class CreateUsuarioDto {
    @IsEmail()
    correo: string;

    /*@IsString()
    @MinLength(8)
    contrasena: string;*/

    // Solo validar contraseña si el proveedor es "LOCAL"
    @ValidateIf((o) => !o.proveedor_login || o.proveedor_login === ProveedorLogin.LOCAL)
    @IsString()
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,20}$/,
        { message: 'La contraseña debe tener entre 8 y 20 caracteres, incluir al menos una mayúscula, una minúscula, un número y un símbolo especial.',},
    )
    contrasena: string;

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
