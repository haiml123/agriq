import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { entity_status } from '@prisma/client';

export class CreateCellDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  compoundId: string;

  @IsNumber()
  @Min(0)
  height: number;

  @IsNumber()
  @Min(0)
  length: number;

  @IsNumber()
  @Min(0)
  width: number;

  @IsEnum(entity_status)
  @IsOptional()
  status?: entity_status = entity_status.ACTIVE;

  @IsObject()
  @IsOptional()
  locale?: Record<string, string>;
}

export class UpdateCellDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  height?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  length?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  width?: number;

  @IsEnum(entity_status)
  @IsOptional()
  status?: entity_status;

  @IsObject()
  @IsOptional()
  locale?: Record<string, string>;
}
