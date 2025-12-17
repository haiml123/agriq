import { role_type, User } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

function resolveUserRole(user: User): role_type | undefined {
  return user.userRole ?? (user as any)?.roles?.[0]?.role;
}

export function isSuperAdmin(user: User): boolean {
  return resolveUserRole(user) === role_type.SUPER_ADMIN;
}

export function isAdmin(user: User): boolean {
  return resolveUserRole(user) === role_type.ADMIN;
}

export function getAdminOrganizationIds(user: User): string[] {
  // In the new role model, admins are tied to their organizationId
  return isAdmin(user) && user.organizationId ? [user.organizationId] : [];
}

/**
 * Returns organization filter for Prisma where clause
 * - Super admin: returns requestedOrgId or undefined (no filter)
 * - Org admin: returns their org(s), validates access to requestedOrgId
 * - Returns null if user has no access
 */
export function getOrganizationFilter(
  user: User,
  requestedOrgId?: string,
): string | { in: string[] } | undefined | null {
  if (isSuperAdmin(user)) {
    return requestedOrgId || undefined;
  }

  const userOrgId = user.organizationId;

  if (!userOrgId) {
    return null;
  }

  if (isAdmin(user)) {
    if (requestedOrgId && requestedOrgId !== userOrgId) {
      return null;
    }
    return userOrgId;
  }

  // Operators cannot list organizations/users outside their scope
  return null;
}

/**
 * Validates if current user can manage (create/update) a user in the given organization
 * with the specified role. Throws ForbiddenException if not allowed.
 */
export function validateUserManagementPermission(params: {
  currentUser: User;
  targetOrganizationId: string | null;
  targetRole: role_type;
  existingUserRole?: role_type | null;
}): void {
  const { currentUser, targetOrganizationId, targetRole, existingUserRole } =
    params;

  // Super admins can do anything
  if (isSuperAdmin(currentUser)) {
    return;
  }

  // Admins can manage users only within their organization
  if (!isAdmin(currentUser) || !currentUser.organizationId) {
    throw new ForbiddenException(
      'You do not have permission to manage users in this organization',
    );
  }

  if (currentUser.organizationId !== targetOrganizationId) {
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
  if (existingUserRole === role_type.SUPER_ADMIN) {
    throw new ForbiddenException(
      'You do not have permission to edit super admin users',
    );
  }
}

// In your role utils file
export function canAccessOrganization(
  user: User,
  organizationId: string,
): boolean {
  if (isSuperAdmin(user)) {
    return true;
  }

  if (!user.organizationId) {
    return false;
  }

  if (isAdmin(user)) {
    return user.organizationId === organizationId;
  }

  // Operators can only access their own organization
  return user.organizationId === organizationId;
}
