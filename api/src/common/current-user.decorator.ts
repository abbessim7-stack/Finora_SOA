import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, JwtPayload } from './jwt-auth.guard';

/** Injecte l'utilisateur issu du jeton : l'identité ne vient jamais du client. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new Error('Utilisateur absent de la requête');
    return request.user;
  },
);
