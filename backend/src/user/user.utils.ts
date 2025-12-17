import { ForbiddenException } from '@nestjs/common';
import { AppUser } from '../types/user.type';
import { user_role } from '@prisma/client';

export function isSuperAdmin(user: AppUser): boolean {
  return user.userRole === user_role.SUPER_ADMIN;
}

export function isAdmin(user: AppUser): boolean {
  return user.userRole === user_role.ADMIN;
}

export function getAdminOrganizationIds(user: AppUser): string[] {
  if (isAdmin(user) && user.organizationId) {
    return [user.organizationId];
  }
  return [];
}

/**
 * Returns organization filter for Prisma where clause
 * - Super admin: returns requestedOrgId or undefined (no filter)
 * - Org admin: returns their org(s), validates access to requestedOrgId
 * - Returns null if user has no access
 */
export function getOrganizationFilter(
  user: AppUser,
  requestedOrgId?: string,
): string | undefined | null {
  if (isSuperAdmin(user)) {
    return requestedOrgId || undefined;
  }

  const userOrgId = user.organizationId;
  if (!userOrgId) {
    return null;
  }

  if (requestedOrgId && requestedOrgId !== userOrgId) {
    return null;
  }

  return userOrgId;
}

/**
 * Validates if current user can manage (create/update) a user in the given organization
 * with the specified role. Throws ForbiddenException if not allowed.
 */
export function validateUserManagementPermission(params: {
  currentUser: AppUser;
  targetOrganizationId: string | null;
  targetRole: user_role;
  existingUserRole?: user_role; // For update: existing user's role
}): void {
  const { currentUser, targetOrganizationId, targetRole, existingUserRole } =
    params;

  if (isSuperAdmin(currentUser)) {
    return;
  }

  if (!isAdmin(currentUser)) {
    throw new ForbiddenException('You are not authorized for this action');
  }

  if (
    !targetOrganizationId ||
    currentUser.organizationId !== targetOrganizationId
  ) {
    throw new ForbiddenException(
      'You do not have permission to manage users in this organization',
    );
  }

  if (targetRole === user_role.SUPER_ADMIN) {
    throw new ForbiddenException(
      'You do not have permission to assign super admin role',
    );
  }

  if (existingUserRole === user_role.SUPER_ADMIN) {
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
  if (isSuperAdmin(user)) {
    return true;
  }

  if (isAdmin(user) && user.organizationId === organizationId) {
    return true;
  }

  return user.organizationId === organizationId;
}
