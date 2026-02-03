import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GatewayBallReadingDto } from './gateway-payload.dto';

export class CreateGatewayReadingDto {
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
  @ValidateNested({ each: true })
  @Type(() => GatewayBallReadingDto)
  balls?: GatewayBallReadingDto[];
}

export class BatchGatewayReadingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGatewayReadingDto)
  readings: CreateGatewayReadingDto[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  saveReadings?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  saveAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendAlerts?: boolean;
}
