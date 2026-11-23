import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { formatMoney, monthLabel, percentage } from '../lib/format';
import { useAuth } from '../lib/auth';
import { useMonth } from '../lib/month';
import { useRefresh } from '../lib/refresh';
import type { BudgetView, Category, MonthlySummary, Transaction, TrendPoint } from '../lib/types';
import { Card, EmptyState, ProgressBar, Skeleton } from '../components/ui';
import { DonutChart, Sparkline, TrendChart, ValueBullet } from '../components/Charts';
import { CategoryAvatar } from '../components/CategoryChip';
import { categoryColor } from '../components/Icons';
import { IconAlert, IconArrows, IconTarget, IconTrendUp } from '../components/Icons';

export default function Dashboard() {
  const { user } = useAuth();
  const { month } = useMonth();
  const { key: refreshKey } = useRefresh();

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [budgets, setBudgets] = useState<BudgetView[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailure(null);
    Promise.all([
      api.getSummary(month),
      api.listBudgets(month),
      api.getTrend(6, month),
      api.listTransactions({ month, page: 1, limit: 6 }),
      api.listCategories(),
    ])
      .then(([summaryData, budgetData, trendData, transactions, categoriesData]) => {
        if (!alive) return;
        setSummary(summaryData);
        setBudgets(budgetData);
        setTrend(trendData);
        setRecent(transactions.items);
        setCategories(categoriesData);
      })
      .catch((caught) => {
        if (alive) setFailure(errorMessage(caught));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [month, refreshKey]);

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const firstName = (user?.name ?? '').split(' ')[0] || 'vous';
  const previous = trend.length >= 2 ? trend[trend.length - 2] : null;
  const overspent = budgets.filter((budget) => budget.ratio >= 1);
  const savingsRate = summary && summary.income > 0 ? (summary.balance / summary.income) * 100 : 0;

  if (loading && !summary) {
    return (
      <div className="page-inner">
        <div className="page-head">
          <div>
            <Skeleton height={12} width={120} />
            <div style={{ height: 12 }} />
            <Skeleton height={34} width={280} />
          </div>
        </div>
        <div className="dash-grid">
          <Card className="hero">
            <Skeleton height={12} width={110} />
            <div style={{ height: 18 }} />
            <Skeleton height={54} width={260} />
            <div style={{ height: 26 }} />
            <Skeleton height={60} />
          </Card>
          <Card>
            <Skeleton height={180} radius={16} />
          </Card>
          <Card>
            <Skeleton height={12} width={90} />
            <div style={{ height: 20 }} />
            <Skeleton height={120} radius={16} />
          </Card>
          <Card>
            <Skeleton height={12} width={90} />
            <div style={{ height: 20 }} />
            <Skeleton height={120} radius={16} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-inner">
      <div className="page-head">
        <div>
          <p className="eyebrow">Tableau de bord</p>
          <h1 className="page-title">Bonjour, {firstName}</h1>
          <p className="page-sub">Voici où en est votre budget en {monthLabel(month).toLowerCase()}.</p>
        </div>
      </div>

      {failure ? (
        <div className="alert-banner" role="alert">
          <IconAlert size={18} />
          <span>{failure}</span>
        </div>
      ) : null}

      {overspent.length > 0 ? (
        <div className="alert-banner">
          <IconAlert size={18} />
          <span>
            {overspent.length === 1
              ? `« ${overspent[0]?.category.name} » dépasse son plafond de ${formatMoney(Math.abs(overspent[0]?.remaining ?? 0))}.`
              : `${overspent.length} budgets dépassent leur plafond ce mois-ci.`}
          </span>
          <Link to="/budgets" className="alert-link">
            Ajuster
          </Link>
        </div>
      ) : null}

      <div className="dash-grid stagger">
        <Card className="hero">
          <div className="hero-top">
            <div className="hero-main">
              <span className="stat-label">Solde du mois</span>
              <strong className="hero-balance">{formatMoney(summary?.balance ?? 0)}</strong>
              <span className="hero-meta">
                <ValueBullet value={summary?.balance ?? 0} previous={previous?.balance ?? 0} />
                <span className="muted">vs {monthLabel(trend[trend.length - 2]?.month ?? month).toLowerCase()}</span>
              </span>
            </div>
            <div className="hero-spark">
              <Sparkline values={trend.length ? trend.map((point) => point.balance) : [0, 0]} height={72} />
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-label">
                <i className="dot dot-income" /> Revenus
              </span>
              <strong>{formatMoney(summary?.income ?? 0)}</strong>
            </div>
            <div className="hero-stat">
              <span className="stat-label">
                <i className="dot dot-expense" /> Dépenses
              </span>
              <strong>{formatMoney(summary?.expense ?? 0)}</strong>
            </div>
            <div className="hero-stat">
              <span className="stat-label">
                <i className="dot dot-violet" /> Taux d’épargne
              </span>
              <strong>{percentage(Math.max(0, savingsRate))}</strong>
            </div>
          </div>
        </Card>

        <Card className="card-donut">
          <div className="card-head">
            <div>
              <h2 className="card-title">Répartition des dépenses</h2>
              <p className="card-sub">{monthLabel(month)}</p>
            </div>
          </div>
          {summary && summary.byCategory.length > 0 ? (
            <DonutChart slices={summary.byCategory} total={summary.expense} />
          ) : (
            <EmptyState
              title="Aucune dépense ce mois-ci"
              description="Ajoutez une dépense pour voir la répartition par catégorie."
            />
          )}
        </Card>

        <Card>
          <div className="card-head">
            <div>
              <h2 className="card-title">Budgets</h2>
              <p className="card-sub">Plafonds mensuels</p>
            </div>
            <Link to="/budgets" className="link">
              Gérer
            </Link>
          </div>

          {budgets.length === 0 ? (
            <EmptyState
              icon={<IconTarget size={20} />}
              title="Aucun budget défini"
              description="Fixez un plafond par catégorie pour suivre vos dépenses."
              action={
                <Link to="/budgets" className="btn btn-soft">
                  Créer un budget
                </Link>
              }
            />
          ) : (
            <ul className="budget-list">
              {budgets.slice(0, 4).map((budget) => {
                const over = budget.ratio >= 1;
                return (
                  <li key={budget.id} className="budget-row">
                    <div className="budget-row-head">
                      <span className="budget-name">
                        <i style={{ background: categoryColor(budget.category.name) }} />
                        {budget.category.name}
                      </span>
                      <span className={`budget-amount${over ? ' is-over' : ''}`}>
                        {formatMoney(budget.spent)}
                        <span className="muted"> / {formatMoney(budget.limit)}</span>
                      </span>
                    </div>
                    <ProgressBar ratio={budget.ratio} danger={over} />
                    <div className="budget-row-foot">
                      <span className={over ? 'is-over' : 'muted'}>
                        {over ? 'Plafond dépassé' : `${Math.round(budget.ratio * 100)} % utilisé`}
                      </span>
                      <span className={over ? 'is-over' : 'muted'}>
                        {over
                          ? `${formatMoney(Math.abs(budget.remaining))} en trop`
                          : `${formatMoney(budget.remaining)} restants`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="card-head">
            <div>
              <h2 className="card-title">Dernières transactions</h2>
              <p className="card-sub">Les plus récentes du mois</p>
            </div>
            <Link to="/transactions" className="link">
              Tout voir
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={<IconArrows size={20} />}
              title="Pas encore de mouvement"
              description="Votre première transaction apparaîtra ici."
            />
          ) : (
            <ul className="tx-mini-list">
              {recent.map((transaction) => {
                const category = categoryById.get(transaction.categoryId);
                return (
                  <li key={transaction.id} className="tx-mini">
                    <CategoryAvatar name={category?.name ?? 'Divers'} size={36} />
                    <span className="tx-mini-body">
                      <strong>{transaction.label}</strong>
                      <small>{category?.name ?? 'Sans catégorie'}</small>
                    </span>
                    <span className={`tx-mini-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '−'}
                      {formatMoney(transaction.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="card-trend">
          <div className="card-head">
            <div>
              <h2 className="card-title">Évolution sur 6 mois</h2>
              <p className="card-sub">Revenus, dépenses et solde</p>
            </div>
            <span className="pill">
              <IconTrendUp size={14} />
              6 mois
            </span>
          </div>
          {trend.length > 0 ? <TrendChart points={trend} /> : <Skeleton height={220} />}
        </Card>
      </div>
    </div>
  );
}
