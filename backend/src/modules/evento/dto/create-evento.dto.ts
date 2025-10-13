import { IsInt, IsString, IsOptional, IsDate, IsEnum, Matches, } from 'class-validator';
import { SiONo, StatusEvento } from '../../../common/enums';
import { Type } from 'class-transformer';

export class CreateEventoDto {
    @IsString()
    titulo: string;

    @IsInt()
    id_tipo_evento: number;

    @IsDate()
    @Type(() => Date) 
    fecha_inicio: Date;

    @IsDate()
    @Type(() => Date)
    fecha_fin: Date;

    @IsEnum(SiONo)
    evento_todo_el_dia: SiONo;

    @IsOptional()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato HH:mm' })
    hora_inicio?: string;

    @IsOptional()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato HH:mm' })
    hora_fin?: string;

    @IsInt()
    id_consultorio: number;

    @IsOptional()
    @IsString()
    notas?: string;

    @IsOptional()
    @IsEnum(StatusEvento)
    status?: StatusEvento;
}
