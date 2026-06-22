import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@unidriver/shared';
import { ROLES_KEY } from './auth.constants';
import { RequestWithUser } from './auth-provider.interface';

/** Enforces @Roles(...). ADMIN passes everything; BOTH satisfies OWNER/DRIVER requirements. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return user ? roleSatisfies(user.role, required) : false;
  }
}

function roleSatisfies(userRole: UserRole, required: UserRole[]): boolean {
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  if (required.includes(userRole)) {
    return true;
  }
  if (userRole === UserRole.BOTH) {
    return required.some((r) => r === UserRole.OWNER || r === UserRole.DRIVER);
  }
  return false;
}
