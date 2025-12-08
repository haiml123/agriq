// backend/src/user/dto/create-user.dto.ts

import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { role_type } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  password: string;

  @IsString()
  organizationId: string;

  @IsEnum(role_type)
  role: role_type;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  siteIds?: string[];

  @IsString()
  @IsOptional()
  languagePreference?: string;
}
