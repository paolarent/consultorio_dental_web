import { CreatePacienteDto } from './create-paciente.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';

export class UpdatePacienteDto extends PartialType(
    OmitType(CreatePacienteDto, ['status', 'id_usuario', 'id_consultorio'] as const),
) {}
