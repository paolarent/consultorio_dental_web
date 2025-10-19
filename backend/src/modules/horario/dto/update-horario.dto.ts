import { CreateHorarioDto } from './create-horario.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';

export class UpdateHorarioDto extends PartialType(
    OmitType(CreateHorarioDto, ['status'] as const),
) {}