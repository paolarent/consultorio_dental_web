import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreatePagoIngresoDto } from "./create-pago.dto";

export class AbonarIngresoDto {
    @IsNumber()
    monto: number;

    @IsNumber()
    @IsOptional()
    id_metodo_pago?: number;

    @IsOptional()
    referencia?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePagoIngresoDto)
    @IsOptional()
    pagosDivididos?: CreatePagoIngresoDto[];
}
