import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatusCitas } from 'src/common/enums';

export class ActualizarStatusCitaDto {
    @IsEnum(StatusCitas)
    @IsNotEmpty()
    status: StatusCitas;
}