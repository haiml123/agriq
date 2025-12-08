import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Severity,
  ScopeType,
  ConditionLogic,
  ConditionDto,
  ActionDto,
} from './create-trigger.dto';

export class UpdateTriggerDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ScopeType)
  @IsOptional()
  scopeType?: ScopeType;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  @IsOptional()
  conditions?: ConditionDto[];

  @IsEnum(ConditionLogic)
  @IsOptional()
  conditionLogic?: ConditionLogic;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  @IsOptional()
  actions?: ActionDto[];

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
