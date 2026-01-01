import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignGatewayDto {
  @IsString()
  @IsNotEmpty()
  cellId: string;
}

export class RegisterGatewayDto {
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
