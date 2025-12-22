import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateCommodityDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  origin?: string;

  @IsString()
  @IsOptional()
  commodityTypeId?: string;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
