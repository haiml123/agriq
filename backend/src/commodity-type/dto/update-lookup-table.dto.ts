import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { LookupTableDataDto } from './create-lookup-table.dto';

export class UpdateLookupTableDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => LookupTableDataDto)
  data?: LookupTableDataDto;
}
