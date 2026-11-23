import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { LoginDto, RegisterDto, UpdateAccountDto } from './dto/auth.dto';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: 'user' | 'admin';
  is_active: number | boolean;
}

interface AccountStatusRow extends RowDataPacket {
  role: 'user' | 'admin';
  is_active: number | boolean;
}

const STARTER_CATEGORIES: Array<[string, 'income' | 'expense']> = [
  ['Alimentation', 'expense'],
  ['Transport', 'expense'],
  ['Logement', 'expense'],
  ['Loisirs', 'expense'],
  ['Santé', 'expense'],
  ['Abonnements', 'expense'],
  ['Éducation', 'expense'],
  ['Divers', 'expense'],
  ['Salaire', 'income'],
  ['Freelance', 'income'],
  ['Cadeaux', 'income'],
  ['Remboursements', 'income'],
];

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  private async issueSession(user: { id: number; name: string; email: string; role: 'user' | 'admin' }) {
    await this.db.execute(
      `INSERT INTO user_daily_activity (user_id, day, logged_in, active_seconds, last_seen_at)
       VALUES (?, UTC_DATE(), TRUE, 0, UTC_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE logged_in = TRUE`,
      [user.id],
    );
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async recordActivity(userId: number): Promise<void> {
    await this.db.execute(
      `INSERT INTO user_daily_activity (user_id, day, logged_in, active_seconds, last_seen_at)
       VALUES (?, UTC_DATE(), TRUE, 0, UTC_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE
         logged_in = TRUE,
         active_seconds = active_seconds + CASE
           WHEN last_seen_at IS NOT NULL
             AND TIMESTAMPDIFF(SECOND, last_seen_at, UTC_TIMESTAMP(3)) BETWEEN 1 AND 90
           THEN TIMESTAMPDIFF(SECOND, last_seen_at, UTC_TIMESTAMP(3))
           ELSE 0
         END,
         last_seen_at = UTC_TIMESTAMP(3)`,
      [userId],
    );
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    const existing = await this.db.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    if (existing.length > 0) {
      throw new ConflictException('Un compte existe déjà avec cette adresse email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const userId = await this.db.transaction(async (connection: PoolConnection) => {
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [email, passwordHash, name, 'user'],
      );
      const id = result.insertId;

      for (const [categoryName, type] of STARTER_CATEGORIES) {
        await connection.query('INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)', [
          id,
          categoryName,
          type,
        ]);
      }

      return id;
    });

    return this.issueSession({ id: userId, name, email, role: 'user' });
  }

  async login(dto: LoginDto) {
    const rows = await this.db.query<UserRow[]>(
      'SELECT id, email, name, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1',
      [dto.email.trim().toLowerCase()],
    );
    const user = rows[0];

    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect.');
    if (!user.is_active) throw new UnauthorizedException('Ce compte a été désactivé.');

    const matches = await bcrypt.compare(dto.password, user.password_hash);
    if (!matches) throw new UnauthorizedException('Email ou mot de passe incorrect.');

    return this.issueSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  }

  async profile(userId: number) {
    const rows = await this.db.query<UserRow[]>(
      'SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    const user = rows[0];
    if (!user) throw new UnauthorizedException('Compte introuvable.');
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async updateAccount(userId: number, dto: UpdateAccountDto) {
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();
    if (name.length < 2) {
      throw new BadRequestException('Le nom doit contenir au moins 2 caractères.');
    }
    const existing = await this.db.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
      [email, userId],
    );
    if (existing.length > 0) {
      throw new ConflictException('Un compte existe déjà avec cette adresse email.');
    }

    await this.db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);
    const rows = await this.db.query<UserRow[]>(
      'SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    const user = rows[0];
    return { id: userId, name, email, role: user?.role ?? 'user' };
  }

  /** Suppression du compte : les données de l'utilisateur sont effacées d'abord. */
  async deleteAccount(userId: number): Promise<void> {
    await this.db.transaction(async (connection: PoolConnection) => {
      const [activeAdmins] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE role = ? AND is_active = TRUE ORDER BY id FOR UPDATE',
        ['admin'],
      );
      const [rows] = await connection.query<AccountStatusRow[]>(
        'SELECT role, is_active FROM users WHERE id = ? FOR UPDATE',
        [userId],
      );
      if (rows[0]?.role === 'admin' && rows[0].is_active && activeAdmins.length <= 1) {
        throw new ConflictException('Le dernier compte admin actif ne peut pas être supprimé.');
      }
      await connection.query('DELETE FROM transactions WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM budgets WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM categories WHERE user_id = ?', [userId]);
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);
    });
  }
}
