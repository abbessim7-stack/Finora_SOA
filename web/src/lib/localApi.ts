import type {
  Api,
  AuthResponse,
  Budget,
  BudgetInput,
  BudgetView,
  Category,
  CategoryInput,
  CategorySlice,
  Id,
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionPage,
  TrendPoint,
  TxType,
  User,
} from './types';
import { addMonths, currentMonth, monthRange, parseMonth, round2, todayISO } from './format';
import { ApiError } from './errors';

/**
 * Client de démonstration : mêmes règles métier que l'API NestJS, mais les
 * données vivent dans le navigateur (localStorage). Il permet de faire tourner
 * l'interface sans MySQL ; `VITE_API_MODE=http` bascule sur le vrai service.
 */

const DB_KEY = 'finora.db.v1';
const SESSION_KEY = 'finora.session.v1';

interface StoredUser extends Omit<User, 'id'> {
  id: string;
  passwordHash: string;
}

interface StoredCategory extends Omit<Category, 'id'> {
  id: string;
  userId: string;
}

interface StoredTransaction extends Omit<Transaction, 'id' | 'categoryId'> {
  id: string;
  categoryId: string;
  userId: string;
}

interface StoredBudget extends Omit<Budget, 'id' | 'categoryId'> {
  id: string;
  categoryId: string;
  userId: string;
}

interface Db {
  users: StoredUser[];
  categories: StoredCategory[];
  transactions: StoredTransaction[];
  budgets: StoredBudget[];
}

const CATEGORY_ICON_NAMES = [
  'Alimentation',
  'Transport',
  'Logement',
  'Loisirs',
  'Santé',
  'Abonnements',
  'Éducation',
  'Divers',
];

const INCOME_NAMES = ['Salaire', 'Freelance', 'Cadeaux', 'Remboursements'];

