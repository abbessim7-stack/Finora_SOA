import { BadRequestException } from '@nestjs/common';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function assertMonth(month: string): string {
  if (!MONTH_PATTERN.test(month ?? '')) {
    throw new BadRequestException('Le mois doit être au format AAAA-MM.');
  }
  return month;
}

export function assertDate(date: string): string {
  if (!DATE_PATTERN.test(date ?? '')) {
    throw new BadRequestException('La date doit être au format AAAA-MM-JJ.');
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new BadRequestException('La date est invalide.');
  }
  return date;
}

export function monthBounds(month: string): { from: string; to: string } {
  assertMonth(month);
  const [year, index] = month.split('-').map(Number) as [number, number];
  const lastDay = new Date(year, index, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` };
}

export function addMonths(month: string, delta: number): string {
  assertMonth(month);
  const [year, index] = month.split('-').map(Number) as [number, number];
  const date = new Date(year, index - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
