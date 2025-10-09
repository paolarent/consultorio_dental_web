import { IsString, MinLength, Matches } from 'class-validator';

export class UpdateContrasenaDto {
    @IsString()
    actual: string;

    @IsString()
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,20}$/,
        { message: 'La contraseña debe tener entre 8 y 20 caracteres, incluir al menos una mayúscula, una minúscula, un número y un símbolo especial.', },
    )
    nueva: string;

    @IsString()
    @MinLength(8)
    confirmar: string;
}
