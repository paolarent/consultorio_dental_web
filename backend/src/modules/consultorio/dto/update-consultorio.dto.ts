import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateConsultorioDto } from './create-consultorio.dto';

export class UpdateConsultorioDto extends PartialType(
    OmitType(CreateConsultorioDto, ['status'] as const),
) {}