import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthClaims, RequestWithUser } from './auth-provider.interface';

/** Injects the authenticated user's claims into a controller handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthClaims | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
