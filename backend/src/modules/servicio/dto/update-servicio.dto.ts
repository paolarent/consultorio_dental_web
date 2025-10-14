import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateServicioDto } from './create-servicio.dto';

export class UpdateServicioDto extends PartialType(
    OmitType(CreateServicioDto, ['id_consultorio', 'status'] as const),
) {}
