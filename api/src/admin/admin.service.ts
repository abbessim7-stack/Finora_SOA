import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import type { JwtPayload } from '../common/jwt-auth.guard';
import { AdminUsersQueryDto, UpdateAdminUserDto } from './admin.dto';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  is_active: number | boolean;
  created_at: string;
}

interface CountRow extends RowDataPacket {
  total: number;
  active: number;
  admins: number;
  new_users: number;
}

interface UsageRow extends RowDataPacket {
  day: string;
  logged_in_users: number;
  active_seconds: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  async overview() {
    const [counts, usageRows, databaseStatus] = await Promise.all([
      this.db.query<CountRow[]>(
        `SELECT
           COUNT(*) AS total,
           COALESCE(SUM(is_active = TRUE), 0) AS active,
           COALESCE(SUM(role = 'admin' AND is_active = TRUE), 0) AS admins,
           COALESCE(SUM(created_at >= CURRENT_DATE - INTERVAL 30 DAY), 0) AS new_users
         FROM users`,
      ),
      this.db.query<UsageRow[]>(
        `SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day,
                SUM(logged_in = TRUE) AS logged_in_users,
                COALESCE(SUM(active_seconds), 0) AS active_seconds
         FROM user_daily_activity
         WHERE day >= UTC_DATE() - INTERVAL 6 DAY
         GROUP BY day
         ORDER BY day`,
      ),
      this.checkDatabase(),
    ]);

    const usageByDay = new Map(
      usageRows.map((row) => [
        row.day,
        {
          loggedInUsers: Number(row.logged_in_users),
          activeSeconds: Number(row.active_seconds),
        },
      ]),
    );
    const usage = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - (6 - index));
      const day = date.toISOString().slice(0, 10);
      return {
        day,
        loggedInUsers: usageByDay.get(day)?.loggedInUsers ?? 0,
        activeSeconds: usageByDay.get(day)?.activeSeconds ?? 0,
      };
    });
    const totals = counts[0];

    return {
      users: {
        total: Number(totals?.total ?? 0),
        active: Number(totals?.active ?? 0),
        admins: Number(totals?.admins ?? 0),
        newLast30Days: Number(totals?.new_users ?? 0),
      },
      usage,
      services: {
        api: 'operational' as const,
        database: databaseStatus,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async listUsers(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const where = search ? 'WHERE name LIKE ? OR email LIKE ?' : '';
    const params = search ? [`%${search}%`, `%${search}%`] : [];
    const [rows, countRows] = await Promise.all([
      this.db.query<UserRow[]>(
        `SELECT id, name, email, role, is_active, created_at
         FROM users ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit],
      ),
      this.db.query<CountRow[]>(
        `SELECT COUNT(*) AS total FROM users ${where}`,
        params,
      ),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async updateUser(userId: number, actor: JwtPayload, dto: UpdateAdminUserDto) {
    if (dto.role === undefined && dto.isActive === undefined) {
      throw new BadRequestException('Au moins un changement est requis.');
    }

    return this.db.transaction(async (connection: PoolConnection) => {
      const [activeAdmins] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE role = ? AND is_active = TRUE ORDER BY id FOR UPDATE',
        ['admin'],
      );
      const [rows] = await connection.query<UserRow[]>(
        'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ? FOR UPDATE',
        [userId],
      );
      const user = rows[0];
      if (!user) throw new NotFoundException('Compte introuvable.');

      const nextRole = dto.role ?? user.role;
      const nextActive = dto.isActive ?? Boolean(user.is_active);
      if (userId === actor.sub && (nextRole !== 'admin' || !nextActive)) {
        throw new BadRequestException('Vous ne pouvez pas retirer vos propres droits admin ni désactiver votre compte.');
      }

      const removesActiveAdmin =
        user.role === 'admin' && Boolean(user.is_active) && (nextRole !== 'admin' || !nextActive);
      if (removesActiveAdmin && activeAdmins.length <= 1) {
        throw new ConflictException('Le dernier compte admin actif ne peut pas être rétrogradé ou désactivé.');
      }

      await connection.query(
        'UPDATE users SET role = ?, is_active = ? WHERE id = ?',
        [nextRole, nextActive, userId],
      );
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: nextRole,
        isActive: nextActive,
        createdAt: user.created_at,
      };
    });
  }

  private async checkDatabase(): Promise<'operational' | 'degraded'> {
    try {
      await this.db.query<RowDataPacket[]>('SELECT 1');
      return 'operational';
    } catch {
      return 'degraded';
    }
  }
}
