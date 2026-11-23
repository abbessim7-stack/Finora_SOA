import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { assertMonth, monthBounds } from '../common/month';
import { DatabaseService } from '../database/database.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

interface BudgetRow extends RowDataPacket {
  id: number;
  categoryId: number;
  month: string;
  limit: number;
  categoryName: string;
  categoryType: 'income' | 'expense';
  spent: number;
}

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface BudgetIdRow extends RowDataPacket {
  id: number;
  category_id: number;
  month: string;
  limit_amount: number;
}

@Injectable()
export class BudgetsService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: number, month: string) {
    const key = assertMonth(month);
    const rows = await this.db.query<BudgetRow[]>(
      `SELECT b.id,
              b.category_id       AS categoryId,
              DATE_FORMAT(b.month, '%Y-%m') AS month,
              b.limit_amount      AS \`limit\`,
              c.name              AS categoryName,
              c.type              AS categoryType,
              COALESCE((
                SELECT SUM(t.amount) FROM transactions t
                WHERE t.category_id = b.category_id
                  AND t.user_id = b.user_id
                  AND t.type = 'expense'
                  AND t.date >= b.month
                  AND t.date < DATE_ADD(b.month, INTERVAL 1 MONTH)
              ), 0)               AS spent
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.user_id = ? AND DATE_FORMAT(b.month, '%Y-%m') = ?
       ORDER BY b.id ASC`,
      [userId, key],
    );

    return rows
      .map((row) => {
        const limit = Number(row.limit);
        const spent = Number(row.spent);
        return {
          id: row.id,
          categoryId: row.categoryId,
          month: row.month,
          limit,
          category: { id: row.categoryId, name: row.categoryName, type: row.categoryType },
          spent,
          remaining: Math.round((limit - spent) * 100) / 100,
          ratio: limit > 0 ? spent / limit : 0,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }

  private async ownedCategory(userId: number, categoryId: number): Promise<CategoryRow> {
    const rows = await this.db.query<CategoryRow[]>(
      'SELECT id, name, type FROM categories WHERE id = ? AND user_id = ? LIMIT 1',
      [categoryId, userId],
    );
    const category = rows[0];
    if (!category) throw new BadRequestException('La catégorie indiquée n’existe pas.');
    return category;
  }

  async create(userId: number, dto: CreateBudgetDto) {
    const category = await this.ownedCategory(userId, dto.categoryId);
    if (category.type !== 'expense') {
      throw new BadRequestException('Un budget ne peut cibler qu’une catégorie de dépense.');
    }
    const month = assertMonth(dto.month);
    const { from } = monthBounds(month);

    const existing = await this.db.query<BudgetIdRow[]>(
      'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? LIMIT 1',
      [userId, category.id, from],
    );
    if (existing.length > 0) {
      throw new ConflictException('Un budget existe déjà pour cette catégorie et ce mois.');
    }

    const result = await this.db.execute(
      'INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES (?, ?, ?, ?)',
      [userId, category.id, from, dto.limit],
    );

    return { id: result.insertId, categoryId: category.id, month, limit: dto.limit };
  }

  private async ownedBudget(userId: number, id: number): Promise<BudgetIdRow> {
    const rows = await this.db.query<BudgetIdRow[]>(
      `SELECT id, category_id, DATE_FORMAT(month, '%Y-%m') AS month, limit_amount
       FROM budgets WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId],
    );
    const budget = rows[0];
    if (!budget) throw new NotFoundException('Budget introuvable.');
    return budget;
  }

  async update(userId: number, id: number, dto: UpdateBudgetDto) {
    const budget = await this.ownedBudget(userId, id);
    if (dto.limit === undefined) {
      throw new BadRequestException('Indiquez le nouveau plafond.');
    }

    await this.db.execute('UPDATE budgets SET limit_amount = ? WHERE id = ? AND user_id = ?', [
      dto.limit,
      id,
      userId,
    ]);

    return {
      id,
      categoryId: budget.category_id,
      month: budget.month,
      limit: dto.limit,
    };
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.ownedBudget(userId, id);
    await this.db.execute('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
  }
}
