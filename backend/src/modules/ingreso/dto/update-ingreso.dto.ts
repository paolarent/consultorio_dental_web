import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateIngresoDto } from './create-ingreso.dto';

export class UpdateIngresoDto extends PartialType(
    OmitType(CreateIngresoDto, ['id_consultorio', 'id_paciente'] as const),
) {}
