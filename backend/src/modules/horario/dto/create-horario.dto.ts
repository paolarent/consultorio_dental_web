import { IsInt, Min, Max, IsEnum, Matches, IsOptional } from 'class-validator';
import { Status } from 'src/common/enums';

export class CreateHorarioDto {
    @IsInt()
    @Min(1)
    @Max(7)
    dia: number; // 1=Lunes ... 7=Domingo

    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'hora_inicio must be in HH:MM format',
    })
    hora_inicio: string;

    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'hora_fin must be in HH:MM format',
    })
    hora_fin: string;

    @IsOptional() 
    @IsEnum(Status)
    status?: Status;
}
