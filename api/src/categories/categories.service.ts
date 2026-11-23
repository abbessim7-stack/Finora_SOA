import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

interface CategoryRow extends RowDataPacket {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

interface CountRow extends RowDataPacket {
  total: number;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(userId: number) {
    const rows = await this.db.query<CategoryRow[]>(
      'SELECT id, name, type FROM categories WHERE user_id = ? ORDER BY type ASC, name ASC',
      [userId],
    );
    return rows.map((row) => ({ id: row.id, name: row.name, type: row.type }));
  }

  private async findOwned(userId: number, id: number): Promise<CategoryRow> {
    const rows = await this.db.query<CategoryRow[]>(
      'SELECT id, name, type FROM categories WHERE id = ? AND user_id = ? LIMIT 1',
      [id, userId],
    );
    const category = rows[0];
    if (!category) throw new NotFoundException('Catégorie introuvable.');
    return category;
  }

  private async assertUnique(userId: number, name: string, type: string, exceptId?: number) {
    const rows = await this.db.query<CategoryRow[]>(
      'SELECT id FROM categories WHERE user_id = ? AND type = ? AND LOWER(name) = LOWER(?) AND id <> ? LIMIT 1',
      [userId, type, name, exceptId ?? 0],
    );
    if (rows.length > 0) {
      throw new ConflictException(`La catégorie « ${name} » existe déjà pour ce type.`);
    }
  }

  async create(userId: number, dto: CreateCategoryDto) {
    const name = dto.name.trim();
    await this.assertUnique(userId, name, dto.type);
    const result = await this.db.execute(
      'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
      [userId, name, dto.type],
    );
    return { id: result.insertId, name, type: dto.type };
  }

  async update(userId: number, id: number, dto: UpdateCategoryDto) {
    const category = await this.findOwned(userId, id);
    const name = dto.name?.trim() ?? category.name;
    const type = dto.type ?? category.type;

    if (type !== category.type) {
      const usage = await this.db.query<CountRow[]>(
        'SELECT COUNT(*) AS total FROM transactions WHERE category_id = ? AND user_id = ?',
        [id, userId],
      );
      if ((usage[0]?.total ?? 0) > 0) {
        throw new ConflictException('Impossible de changer le type d’une catégorie déjà utilisée.');
      }
      const budgets = await this.db.query<CountRow[]>(
        'SELECT COUNT(*) AS total FROM budgets WHERE category_id = ? AND user_id = ?',
        [id, userId],
      );
      if ((budgets[0]?.total ?? 0) > 0) {
        throw new ConflictException('Supprimez d’abord les budgets liés à cette catégorie.');
      }
    }

    await this.assertUnique(userId, name, type, id);
    await this.db.execute('UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?', [
      name,
      type,
      id,
      userId,
    ]);

    return { id, name, type };
  }

  async remove(userId: number, id: number): Promise<void> {
    const category = await this.findOwned(userId, id);
    const usage = await this.db.query<CountRow[]>(
      'SELECT COUNT(*) AS total FROM transactions WHERE category_id = ? AND user_id = ?',
      [id, userId],
    );
    const total = usage[0]?.total ?? 0;
    if (total > 0) {
      throw new ConflictException(
        `La catégorie « ${category.name} » est utilisée par ${total} transaction${total > 1 ? 's' : ''}.`,
      );
    }

    await this.db.execute('DELETE FROM budgets WHERE category_id = ? AND user_id = ?', [id, userId]);
    await this.db.execute('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId]);
  }
}
