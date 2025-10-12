import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { Status } from 'src/common/enums';

export class UpdateConsultorioDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsEmail()
    correo?: string;

    @IsOptional()
    @IsString()
    d_calle?: string;

    @IsOptional()
    @IsString()
    d_num_exterior?: string;

    @IsOptional()
    @IsString()
    d_colonia?: string;

    @IsOptional()
    @IsString()
    d_cp?: string;

    @IsOptional()
    @IsString()
    d_entidadfed?: string;

    @IsOptional()
    @IsString()
    d_municipio?: string;

    @IsOptional()
    @IsString()
    d_localidad?: string;

    @IsOptional()
    @IsString()
    titular_nombre?: string;

    @IsOptional()
    @IsString()
    titular_ap1?: string;

    @IsOptional()
    @IsString()
    titular_ap2?: string;

    @IsOptional()
    @IsString()
    facebook_url?: string;

    @IsOptional()
    @IsString()
    instagram_url?: string;

    @IsOptional()
    @IsString()
    maps_url?: string;
}
