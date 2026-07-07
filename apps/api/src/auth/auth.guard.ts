import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_PROVIDER, IS_PUBLIC_KEY } from './auth.constants';
import { AuthProvider, RequestWithUser } from './auth-provider.interface';

/** Global guard: verifies the bearer token via the configured provider unless @Public. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_PROVIDER) private readonly authProvider: AuthProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = await this.authProvider.verifyToken(token);
    return true;
  }
}

/** Pulls the value out of an `Authorization: Bearer <token>` header, if any. */
export function extractBearerToken(request: RequestWithUser): string | undefined {
  const header = request.headers.authorization;
  if (!header) {
    return undefined;
  }
  const [type, value] = header.split(' ');
  return type === 'Bearer' ? value : undefined;
}
