import { IsEnum, IsNotEmpty } from 'class-validator';
import { EntityStatus } from '../../consts';

export class ChangeStatusDto {
  @IsEnum(EntityStatus)
  @IsNotEmpty()
  status: EntityStatus;
}
