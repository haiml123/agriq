import { Organization, SiteUser, User } from '@prisma/client';

export type AppUser = User & {
  siteUsers: SiteUser[];
  organization?: Organization | null;
};
