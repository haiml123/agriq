import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class UpdateCommodityTypeDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
