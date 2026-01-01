import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { entity_status } from '@prisma/client';

export class CreateGatewayDto {
  @IsString()
  @IsOptional()
  cellId?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(120)
  externalId?: string;

  @IsEnum(entity_status)
  @IsOptional()
  status?: entity_status = entity_status.ACTIVE;
}

export class UpdateGatewayDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsEnum(entity_status)
  @IsOptional()
  status?: entity_status;
}
