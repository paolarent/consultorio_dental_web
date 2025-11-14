import { IsString, IsOptional, IsInt, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SiONo, TipoPregunta } from 'src/common/enums';

class PreguntaDTO {
    @IsString()
    texto: string;

    @IsEnum(TipoPregunta)
    tipo: TipoPregunta;

    @IsOptional()
    @IsInt()
    id_tipo_clasificacion?: number;

    @IsOptional()
    @IsInt()
    id_tipo_alergia?: number;

    @IsOptional()
    @IsInt()
    id_tipo_condicion_med?: number;

    @IsEnum(SiONo)
    obligatorio?: SiONo;
}

export class CreateFormularioDTO {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsInt()
    id_consultorio: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PreguntaDTO)
    preguntas: PreguntaDTO[];
}
