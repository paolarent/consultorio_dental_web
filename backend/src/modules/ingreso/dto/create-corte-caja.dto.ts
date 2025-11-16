import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateCorteDto {
    @IsString()
    @IsOptional()
    fecha_apertura?: string; // yyyy-mm-dd (si no se manda se usa now())

    @IsNumber()
    @IsNotEmpty()
    id_consultorio: number;

    @IsNumber()
    @IsNotEmpty()
    usuario_apertura: number;

    @IsNumber()
    @IsNotEmpty()
    monto_apertura: number;

    @IsString()
    @IsOptional()
    notas?: string;
}
