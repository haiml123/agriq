// backend/src/user/dto/create-user.dto.ts

import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { user_role } from '@prisma/client';

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
  @IsOptional()
  organizationId?: string;

  @IsEnum(user_role)
  role: user_role;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  siteIds?: string[];

  @IsString()
  @IsOptional()
  languagePreference?: string;
}
