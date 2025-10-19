import { Type } from 'class-transformer';
import { IsInt, IsDateString, IsString, MinLength, MaxLength, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Status } from 'src/common/enums';

export class CreateHistorialDto {
    @IsInt()
    id_paciente: number;

    @IsInt()
    id_servicio: number;

    @IsDate()
    @Type(() => Date) 
    fecha: Date;

    @IsString()
    @MinLength(5)
    @MaxLength(150)
    descripcion: string;

    @IsOptional()
    fotos?: Express.Multer.File[]; //por si se suben varias fotos desde el formulario

    @IsOptional()
    @IsEnum(Status)
    status?: Status;
}
