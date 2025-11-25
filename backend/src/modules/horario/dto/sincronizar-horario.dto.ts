import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SyncHorarioDto {
  @IsOptional()
  @IsNumber()
  id?: number | null;

  @IsOptional()
  @IsNumber()
  dia?: number;

  @IsOptional()
  @IsString()
  inicio?: string;

  @IsOptional()
  @IsString()
  fin?: string;

  @IsOptional()
  @IsNumber()
  delete?: number | null;
}
