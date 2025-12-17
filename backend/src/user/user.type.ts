import { Prisma } from '@prisma/client';

export type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: true; siteUsers: true };
}>;
