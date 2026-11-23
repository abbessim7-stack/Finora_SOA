import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { assertDate, monthBounds } from '../common/month';
import { DatabaseService } from '../database/database.service';
import { CreateTransactionDto, QueryTransactionsDto, UpdateTransactionDto } from './dto/transaction.dto';

interface TransactionRow extends RowDataPacket {
  id: number;
  label: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: number;
  date: string;
}

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface CountRow extends RowDataPacket {
  total: number;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly db: DatabaseService) {}

  private async ownedCategory(userId: number, categoryId: number): Promise<CategoryRow> {
    const rows = await this.db.query<CategoryRow[]>(
      'SELECT id, name, type FROM categories WHERE id = ? AND user_id = ? LIMIT 1',
      [categoryId, userId],
    );
    const category = rows[0];
    if (!category) throw new BadRequestException('La catégorie indiquée n’existe pas.');
    return category;
  }

  private async findOwned(userId: number, id: number): Promise<TransactionRow> {
    const rows = await this.db.query<TransactionRow[]>(
      `SELECT id, label, amount, type, category_id AS categoryId, date
       FROM transactions WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId],
    );
    const transaction = rows[0];
    if (!transaction) throw new NotFoundException('Transaction introuvable.');
    return transaction;
  }

  async list(userId: number, query: QueryTransactionsDto) {
    const where: string[] = ['t.user_id = ?'];
    const params: unknown[] = [userId];

    if (query.type) {
      where.push('t.type = ?');
      params.push(query.type);
    }
    if (query.categoryId) {
      where.push('t.category_id = ?');
      params.push(query.categoryId);
    }

    let { from, to } = query;
    if (query.month) {
      const bounds = monthBounds(query.month);
      from = bounds.from;
      to = bounds.to;
    }
    if (from) {
      where.push('t.date >= ?');
      params.push(assertDate(from));
    }
    if (to) {
      where.push('t.date <= ?');
      params.push(assertDate(to));
    }
    if (query.search) {
      where.push('t.label LIKE ?');
      params.push(`%${query.search.trim()}%`);
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const offset = (page - 1) * limit;
    const clause = where.join(' AND ');

    const rows = await this.db.query<TransactionRow[]>(
      `SELECT t.id, t.label, t.amount, t.type, t.category_id AS categoryId, t.date
       FROM transactions t
       WHERE ${clause}
       ORDER BY t.date DESC, t.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const countRows = await this.db.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM transactions t WHERE ${clause}`,
      params,
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        label: row.label,
        amount: Number(row.amount),
        type: row.type,
        categoryId: row.categoryId,
        date: row.date,
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async findOne(userId: number, id: number) {
    return this.findOwned(userId, id);
  }

  async create(userId: number, dto: CreateTransactionDto) {
    const category = await this.ownedCategory(userId, dto.categoryId);
    if (category.type !== dto.type) {
      throw new BadRequestException('La catégorie ne correspond pas au type de la transaction.');
    }
    assertDate(dto.date);

    const result = await this.db.execute(
      `INSERT INTO transactions (user_id, category_id, label, amount, type, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, category.id, dto.label.trim(), dto.amount, dto.type, dto.date],
    );

    return {
      id: result.insertId,
      label: dto.label.trim(),
      amount: dto.amount,
      type: dto.type,
      categoryId: category.id,
      date: dto.date,
    };
  }

  async update(userId: number, id: number, dto: UpdateTransactionDto) {
    const existing = await this.findOwned(userId, id);
    const categoryId = dto.categoryId ?? existing.categoryId;
    const category = await this.ownedCategory(userId, categoryId);
    const type = dto.type ?? existing.type;

    if (category.type !== type) {
      throw new BadRequestException('La catégorie ne correspond pas au type de la transaction.');
    }
    if (dto.date) assertDate(dto.date);

    const label = dto.label?.trim() ?? existing.label;
    const amount = dto.amount ?? Number(existing.amount);
    const date = dto.date ?? existing.date;

    await this.db.execute(
      `UPDATE transactions
       SET label = ?, amount = ?, type = ?, category_id = ?, date = ?
       WHERE id = ? AND user_id = ?`,
      [label, amount, type, category.id, date, id, userId],
    );

    return { id, label, amount, type, categoryId: category.id, date };
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.findOwned(userId, id);
    await this.db.execute('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
  }
}
