import { role_type, User, UserRole } from '@prisma/client';

export type AppUser = User & {
  roles: UserRole[];
  userRole?: role_type;
};
