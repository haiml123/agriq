import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsEnum,
} from 'class-validator';

export enum TradeDirection {
  IN = 'IN',
  OUT = 'OUT',
}

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

  @IsEnum(TradeDirection)
  @IsOptional()
  direction?: TradeDirection;

  @IsString()
  @IsOptional()
  buyer?: string;
}
