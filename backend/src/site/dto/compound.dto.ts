import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsObject,
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

  @IsObject()
  @IsOptional()
  locale?: Record<string, string>;
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

  @IsObject()
  @IsOptional()
  locale?: Record<string, string>;
}
