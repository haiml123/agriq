import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateSiteDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;
}
