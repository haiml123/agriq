import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class ListTranslationsQueryDto {
  @IsString()
  entity: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : value,
  )
  @IsArray()
  @IsString({ each: true })
  entityIds?: string[];
}
