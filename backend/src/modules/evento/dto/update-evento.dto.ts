import { IsInt, IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';
import { si_o_no, status_evento } from '@prisma/client';
import { SiONo, StatusEvento } from 'src/common/enums';

export class UpdateEventoDto {
    @IsString()
    @IsOptional()
    titulo?: string;

    @IsInt()
    @IsOptional()
    id_tipo_evento?: number;

    @IsDateString()
    @IsOptional()
    fecha_inicio?: string;

    @IsDateString()
    @IsOptional()
    fecha_fin?: string;

    @IsEnum(SiONo)
    @IsOptional()
    evento_todo_el_dia: SiONo;

    @IsString()
    @IsOptional()
    hora_inicio?: string;

    @IsString()
    @IsOptional()
    hora_fin?: string;

    @IsString()
    @IsOptional()
    notas?: string;

    @IsOptional()
    @IsEnum(StatusEvento)
    status?: StatusEvento;
}