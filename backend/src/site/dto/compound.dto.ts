import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { entity_status } from '@prisma/client';

export class CreateCompoundDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  siteId: string;

  @IsEnum(entity_status)
  @IsOptional()
  status?: entity_status = entity_status.ACTIVE;
}

export class UpdateCompoundDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsEnum(entity_status)
  @IsOptional()
  status?: entity_status;
}
