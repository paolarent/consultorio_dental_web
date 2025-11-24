import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateHistorialDto } from './create-historial.dto';

export class UpdateHistorialDto extends PartialType(
    OmitType(CreateHistorialDto, ['status', 'id_paciente'] as const),
) {}