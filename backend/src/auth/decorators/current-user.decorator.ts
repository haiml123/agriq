import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { AppUser } from '../../types/user.type';

export const CurrentUser = createParamDecorator(
  (data: keyof AppUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: User }>();

    if (!request.user) {
      return null;
    }

    if (data) {
      return request.user[data as keyof User];
    }

    return request.user;
  },
);
