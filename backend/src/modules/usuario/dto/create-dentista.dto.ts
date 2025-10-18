import { IsEmail, IsString, IsInt, IsOptional, ValidateIf, Matches } from 'class-validator';
import { Status, ProveedorLogin } from '../../../common/enums';

export class CreateDentistaDto {
    @IsEmail()
    correo: string;

    @ValidateIf((o) => !o.proveedor_login || o.proveedor_login === ProveedorLogin.LOCAL)
    @IsString()
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,20}$/,
        { message: 'La contraseña debe tener entre 8 y 20 caracteres, incluir al menos una mayúscula, una minúscula, un número y un símbolo especial.',},
    )
    contrasena: string;

    @IsInt()
    id_consultorio: number;

    @IsOptional()
    proveedor_login?: ProveedorLogin = ProveedorLogin.LOCAL;

    @IsOptional()
    status?: Status = Status.ACTIVO;
}
