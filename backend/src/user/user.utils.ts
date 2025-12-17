import { role_type } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { AppUser } from '../types/user.type';

export function isSuperAdmin(user: AppUser): boolean {
  return (
    (user as any).userRole === role_type.SUPER_ADMIN ||
    user.roles.some((role) => role.role === role_type.SUPER_ADMIN)
  );
}

export function isAdmin(user: AppUser): boolean {
  return (
    (user as any).userRole === role_type.ADMIN ||
    user.roles.some((role) => role.role === role_type.ADMIN)
  );
}

export function getUserLevelRole(user: AppUser): role_type {
  if (
    (user as any).userRole &&
    Object.values(role_type).includes((user as any).userRole)
  ) {
    return (user as any).userRole as role_type;
  }

  if (isSuperAdmin(user)) {
    return role_type.SUPER_ADMIN;
  }

  if (isAdmin(user)) {
    return role_type.ADMIN;
  }

  return role_type.OPERATOR;
}

export function getAdminOrganizationIds(user: AppUser): string[] {
  const orgIds =
    user.roles
      .filter((r) => r.role === role_type.ADMIN && r.organizationId !== null)
      .map((r) => r.organizationId as string) ?? [];

  if (isAdmin(user) && user.organizationId && !orgIds.includes(user.organizationId)) {
    orgIds.push(user.organizationId);
  }

  return orgIds;
}

export function getOperatorSiteIds(user: AppUser): string[] {
  return user.roles
    .filter(
      (r) =>
        r.siteId !== null &&
        [role_type.ADMIN, role_type.OPERATOR].includes(r.role),
    )
    .map((r) => r.siteId as string);
}

/**
 * Returns organization filter for Prisma where clause
 * - Super admin: returns requestedOrgId or undefined (no filter)
 * - Admin: returns their org, validates access to requestedOrgId
 * - Returns null if user has no access
 */
export function getOrganizationFilter(
  user: AppUser,
  requestedOrgId?: string,
): string | { in: string[] } | undefined | null {
  const levelRole = getUserLevelRole(user);

  if (levelRole === role_type.SUPER_ADMIN) {
    return requestedOrgId || undefined;
  }

  if (levelRole !== role_type.ADMIN) {
    return null;
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

/**
 * Validates if current user can manage (create/update) a user in the given organization
 * with the specified role. Throws ForbiddenException if not allowed.
 */
export function validateUserManagementPermission(params: {
  currentUser: AppUser;
    targetOrganizationId: string | null;
    targetRole: role_type;
    existingUserRoles?: { role: role_type }[]; // For update: existing user's roles
}): void {
  const { currentUser, targetOrganizationId, targetRole, existingUserRoles } = params;
  const currentUserLevelRole = getUserLevelRole(currentUser);

  // Super admins can do anything
  if (currentUserLevelRole === role_type.SUPER_ADMIN) {
    return;
  }

  const adminOrgIds = getAdminOrganizationIds(currentUser);

  // Check organization access
  if (!targetOrganizationId || !adminOrgIds.includes(targetOrganizationId)) {
    throw new ForbiddenException(
      'You do not have permission to manage users in this organization',
    );
  }

  // Admins cannot assign super admin role
  if (targetRole === role_type.SUPER_ADMIN) {
    throw new ForbiddenException(
      'You do not have permission to assign super admin role',
    );
  }

  // Admins cannot edit existing super admins
  if (existingUserRoles?.some((r) => r.role === role_type.SUPER_ADMIN)) {
    throw new ForbiddenException(
      'You do not have permission to edit super admin users',
    );
  }
}

// In your role utils file
export function canAccessOrganization(
  user: AppUser,
  organizationId: string,
): boolean {
  const userRole = getUserLevelRole(user);

  if (userRole === role_type.SUPER_ADMIN) {
    return true;
  }

  if (userRole === role_type.ADMIN) {
    return getAdminOrganizationIds(user).includes(organizationId);
  }

  return false;
}
