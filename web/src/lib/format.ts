const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export function parseMonth(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

export function currentMonth(): string {
  return monthKey(new Date());
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonths(key: string, delta: number): string {
  const { year, month } = parseMonth(key);
  return monthKey(new Date(year, month - 1 + delta, 1));
}

export function monthLabel(key: string): string {
  const { year, month } = parseMonth(key);
  const name = MONTHS[month - 1] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

const SHORT_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function shortMonth(key: string): string {
  const { month } = parseMonth(key);
  return SHORT_MONTHS[month - 1] ?? '';
}

export function monthDays(key: string): number {
  const { year, month } = parseMonth(key);
  return new Date(year, month, 0).getDate();
}

export function monthRange(key: string): { from: string; to: string } {
  return { from: `${key}-01`, to: `${key}-${String(monthDays(key)).padStart(2, '0')}` };
}

export function todayISO(): string {
  const now = new Date();
  return `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const CURRENCY = 'DT';

export function formatMoney(value: number, options: { signed?: boolean; compact?: boolean } = {}): string {
  const { signed = false, compact = false } = options;
  const abs = Math.abs(value);
  const digits = Number.isInteger(abs) ? 0 : 2;
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: compact ? 0 : digits,
    maximumFractionDigits: compact ? 0 : digits,
  }).format(abs);
  const money = `${formatted}\u00a0${CURRENCY}`;
  if (value < 0) return `−${money}`;
  return signed && value > 0 ? `+${money}` : money;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}

export function formatFullDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function percentage(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} %`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
