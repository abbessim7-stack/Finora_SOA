import type {
  Api,
  AuthResponse,
  Budget,
  BudgetInput,
  BudgetView,
  Category,
  CategoryInput,
  MonthlySummary,
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionPage,
  TrendPoint,
  User,
} from './types';
import { monthRange } from './format';
import { ApiError } from './errors';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'finora.token';

export interface AdminOverview {
  users: {
    total: number;
    active: number;
    admins: number;
    newLast30Days: number;
  };
  usage: Array<{ day: string; loggedInUsers: number; activeSeconds: number }>;
  services: {
    api: 'operational';
    database: 'operational' | 'degraded';
    uptimeSeconds: number;
  };
  updatedAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserPage {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUserUpdate {
  role?: 'user' | 'admin';
  isActive?: boolean;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Service indisponible. Vérifiez que l’API est démarrée (npm run start:dev).');
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && String(payload.message)) ||
      'Une erreur est survenue.';
    throw new ApiError(response.status, message, (payload as { fieldErrors?: Record<string, string> })?.fieldErrors);
  }
  return payload as T;
}

export const adminApi = {
  overview() {
    return request<AdminOverview>('/admin/overview');
  },
  listUsers(search: string, page: number, limit: number) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return request<AdminUserPage>(`/admin/users?${params.toString()}`);
  },
  updateUser(id: number, update: AdminUserUpdate) {
    return request<AdminUser>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  },
};

export const activityApi = {
  heartbeat(keepalive = false) {
    return request<void>('/auth/activity', { method: 'POST', keepalive });
  },
};

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : '';
}

export const httpApi: Api = {
  async register(input) {
    const result = await request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
    localStorage.setItem(TOKEN_KEY, result.token);
    return result;
  },

  async login(input) {
    const result = await request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
    localStorage.setItem(TOKEN_KEY, result.token);
    return result;
  },

  async logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  me() {
    return request<User>('/auth/me');
  },

  updateAccount(input) {
    return request<User>('/auth/me', { method: 'PUT', body: JSON.stringify(input) });
  },

  async deleteAccount() {
    await request<void>('/auth/me', { method: 'DELETE' });
    localStorage.removeItem(TOKEN_KEY);
  },

  listCategories() {
    return request<Category[]>('/categories');
  },

  createCategory(input: CategoryInput) {
    return request<Category>('/categories', { method: 'POST', body: JSON.stringify(input) });
  },

  updateCategory(id, input) {
    return request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(input) });
  },

  async deleteCategory(id) {
    await request<void>(`/categories/${id}`, { method: 'DELETE' });
  },

  listTransactions(filters: TransactionFilters = {}) {
    const range = filters.month ? monthRange(filters.month) : null;
    return request<TransactionPage>(
      `/transactions${query({
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        categoryId: filters.categoryId && filters.categoryId !== 'all' ? filters.categoryId : undefined,
        from: range?.from,
        to: range?.to,
        search: filters.search,
        page: filters.page,
        limit: filters.limit,
      })}`,
    );
  },

  createTransaction(input: TransactionInput) {
    return request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(input) });
  },

  updateTransaction(id, input) {
    return request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(input) });
  },

  async deleteTransaction(id) {
    await request<void>(`/transactions/${id}`, { method: 'DELETE' });
  },

  listBudgets(month) {
    return request<BudgetView[]>(`/budgets${query({ month })}`);
  },

  createBudget(input: BudgetInput) {
    return request<Budget>('/budgets', { method: 'POST', body: JSON.stringify(input) });
  },

  updateBudget(id, input) {
    return request<Budget>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(input) });
  },

  async deleteBudget(id) {
    await request<void>(`/budgets/${id}`, { method: 'DELETE' });
  },

  getSummary(month) {
    return request<MonthlySummary>(`/reports/summary${query({ month })}`);
  },

  getTrend(months, to) {
    return request<TrendPoint[]>(`/reports/trend${query({ months, to })}`);
  },
};
