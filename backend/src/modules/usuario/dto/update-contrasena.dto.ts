import { IsString, MinLength } from 'class-validator';

export class UpdateContrasenaDto {
    @IsString()
    actual: string;

    @IsString()
    @MinLength(8)
    nueva: string;

    @IsString()
    @MinLength(8)
    confirmar: string;
}
