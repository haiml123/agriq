import { Prisma } from '@prisma/client';

export type UserWithRoles = Prisma.UserGetPayload<{
  include: { siteUsers: true };
}>;
