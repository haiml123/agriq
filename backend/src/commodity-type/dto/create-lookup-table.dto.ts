import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LookupTableDataDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  tempRanges: number[];

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  humidityRanges: number[];

  @IsArray()
  @ArrayNotEmpty()
  @IsArray({ each: true })
  values: number[][];
}

export class CreateLookupTableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => LookupTableDataDto)
  data: LookupTableDataDto;
}
