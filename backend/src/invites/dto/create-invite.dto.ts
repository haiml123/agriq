import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateInviteDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

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
