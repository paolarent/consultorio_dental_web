import { IsInt, IsString, IsOptional, IsDate, IsEnum, Matches, IsNotEmpty, IsDateString, } from 'class-validator';
import { SiONo, StatusEvento } from '../../../common/enums';
import { Type } from 'class-transformer';

export class CreateEventoDto {
    @IsString()
    @IsNotEmpty()
    titulo: string;

    @IsInt()
    @IsNotEmpty()
    id_tipo_evento: number;

    @IsDateString()
    @IsNotEmpty()
    fecha_inicio: string;

    @IsDateString()
    @IsNotEmpty()
    fecha_fin: string;

    @IsEnum(SiONo)
    @IsNotEmpty()
    evento_todo_el_dia: SiONo;

    @IsString()
    @IsOptional()
    hora_inicio?: string; // "HH:mm"

    @IsString()
    @IsOptional()
    hora_fin?: string; // "HH:mm"

    @IsInt()
    @IsNotEmpty()
    id_consultorio: number;

    @IsString()
    @IsOptional()
    notas?: string;

    //@IsOptional()
    //@IsEnum(StatusEvento)
    //status?: StatusEvento;
}
