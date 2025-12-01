import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(50)
  lastName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid international format',
  })
  phone?: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(100)
  password: string;
}
