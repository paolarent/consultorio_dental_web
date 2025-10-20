import { IsInt, IsString, IsEnum, IsOptional } from 'class-validator';
import { SiONo, StatusCondicionMed } from '../../../common/enums';
import { Type } from 'class-transformer';

export class CreateCondicionMedicaDto {
    @IsInt()
    @Type(() => Number)
    id_tipo_condicion: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    id_paciente?: number; // solo lo usa dentista

    @IsString()
    nombre: string;

    @IsInt()
    @Type(() => Number)
    a_o_diagnostico: number;

    @IsString()
    medicamentos_actuales: string;

    @IsEnum(SiONo)
    condicion_controlada: SiONo;

    @IsOptional()
    @IsEnum(StatusCondicionMed)
    status: StatusCondicionMed;
}
