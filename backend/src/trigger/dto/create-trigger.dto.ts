import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { trigger_scope } from '@prisma/client';

// Enums
export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ScopeType {
  ORGANIZATION = 'ORGANIZATION',
  SITE = 'SITE',
  COMPOUND = 'COMPOUND',
  CELL = 'CELL',
}

export enum MetricType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  EMC = 'EMC',
}

export enum ConditionType {
  THRESHOLD = 'THRESHOLD',
  CHANGE = 'CHANGE',
}

export enum Operator {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
  EQUALS = 'EQUALS',
  BETWEEN = 'BETWEEN',
}

export enum ChangeDirection {
  ANY = 'ANY',
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
}

export enum ActionType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
}

export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR',
}

// Nested DTOs
export class NotificationTemplateDto {
  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

export class ConditionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(MetricType)
  metric: MetricType;

  @IsEnum(ConditionType)
  type: ConditionType;

  // Threshold fields
  @IsEnum(Operator)
  @IsOptional()
  operator?: Operator;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsNumber()
  @IsOptional()
  secondary_value?: number;

  // Change fields
  @IsEnum(ChangeDirection)
  @IsOptional()
  change_direction?: ChangeDirection;

  @IsNumber()
  @IsOptional()
  change_amount?: number;

  @IsNumber()
  @IsOptional()
  time_window_days?: number;
}

export class ActionDto {
  @IsEnum(ActionType)
  type: ActionType;

  @ValidateNested()
  @Type(() => NotificationTemplateDto)
  template: NotificationTemplateDto;
}

// Main Create DTO
export class CreateTriggerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(trigger_scope)
  scopeType: ScopeType;

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
  @ArrayMinSize(1, { message: 'At least one condition is required' })
  conditions: ConditionDto[];

  @IsEnum(ConditionLogic)
  @IsOptional()
  conditionLogic?: ConditionLogic = ConditionLogic.AND;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  @ArrayMinSize(1, { message: 'At least one action is required' })
  actions: ActionDto[];

  @IsEnum(Severity)
  severity: Severity;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
