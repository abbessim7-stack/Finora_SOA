import { BadRequestException, Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { addMonths, assertMonth, currentMonth, monthBounds } from '../common/month';
import { DatabaseService } from '../database/database.service';

interface TotalsRow extends RowDataPacket {
  income: number;
  expense: number;
}

interface CategoryTotalRow extends RowDataPacket {
  categoryId: number;
  name: string;
  total: number;
}

interface TrendRow extends RowDataPacket {
  month: string;
  income: number;
  expense: number;
}

const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async summary(userId: number, month?: string) {
    const key = month ? assertMonth(month) : currentMonth();
    const { from, to } = monthBounds(key);

    const totalsRows = await this.db.query<TotalsRow[]>(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)  AS income,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id = ? AND date BETWEEN ? AND ?`,
      [userId, from, to],
    );
    const totals = totalsRows[0] ?? { income: 0, expense: 0 };
    const income = round(Number(totals.income));
    const expense = round(Number(totals.expense));

    const byCategoryRows = await this.db.query<CategoryTotalRow[]>(
      `SELECT t.category_id AS categoryId, c.name, SUM(t.amount) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.date BETWEEN ? AND ?
       GROUP BY t.category_id, c.name
       ORDER BY total DESC`,
      [userId, from, to],
    );

    return {
      month: key,
      income,
      expense,
      balance: round(income - expense),
      byCategory: byCategoryRows.map((row) => {
        const total = round(Number(row.total));
        return {
          categoryId: row.categoryId,
          name: row.name,
          total,
          share: expense > 0 ? total / expense : 0,
        };
      }),
    };
  }

  async trend(userId: number, months = 6, to?: string) {
    const count = Math.min(24, Math.max(1, Number(months) || 6));
    const end = to ? assertMonth(to) : currentMonth();
    if (!Number.isFinite(count)) throw new BadRequestException('Paramètre months invalide.');

    const start = addMonths(end, -(count - 1));
    const { from } = monthBounds(start);
    const { to: lastDay } = monthBounds(end);

    const rows = await this.db.query<TrendRow[]>(
      `SELECT DATE_FORMAT(date, '%Y-%m') AS month,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)  AS income,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id = ? AND date BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(date, '%Y-%m')`,
      [userId, from, lastDay],
    );

    const byMonth = new Map(rows.map((row) => [row.month, row]));
    const points: Array<{ month: string; income: number; expense: number; balance: number }> = [];

    for (let index = 0; index < count; index += 1) {
      const month = addMonths(start, index);
      const row = byMonth.get(month);
      const income = round(Number(row?.income ?? 0));
      const expense = round(Number(row?.expense ?? 0));
      points.push({ month, income, expense, balance: round(income - expense) });
    }

    return points;
  }
}
