import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { entity_status } from '@prisma/client';

export class CreateSensorDto {
  @IsString()
  @IsNotEmpty()
  gatewayId: string;

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

export class TransferSensorDto {
  @IsString()
  @IsNotEmpty()
  gatewayId: string;
}