const uid = (prefix: string): string =>
  `${prefix}-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;

/** Empreinte locale (démo uniquement — le service NestJS utilise bcrypt). */
function hashPassword(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function publicUser(user: StoredUser): User {
  return { id: user.id, name: user.name, email: user.email, role: user.role ?? 'user' };
}

function readDb(): Db {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Db;
    } catch {
      localStorage.removeItem(DB_KEY);
    }
  }
  const db = createDemoDb();
  writeDb(db);
  return db;
}

function writeDb(db: Db): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

let seed = 20261024;
function random(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

function createDemoDb(): Db {
  const userId = 'u-demo';
  const db: Db = { users: [], categories: [], transactions: [], budgets: [] };

  db.users.push({
    id: userId,
    name: 'Camille Rousseau',
    email: 'demo@finora.app',
    role: 'user',
    passwordHash: hashPassword('demo1234'),
  });

  const addCategory = (name: string, type: TxType): StoredCategory => {
    const category: StoredCategory = { id: uid('c'), name, type, userId };
    db.categories.push(category);
    return category;
  };

  const expense = Object.fromEntries(CATEGORY_ICON_NAMES.map((name) => [name, addCategory(name, 'expense')]));
  const income = Object.fromEntries(INCOME_NAMES.map((name) => [name, addCategory(name, 'income')]));

  let index = 0;
  const addTx = (label: string, amount: number, type: TxType, categoryId: string, date: string) => {
    if (date > todayISO()) return;
    index += 1;
    db.transactions.push({
      id: `t-${index}`,
      label,
      amount: round2(amount),
      type,
      categoryId,
      date,
      userId,
    });
  };

  const month = currentMonth();
  const day = (value: number) => `${month}-${String(value).padStart(2, '0')}`;

  // Le mois en cours est écrit à la main pour que la démonstration soit lisible.
  addTx('Salaire — Studio Orion', 3250, 'income', income.Salaire.id, day(1));
  addTx('Loyer appartement', 890, 'expense', expense.Logement.id, day(1));
  addTx('Courses Monoprix', 68.4, 'expense', expense.Alimentation.id, day(2));
  addTx('Pass Navigo', 86.4, 'expense', expense.Transport.id, day(3));
  addTx('Concert — Philharmonie', 96, 'expense', expense.Loisirs.id, day(3));
  addTx('Boulangerie du coin', 12.8, 'expense', expense.Alimentation.id, day(4));
  addTx('Netflix', 13.49, 'expense', expense.Abonnements.id, day(5));
  addTx('Pharmacie de la gare', 24.9, 'expense', expense.Santé.id, day(6));
  addTx('Marché du dimanche', 46.2, 'expense', expense.Alimentation.id, day(7));
  addTx('Freelance — refonte site', 620, 'income', income.Freelance.id, day(7));
  addTx('Cinéma MK2', 28, 'expense', expense.Loisirs.id, day(8));

  const plans: Array<[StoredCategory, number, number, number, string[]]> = [
    [expense.Alimentation, 7, 9, 74, ['Courses Monoprix', 'Marché du dimanche', 'Boulangerie', 'Fromagerie', 'Supermarché Lidl', 'Restaurant Bao', 'Épicerie bio']],
    [expense.Transport, 3, 11, 88, ['Pass Navigo', 'Essence', 'Vélib’', 'Train Paris–Lyon', 'Taxi de nuit']],
    [expense.Loisirs, 3, 16, 92, ['Cinéma MK2', 'Concert', 'Librairie Eyrolles', 'Musée d’Orsay', 'Sortie vélo']],
    [expense.Santé, 1, 12, 65, ['Pharmacie', 'Consultation dentiste', 'Ostéopathe']],
    [expense.Abonnements, 3, 6, 19, ['Spotify', 'iCloud 200 Go', 'Salle de sport', 'Presse quotidienne']],
    [expense.Éducation, 1, 15, 60, ['Cours d’anglais', 'Livre de design', 'Atelier céramique']],
  ];

  for (let offset = 5; offset >= 1; offset -= 1) {
    const key = addMonths(month, -offset);
    const { year, month: monthNumber } = parseMonth(key);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    const on = (value: number) => `${key}-${String(Math.min(value, lastDay)).padStart(2, '0')}`;

    addTx('Salaire — Studio Orion', 3250, 'income', income.Salaire.id, on(2));
    if (offset % 2 === 0) {
      addTx('Freelance — mission data', 480 + Math.round(random() * 320), 'income', income.Freelance.id, on(16));
    }
    addTx('Loyer appartement', 890, 'expense', expense.Logement.id, on(1));
    addTx('Électricité EDF', 58 + Math.round(random() * 22), 'expense', expense.Logement.id, on(6));

    for (const [category, count, min, max, labels] of plans) {
      for (let i = 0; i < count; i += 1) {
        addTx(pick(labels), min + random() * (max - min), 'expense', category.id, on(2 + Math.floor(random() * (lastDay - 2))));
      }
    }
  }

  const budgetPlan: Array<[StoredCategory, number]> = [
    [expense.Alimentation, 400],
    [expense.Transport, 120],
    [expense.Loisirs, 110],
    [expense.Abonnements, 40],
    [expense.Santé, 60],
  ];

  for (let offset = 2; offset >= 0; offset -= 1) {
    const key = addMonths(month, -offset);
    for (const [category, limit] of budgetPlan) {
      db.budgets.push({ id: uid('b'), categoryId: category.id, month: key, limit, userId });
    }
  }

  return db;
}

function requireUserId(db: Db): string {
  const userId = localStorage.getItem(SESSION_KEY);
  const user = db.users.find((candidate) => candidate.id === userId);
  if (!user) throw new ApiError(401, 'Session expirée, veuillez vous reconnecter.');
  return user.id;
}

function startSession(user: StoredUser): AuthResponse {
  localStorage.setItem(SESSION_KEY, user.id);
  return { token: `demo.${user.id}.${Date.now()}`, user: publicUser(user) };
}

function validateEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new ApiError(400, 'Adresse email invalide.');
  }
}

function categoryOf(db: Db, userId: string, categoryId: Id): StoredCategory {
  const category = db.categories.find((item) => item.id === categoryId && item.userId === userId);
  if (!category) throw new ApiError(404, 'Catégorie introuvable.');
  return category;
}

function normalizeMonth(month: string | undefined): string {
  if (!month) return currentMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) throw new ApiError(400, 'Le mois doit être au format AAAA-MM.');
  return month;
}

function spentFor(db: Db, userId: string, categoryId: Id, month: string): number {
  const { from, to } = monthRange(month);
  return round2(
    db.transactions
      .filter(
        (tx) =>
          tx.userId === userId &&
          tx.categoryId === categoryId &&
          tx.type === 'expense' &&
          tx.date >= from &&
          tx.date <= to,
      )
      .reduce((total, tx) => total + tx.amount, 0),
  );
}

export const localApi: Api = {
  async register({ name, email, password }) {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedName.length < 2) throw new ApiError(400, 'Le nom doit contenir au moins 2 caractères.');
    validateEmail(trimmedEmail);
    if (password.length < 8) throw new ApiError(400, 'Le mot de passe doit contenir au moins 8 caractères.');

    const db = readDb();
    if (db.users.some((user) => user.email === trimmedEmail)) {
      throw new ApiError(409, 'Un compte existe déjà avec cette adresse email.');
    }

    const user: StoredUser = {
      id: uid('u'),
      name: trimmedName,
      email: trimmedEmail,
      role: 'user',
      passwordHash: hashPassword(password),
    };
    db.users.push(user);
    for (const categoryName of CATEGORY_ICON_NAMES) {
      db.categories.push({ id: uid('c'), name: categoryName, type: 'expense', userId: user.id });
    }
    for (const categoryName of INCOME_NAMES) {
      db.categories.push({ id: uid('c'), name: categoryName, type: 'income', userId: user.id });
    }
    writeDb(db);
    return startSession(user);
  },

  async login({ email, password }) {
    const db = readDb();
    const user = db.users.find((candidate) => candidate.email === email.trim().toLowerCase());
    if (!user || user.passwordHash !== hashPassword(password)) {
      throw new ApiError(401, 'Email ou mot de passe incorrect.');
    }
    return startSession(user);
  },

  async logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  async me() {
    const db = readDb();
    return publicUser(db.users.find((user) => user.id === requireUserId(db))!);
  },

  async updateAccount(input) {
    const db = readDb();
    const userId = requireUserId(db);
    const user = db.users.find((candidate) => candidate.id === userId);
    if (!user) throw new ApiError(404, 'Compte introuvable.');

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (name.length < 2 || name.length > 80) {
      throw new ApiError(400, 'Le nom doit contenir entre 2 et 80 caractères.');
    }
    validateEmail(email);
    if (db.users.some((candidate) => candidate.id !== userId && candidate.email === email)) {
      throw new ApiError(409, 'Un compte existe déjà avec cette adresse email.');
    }

    user.name = name;
    user.email = email;
    writeDb(db);
    return publicUser(user);
  },

  async deleteAccount() {
    const db = readDb();
    const userId = requireUserId(db);
    db.transactions = db.transactions.filter((tx) => tx.userId !== userId);
    db.budgets = db.budgets.filter((budget) => budget.userId !== userId);
    db.categories = db.categories.filter((category) => category.userId !== userId);
    db.users = db.users.filter((user) => user.id !== userId);
    writeDb(db);
    localStorage.removeItem(SESSION_KEY);
  },

  async listCategories() {
    const db = readDb();
    const userId = requireUserId(db);
    return db.categories
      .filter((category) => category.userId === userId)
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'fr'))
      .map(({ id, name, type }) => ({ id, name, type }));
  },

  async createCategory(input: CategoryInput) {
    const db = readDb();
    const userId = requireUserId(db);
    const name = input.name.trim();
    if (name.length < 2) throw new ApiError(400, 'Le nom de la catégorie est trop court.');
    if (input.type !== 'income' && input.type !== 'expense') throw new ApiError(400, 'Type de catégorie invalide.');
    const duplicate = db.categories.some(
      (category) =>
        category.userId === userId &&
        category.type === input.type &&
        category.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) throw new ApiError(409, `La catégorie « ${name} » existe déjà pour ce type.`);

    const category: StoredCategory = { id: uid('c'), name, type: input.type, userId };
    db.categories.push(category);
    writeDb(db);
    return { id: category.id, name: category.name, type: category.type };
  },

  async updateCategory(id, input) {
    const db = readDb();
    const userId = requireUserId(db);
    const category = categoryOf(db, userId, id);
    const name = input.name?.trim() ?? category.name;
    const type = input.type ?? category.type;
    if (name.length < 2) throw new ApiError(400, 'Le nom de la catégorie est trop court.');

    const used = db.transactions.some((tx) => tx.categoryId === id);
    if (type !== category.type && used) {
      throw new ApiError(409, 'Impossible de changer le type d’une catégorie déjà utilisée.');
    }
    const duplicate = db.categories.some(
      (other) =>
        other.id !== id &&
        other.userId === userId &&
        other.type === type &&
        other.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) throw new ApiError(409, `La catégorie « ${name} » existe déjà pour ce type.`);

    category.name = name;
    category.type = type;
    writeDb(db);
    return { id: category.id, name: category.name, type: category.type };
  },

  async deleteCategory(id) {
    const db = readDb();
    const userId = requireUserId(db);
    const category = categoryOf(db, userId, id);
    const used = db.transactions.filter((tx) => tx.categoryId === id).length;
    if (used > 0) {
      throw new ApiError(
        409,
        `La catégorie « ${category.name} » est utilisée par ${used} transaction${used > 1 ? 's' : ''}.`,
      );
    }
    db.categories = db.categories.filter((item) => item.id !== id);
    db.budgets = db.budgets.filter((budget) => budget.categoryId !== id);
    writeDb(db);
  },

  async listTransactions(filters: TransactionFilters = {}) {
    const db = readDb();
    const userId = requireUserId(db);
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 10));
    const search = filters.search?.trim().toLowerCase() ?? '';
    const range = filters.month ? monthRange(filters.month) : null;

    const rows = db.transactions
      .filter((tx) => tx.userId === userId)
      .filter((tx) => (filters.type && filters.type !== 'all' ? tx.type === filters.type : true))
      .filter((tx) => (filters.categoryId && filters.categoryId !== 'all' ? tx.categoryId === filters.categoryId : true))
      .filter((tx) => (range ? tx.date >= range.from && tx.date <= range.to : true))
      .filter((tx) => (search ? tx.label.toLowerCase().includes(search) : true))
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return String(b.id).localeCompare(String(a.id));
      });

    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit).map(({ id, label, amount, type, categoryId, date }) => ({
      id,
      label,
      amount,
      type,
      categoryId,
      date,
    }));
    return { items, total: rows.length, page, limit } satisfies TransactionPage;
  },

  async createTransaction(input: TransactionInput) {
    const db = readDb();
    const userId = requireUserId(db);
    const label = input.label.trim();
    if (!label) throw new ApiError(400, 'Le libellé est obligatoire.');
    const amount = round2(Number(input.amount));
    if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, 'Le montant doit être strictement positif.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new ApiError(400, 'La date est invalide.');
    const category = categoryOf(db, userId, input.categoryId);
    if (category.type !== input.type) {
      throw new ApiError(400, 'La catégorie ne correspond pas au type de la transaction.');
    }

    const transaction: StoredTransaction = {
      id: uid('t'),
      label,
      amount,
      type: category.type,
      categoryId: category.id,
      date: input.date,
      userId,
    };
    db.transactions.push(transaction);
    writeDb(db);
    const { id, type, categoryId } = transaction;
    return { id, label, amount, type, categoryId, date: input.date };
  },

  async updateTransaction(id, input) {
    const db = readDb();
    const userId = requireUserId(db);
    const transaction = db.transactions.find((tx) => tx.id === id && tx.userId === userId);
    if (!transaction) throw new ApiError(404, 'Transaction introuvable.');

    const label = input.label?.trim() ?? transaction.label;
    if (!label) throw new ApiError(400, 'Le libellé est obligatoire.');
    const amount = input.amount !== undefined ? round2(Number(input.amount)) : transaction.amount;
    if (!Number.isFinite(amount) || amount <= 0) throw new ApiError(400, 'Le montant doit être strictement positif.');
    const date = input.date ?? transaction.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'La date est invalide.');
    const category = categoryOf(db, userId, input.categoryId ?? transaction.categoryId);
    const type = input.type ?? category.type;
    if (category.type !== type) {
      throw new ApiError(400, 'La catégorie ne correspond pas au type de la transaction.');
    }

    transaction.label = label;
    transaction.amount = amount;
    transaction.date = date;
    transaction.categoryId = category.id;
    transaction.type = type;
    writeDb(db);
    const { id: txId, categoryId, type: txType } = transaction;
    return { id: txId, label, amount, type: txType, categoryId, date };
  },

  async deleteTransaction(id) {
    const db = readDb();
    const userId = requireUserId(db);
    const exists = db.transactions.some((tx) => tx.id === id && tx.userId === userId);
    if (!exists) throw new ApiError(404, 'Transaction introuvable.');
    db.transactions = db.transactions.filter((tx) => tx.id !== id);
    writeDb(db);
  },

  async listBudgets(month) {
    const db = readDb();
    const userId = requireUserId(db);
    const key = normalizeMonth(month);
    return db.budgets
      .filter((budget) => budget.userId === userId && budget.month === key)
      .map((budget) => {
        const category = categoryOf(db, userId, budget.categoryId);
        const spent = spentFor(db, userId, budget.categoryId, key);
        return {
          id: budget.id,
          categoryId: budget.categoryId,
          month: budget.month,
          limit: budget.limit,
          category: { id: category.id, name: category.name, type: category.type },
          spent,
          remaining: round2(budget.limit - spent),
          ratio: budget.limit > 0 ? spent / budget.limit : 0,
        } satisfies BudgetView;
      })
      .sort((a, b) => b.ratio - a.ratio);
  },

  async createBudget(input: BudgetInput) {
    const db = readDb();
    const userId = requireUserId(db);
    const category = categoryOf(db, userId, input.categoryId);
    if (category.type !== 'expense') {
      throw new ApiError(400, 'Un budget ne peut cibler qu’une catégorie de dépense.');
    }
    const month = normalizeMonth(input.month);
    const limit = round2(Number(input.limit));
    if (!Number.isFinite(limit) || limit <= 0) throw new ApiError(400, 'Le plafond doit être strictement positif.');
    const duplicate = db.budgets.some(
      (budget) => budget.userId === userId && budget.categoryId === category.id && budget.month === month,
    );
    if (duplicate) throw new ApiError(409, 'Un budget existe déjà pour cette catégorie et ce mois.');

    const budget: StoredBudget = { id: uid('b'), categoryId: category.id, month, limit, userId };
    db.budgets.push(budget);
    writeDb(db);
    return { id: budget.id, categoryId: budget.categoryId, month: budget.month, limit: budget.limit };
  },

  async updateBudget(id, input) {
    const db = readDb();
    const userId = requireUserId(db);
    const budget = db.budgets.find((item) => item.id === id && item.userId === userId);
    if (!budget) throw new ApiError(404, 'Budget introuvable.');
    const limit = round2(Number(input.limit));
    if (!Number.isFinite(limit) || limit <= 0) throw new ApiError(400, 'Le plafond doit être strictement positif.');
    budget.limit = limit;
    writeDb(db);
    return { id: budget.id, categoryId: budget.categoryId, month: budget.month, limit: budget.limit };
  },

  async deleteBudget(id) {
    const db = readDb();
    const userId = requireUserId(db);
    const exists = db.budgets.some((budget) => budget.id === id && budget.userId === userId);
    if (!exists) throw new ApiError(404, 'Budget introuvable.');
    db.budgets = db.budgets.filter((budget) => budget.id !== id);
    writeDb(db);
  },

  async getSummary(month) {
    const db = readDb();
    const userId = requireUserId(db);
    const key = normalizeMonth(month);
    const { from, to } = monthRange(key);
    const rows = db.transactions.filter(
      (tx) => tx.userId === userId && tx.type === 'expense' && tx.date >= from && tx.date <= to,
    );
    const income = db.transactions
      .filter((tx) => tx.userId === userId && tx.type === 'income' && tx.date >= from && tx.date <= to)
      .reduce((total, tx) => total + tx.amount, 0);
    const byCategoryMap = new Map<string, CategorySlice>();

    for (const tx of rows) {
      if (!byCategoryMap.has(tx.categoryId)) {
        const category = db.categories.find((item) => item.id === tx.categoryId);
        byCategoryMap.set(tx.categoryId, {
          categoryId: tx.categoryId,
          name: category?.name ?? 'Sans catégorie',
          total: 0,
          share: 0,
        });
      }
      const slice = byCategoryMap.get(tx.categoryId)!;
      slice.total = round2(slice.total + tx.amount);
    }

    const expense = round2(rows.reduce((total, tx) => total + tx.amount, 0));
    const byCategory = [...byCategoryMap.values()]
      .map((slice) => ({ ...slice, share: expense > 0 ? slice.total / expense : 0 }))
      .sort((a, b) => b.total - a.total);

    return { month: key, income: round2(income), expense, balance: round2(income - expense), byCategory };
  },

  async getTrend(months, to) {
    const db = readDb();
    const userId = requireUserId(db);
    const end = normalizeMonth(to);
    const points: TrendPoint[] = [];
    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const key = addMonths(end, -offset);
      const { from, to: last } = monthRange(key);
      const rows = db.transactions.filter(
        (tx) => tx.userId === userId && tx.date >= from && tx.date <= last,
      );
      const income = round2(rows.filter((tx) => tx.type === 'income').reduce((total, tx) => total + tx.amount, 0));
      const expense = round2(rows.filter((tx) => tx.type === 'expense').reduce((total, tx) => total + tx.amount, 0));
      points.push({ month: key, income, expense, balance: round2(income - expense) });
    }
    return points;
  },
};
