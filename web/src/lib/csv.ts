import type { Category, Transaction } from './types';
import { formatMoney } from './format';

export function exportTransactionsCsv(transactions: Transaction[], categories: Category[]): void {
  const byId = new Map(categories.map((category) => [category.id, category.name]));
  const header = ['Date', 'Libellé', 'Type', 'Catégorie', 'Montant (TND)'];
  const lines = transactions.map((tx) =>
    [
      tx.date,
      `"${tx.label.replace(/"/g, '""')}"`,
      tx.type === 'income' ? 'Revenu' : 'Dépense',
      `"${(byId.get(tx.categoryId) ?? 'Sans catégorie').replace(/"/g, '""')}"`,
      tx.amount.toFixed(2).replace('.', ','),
    ].join(';'),
  );

  const csv = [header.join(';'), ...lines].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const month = transactions[0]?.date.slice(0, 7) ?? 'finora';
  link.href = url;
  link.download = `finora-transactions-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function csvSummary(transactions: Transaction[]): string {
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  return formatMoney(total);
}
