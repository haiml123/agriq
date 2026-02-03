import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGatewayVersionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  version!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SetActiveGatewayVersionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  version?: string;
}
