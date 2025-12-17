import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
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
  capacity: number;

  @IsEnum(entity_status)
  @IsOptional()
  status?: entity_status = entity_status.ACTIVE;
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
  capacity?: number;

  @IsEnum(entity_status)
  @IsOptional()
  status?: entity_status;
}
