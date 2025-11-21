import { IsEmail, IsString, IsEnum, IsOptional, IsInt, ValidateIf, Matches } from 'class-validator';
import { Sexo, SiONo, Status } from '../../../common/enums';

export class CreateRegistroDto {
    //Campos de usuario
    @IsEmail()
    correo: string;

    //@IsString()
    //@Matches(
      //  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,20}$/,
      //  { message: 'La contraseña debe tener entre 8 y 20 caracteres, incluir al menos una mayúscula, una minúscula, un número y un símbolo especial.' },
    //)
    //contrasena: string;

    @IsOptional()
    contrasena?: string;

    @IsOptional()
    @IsInt()
    id_consultorio?: number;

    // Campos de paciente
    @IsString()
    nombre: string;

    @IsString()
    apellido1: string;

    @IsOptional()
    @IsString()
    apellido2?: string;

    @IsString()
    telefono: string;

    @IsString()
    fecha_nacimiento: string;

    @IsEnum(Sexo)
    sexo: Sexo;

    //DIRECCION
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

    //TUTOR
    @IsEnum(SiONo)
    tiene_tutor: SiONo;

    @ValidateIf((o) => o.tiene_tutor === 'si')
    @IsString()
    tutor_nombre?: string;

    @ValidateIf((o) => o.tiene_tutor === 'si')
    @IsString()
    tutor_apellido1?: string;

    @ValidateIf((o) => o.tiene_tutor === 'si')
    @IsString()
    tutor_apellido2?: string;

    @ValidateIf((o) => o.tiene_tutor === 'si')
    @IsString()
    tutor_telefono?: string;

    @ValidateIf((o) => o.tiene_tutor === 'si')
    @IsString()
    tutor_correo?: string;

    @ValidateIf((o) => o.tiene_tutor === 'si')
    @IsString()
    tutor_relacion?: string;
}
