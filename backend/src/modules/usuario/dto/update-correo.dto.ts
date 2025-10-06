import { IsEmail, IsNotEmpty } from "class-validator";

export class UpdateCorreoDto {
    @IsNotEmpty()
    @IsEmail({}, {message: 'Debe ser un correo válido' })
    correo: string;
}