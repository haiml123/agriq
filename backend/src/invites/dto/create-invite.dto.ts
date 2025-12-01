import {
  IsEmail,
  IsString,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateInviteDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsInt()
  @IsPositive()
  roleId: number;

  @IsString()
  organizationId: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  expiresInDays?: number; // Default: 7 days
}
