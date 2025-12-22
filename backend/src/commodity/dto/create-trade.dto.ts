import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateTradeDto {
  @IsString()
  @IsNotEmpty()
  siteId: string;

  @IsString()
  @IsOptional()
  compoundId?: string;

  @IsString()
  @IsOptional()
  cellId?: string;

  @IsString()
  @IsNotEmpty()
  commodityTypeId: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsNumber()
  @Min(0.01)
  amountKg: number;

  @IsDateString()
  @IsOptional()
  tradedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
