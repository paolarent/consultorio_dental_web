import { PartialType } from "@nestjs/mapped-types";
import { CreatePagoIngresoDto } from "./create-pago.dto";

export class UpdatePagoIngresoDto extends PartialType(CreatePagoIngresoDto) {}
