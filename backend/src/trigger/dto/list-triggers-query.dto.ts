import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Severity, ScopeType } from './create-trigger.dto';

export class ListTriggersQueryDto {
  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsOptional()
  siteId?: string;

  @IsString()
  @IsOptional()
  compoundId?: string;

  @IsString()
  @IsOptional()
  cellId?: string;

  @IsEnum(ScopeType)
  @IsOptional()
  scopeType?: ScopeType;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => parseInt(value, 10) || 1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value, 10) || 10)
  @IsOptional()
  limit?: number = 10;
}
