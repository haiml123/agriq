import { User, UserRole } from '@prisma/client';

export type AppUser = User & {
  roles: UserRole[];
};
