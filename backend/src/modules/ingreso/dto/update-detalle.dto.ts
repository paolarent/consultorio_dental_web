import { PartialType } from "@nestjs/mapped-types";
import { CreateDetalleIngresoDto } from "./create-detalle.dto";

export class UpdateDetalleIngresoDto extends PartialType(CreateDetalleIngresoDto) {}
