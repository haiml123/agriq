import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { user_role as RoleType } from '@prisma/client';
import { EntityStatus } from '../../../consts';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  languagePreference?: string;

  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  siteIds?: string[];

  @IsOptional()
  @IsString()
  status?: EntityStatus;

  @IsOptional()
  @IsString()
  organizationId?: string;
}
