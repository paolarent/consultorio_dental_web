import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CloseCorteDto {
    @IsNumber()
    @IsNotEmpty()
    id_consultorio: number;

    @IsNumber()
    @IsNotEmpty()
    usuario_cierre: number;

    @IsNumber()
    @IsNotEmpty()
    monto_cierre: number;

    @IsString()
    @IsOptional()
    notas?: string;
}
