import { IsDateString, IsInt, IsNotEmpty } from 'class-validator';

export class ConsultarDisponibilidadDto {
    @IsDateString()
    @IsNotEmpty()
    fecha: string;

    //@IsInt()
    //@IsNotEmpty()
    //id_consultorio: number;
}