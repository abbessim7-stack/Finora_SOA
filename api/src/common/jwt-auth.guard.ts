import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { RowDataPacket } from 'mysql2/promise';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface JwtPayload {
  sub: number;
  email: string;
  role: 'user' | 'admin';
}

export type AuthenticatedRequest = Request & { user?: JwtPayload };

interface AuthenticatedUserRow extends RowDataPacket {
  id: number;
  email: string;
  role: 'user' | 'admin';
  is_active: number | boolean;
}

/** Garde globale : toutes les routes exigent un jeton Bearer, sauf @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Jeton d’authentification manquant.');
    }

    let subject: number;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: number }>(token);
      subject = payload.sub;
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré.');
    }

    const users = await this.db.query<AuthenticatedUserRow[]>(
      'SELECT id, email, role, is_active FROM users WHERE id = ? LIMIT 1',
      [subject],
    );
    const user = users[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Compte désactivé ou introuvable.');
    }
    request.user = { sub: user.id, email: user.email, role: user.role };

    return true;
  }
}
