import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ResponderReprogramacionDto {
    @IsBoolean()
    @IsNotEmpty()
    aceptar: boolean; // true = acepta, false = rechaza
}