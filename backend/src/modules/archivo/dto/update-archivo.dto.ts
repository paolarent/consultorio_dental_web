import { CreateArchivoDto } from './create-archivo.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';

export class UpdateArchivoDto extends PartialType(
    OmitType(CreateArchivoDto, ['status'] as const),
) {}