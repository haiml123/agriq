import { SetMetadata } from '@nestjs/common';
import { role_type } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: role_type[]) => SetMetadata(ROLES_KEY, roles);
