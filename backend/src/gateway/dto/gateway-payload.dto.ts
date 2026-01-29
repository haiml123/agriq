import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GatewayBallReadingDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  macId?: string;

  @IsNumber()
  @Type(() => Number)
  temperature: number;

  @IsNumber()
  @Type(() => Number)
  humidity: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  batteryPercent?: number;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}

export class CreateGatewayPayloadDto {
  @IsOptional()
  @IsString()
  macId?: string;

  @IsNumber()
  @Type(() => Number)
  temperature: number;

  @IsNumber()
  @Type(() => Number)
  humidity: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  batteryPercent: number;

  @IsDateString()
  recordedAt: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GatewayBallReadingDto)
  balls?: GatewayBallReadingDto[];
}

export class BatchGatewayPayloadDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGatewayPayloadDto)
  readings: CreateGatewayPayloadDto[];
}
