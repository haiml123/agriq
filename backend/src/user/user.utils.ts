import { role_type } from '@prisma/client';
import { UserWithRoles } from './user.type';

export function isSuperAdmin(user: UserWithRoles): boolean {
  return user.roles.some((role) => role.role === role_type.SUPER_ADMIN);
}

export function isOrgAdmin(user: UserWithRoles): boolean {
  return user.roles.some((role) => role.role === role_type.ORG_ADMIN);
}

export function getAdminOrganizationIds(user: UserWithRoles): string[] {
  return user.roles
    .filter((r) => r.role === role_type.ORG_ADMIN && r.organizationId)
    .map((r) => r.organizationId as string);
}

/**
 * Returns organization filter for Prisma where clause
 * - Super admin: returns requestedOrgId or undefined (no filter)
 * - Org admin: returns their org(s), validates access to requestedOrgId
 * - Returns null if user has no access
 */
export function getOrganizationFilter(
  user: UserWithRoles,
  requestedOrgId?: string,
): string | { in: string[] } | undefined | null {
  if (isSuperAdmin(user)) {
    return requestedOrgId || undefined;
  }

  const adminOrgIds = getAdminOrganizationIds(user);

  if (adminOrgIds.length === 0) {
    return null; // No access
  }

  // If specific org requested, validate access
  if (requestedOrgId) {
    return adminOrgIds.includes(requestedOrgId) ? requestedOrgId : null;
  }

  // Return single org or multiple
  return adminOrgIds.length === 1 ? adminOrgIds[0] : { in: adminOrgIds };
}

// In your role utils file
export function canAccessOrganization(
  user: UserWithRoles,
  organizationId: string,
): boolean {
  if (isSuperAdmin(user)) {
    return true;
  }
  return getAdminOrganizationIds(user).includes(organizationId);
}
