import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateLookupTableDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  data?: Record<string, any> | any[];
}
