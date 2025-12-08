import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserWithRoles } from '../../user/user.type';
import { role_type } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user?: UserWithRoles;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<role_type[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.roles) {
      return false;
    }

    // Check if user has any of the required roles
    return user.roles.some((userRole: any) =>
      requiredRoles.includes(userRole.role),
    );
  }
}
