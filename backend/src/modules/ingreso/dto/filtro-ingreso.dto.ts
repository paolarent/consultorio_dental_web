import { IsOptional, IsNumber, IsString } from 'class-validator';
import { StatusIngreso } from 'src/common/enums';

export class FilterIngresosDto {
    @IsOptional() @IsString() fecha?: string;
    @IsOptional() @IsString() fecha_inicio?: string;
    @IsOptional() @IsString() fecha_fin?: string;
    @IsOptional() @IsNumber() id_consultorio?: number;
    @IsOptional() @IsNumber() id_paciente?: number;
    @IsOptional() @IsNumber() id_metodo_pago?: number;

    @IsOptional()
    @IsString()
    status?: StatusIngreso | string;
}
