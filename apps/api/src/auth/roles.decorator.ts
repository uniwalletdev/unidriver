import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@unidriver/shared';
import { ROLES_KEY } from './auth.constants';

/** Restricts a route to the given roles (ADMIN always allowed; BOTH covers OWNER/DRIVER). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
