import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatusArchivo } from 'src/common/enums';

export class CreateArchivoDto {
    @IsString()
    @MaxLength(40)
    nombre: string;

    @IsString()
    @IsOptional()
    @MaxLength(150)
    descripcion?: string;

    @IsOptional()
    @IsEnum(StatusArchivo)
    status: StatusArchivo;
}