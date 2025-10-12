import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Sexo, SiONo } from '../../../common/enums';

export class UpdatePacienteDto {
    @IsOptional() @IsString() nombre?: string;
    @IsOptional() @IsString() apellido1?: string;
    @IsOptional() @IsString() apellido2?: string;
    @IsOptional() @IsString() telefono?: string;
    @IsOptional() @IsDateString() fecha_nacimiento?: string;
    @IsOptional() @IsEnum(Sexo) sexo?: Sexo;

    // Dirección
    @IsOptional() @IsString() d_calle?: string;
    @IsOptional() @IsString() d_num_exterior?: string;
    @IsOptional() @IsString() d_colonia?: string;
    @IsOptional() @IsString() d_cp?: string;
    @IsOptional() @IsString() d_entidadfed?: string;
    @IsOptional() @IsString() d_municipio?: string;
    @IsOptional() @IsString() d_localidad?: string;

    // Tutor
    @IsOptional() @IsEnum(SiONo) tiene_tutor?: SiONo;
    @IsOptional() @IsString() tutor_nombre?: string;
    @IsOptional() @IsString() tutor_apellido1?: string;
    @IsOptional() @IsString() tutor_apellido2?: string;
    @IsOptional() @IsString() tutor_telefono?: string;
    @IsOptional() @IsString() tutor_correo?: string;
    @IsOptional() @IsString() tutor_relacion?: string;
}
