import { IsInt, IsString, MaxLength } from 'class-validator';

export class CreateTipoEventoDto {
    @IsInt()
    id_consultorio: number;

    @IsString()
    @MaxLength(50)
    nombre: string;
}
