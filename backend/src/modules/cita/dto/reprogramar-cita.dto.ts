import { IsInt, IsDateString, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ReprogSolicitadaPor } from 'src/common/enums';

export class ReprogramarCitaDto {
    @IsInt()
    @IsNotEmpty()
    id_cita: number;

    @IsDateString()
    @IsNotEmpty()
    nueva_fecha: string;

    @IsString()
    @IsNotEmpty()
    nueva_hora: string;
}