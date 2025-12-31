import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}

export class BatchGatewayReadingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGatewayReadingDto)
  readings: CreateGatewayReadingDto[];
}
