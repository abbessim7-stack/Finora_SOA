export type Id = string | number;

export type TxType = 'income' | 'expense';

export interface User {
  id: Id;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Category {
  id: Id;
  name: string;
  type: TxType;
}

export interface Transaction {
  id: Id;
  label: string;
  amount: number;
  type: TxType;
  categoryId: Id;
  date: string;
}

export interface Budget {
  id: Id;
  categoryId: Id;
  month: string;
  limit: number;
}

export interface BudgetView extends Budget {
  category: Category;
  spent: number;
  remaining: number;
  ratio: number;
}

export interface CategorySlice {
  categoryId: Id;
  name: string;
  total: number;
  share: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
  byCategory: CategorySlice[];
}

export interface TrendPoint {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionFilters {
  type?: TxType | 'all';
  categoryId?: Id | 'all';
  month?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CategoryInput {
  name: string;
  type: TxType;
}

export interface TransactionInput {
  label: string;
  amount: number;
  type: TxType;
  categoryId: Id;
  date: string;
}

export interface BudgetInput {
  categoryId: Id;
  month: string;
  limit: number;
}

export interface Api {
  register(input: { name: string; email: string; password: string }): Promise<AuthResponse>;
  login(input: { email: string; password: string }): Promise<AuthResponse>;
  logout(): Promise<void>;
  me(): Promise<User>;
  updateAccount(input: { name: string; email: string }): Promise<User>;
  deleteAccount(): Promise<void>;

  listCategories(): Promise<Category[]>;
  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: Id, input: Partial<CategoryInput>): Promise<Category>;
  deleteCategory(id: Id): Promise<void>;

  listTransactions(filters?: TransactionFilters): Promise<TransactionPage>;
  createTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: Id, input: Partial<TransactionInput>): Promise<Transaction>;
  deleteTransaction(id: Id): Promise<void>;

  listBudgets(month: string): Promise<BudgetView[]>;
  createBudget(input: BudgetInput): Promise<Budget>;
  updateBudget(id: Id, input: { limit: number }): Promise<Budget>;
  deleteBudget(id: Id): Promise<void>;

  getSummary(month: string): Promise<MonthlySummary>;
  getTrend(months: number, to: string): Promise<TrendPoint[]>;
}
