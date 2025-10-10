import { IsString, IsInt, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Sexo, SiONo, Status } from '../../../common/enums';

export class CreatePacienteDto {
    @IsString() nombre: string;
    @IsString() apellido1: string;
    @IsOptional() @IsString() apellido2?: string;
    @IsString() telefono: string;
    @IsDateString() fecha_nacimiento: string;
    @IsEnum(Sexo) sexo: Sexo;

    @IsOptional() @IsString() d_calle?: string;
    @IsOptional() @IsString() d_num_exterior?: string;
    @IsOptional() @IsString() d_colonia?: string;
    @IsOptional() @IsString() d_cp?: string;
    @IsOptional() @IsString() d_entidadfed?: string;
    @IsOptional() @IsString() d_municipio?: string;
    @IsOptional() @IsString() d_localidad?: string;

    @IsInt() id_usuario: number;
    @IsInt() id_consultorio: number;

    @IsEnum(SiONo) tiene_tutor: SiONo;
    @IsOptional() @IsString() tutor_nombre?: string;
    @IsOptional() @IsString() tutor_apellido1?: string;
    @IsOptional() @IsString() tutor_apellido2?: string;
    @IsOptional() @IsString() tutor_telefono?: string;
    @IsOptional() @IsString() tutor_correo?: string;
    @IsOptional() @IsString() tutor_relacion?: string;

    @IsOptional() @IsEnum(Status) status?: Status;
}
