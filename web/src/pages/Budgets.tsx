import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { formatMoney, monthLabel } from '../lib/format';
import { useMonth } from '../lib/month';
import { useRefresh } from '../lib/refresh';
import type { BudgetView, Category, Id } from '../lib/types';
import { Card, EmptyState, Field, Modal, ProgressBar, Skeleton, useToast } from '../components/ui';
import { CategoryAvatar } from '../components/CategoryChip';
import { IconPencil, IconPlus, IconTarget, IconTrash } from '../components/Icons';

export default function Budgets() {
  const { month } = useMonth();
  const { key: refreshKey, refresh } = useRefresh();
  const toast = useToast();

  const [budgets, setBudgets] = useState<BudgetView[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetView | null>(null);
  const [categoryId, setCategoryId] = useState<Id>('');
  const [limit, setLimit] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<BudgetView | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([api.listBudgets(month), api.listCategories()])
      .then(([budgetData, categoryData]) => {
        if (!alive) return;
        setBudgets(budgetData);
        setCategories(categoryData);
      })
      .catch((caught) => {
        if (alive) toast.show(errorMessage(caught), 'error');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [month, refreshKey, toast]);

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  );

  const availableCategories = expenseCategories.filter(
    (category) => !budgets.some((budget) => budget.categoryId === category.id),
  );

  const totals = budgets.reduce(
    (accumulator, budget) => ({
      limit: accumulator.limit + budget.limit,
      spent: accumulator.spent + budget.spent,
    }),
    { limit: 0, spent: 0 },
  );

  const openCreate = () => {
    setEditing(null);
    setCategoryId(availableCategories[0]?.id ?? '');
    setLimit('');
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (budget: BudgetView) => {
    setEditing(budget);
    setCategoryId(budget.categoryId);
    setLimit(String(budget.limit).replace('.', ','));
    setFormError(null);
    setDialogOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(limit.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFormError('Le plafond doit être strictement positif.');
      return;
    }
    if (!editing && !categoryId) {
      setFormError('Choisissez une catégorie de dépense.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.updateBudget(editing.id, { limit: parsed });
        toast.show('Budget mis à jour');
      } else {
        await api.createBudget({ categoryId, month, limit: parsed });
        toast.show('Budget créé');
      }
      setDialogOpen(false);
      refresh();
    } catch (caught) {
      setFormError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!removing) return;
    setDeleting(true);
    try {
      await api.deleteBudget(removing.id);
      toast.show('Budget supprimé');
      setRemoving(null);
      refresh();
    } catch (caught) {
      toast.show(errorMessage(caught), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-inner">
      <div className="page-head">
        <div>
          <p className="eyebrow">Budgets</p>
          <h1 className="page-title">Plafonds mensuels</h1>
          <p className="page-sub">Un plafond par catégorie de dépense, suivi en temps réel.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate} disabled={availableCategories.length === 0}>
          <IconPlus size={17} />
          Nouveau budget
        </button>
      </div>

      <div className="stat-strip">
        <div className="stat-cell">
          <span className="stat-label">Plafonds du mois</span>
          <strong>{formatMoney(totals.limit)}</strong>
        </div>
        <div className="stat-cell">
          <span className="stat-label">Dépensé</span>
          <strong>{formatMoney(totals.spent)}</strong>
        </div>
        <div className="stat-cell">
          <span className="stat-label">Disponible</span>
          <strong className={totals.limit - totals.spent < 0 ? 'is-over' : 'is-income'}>
            {formatMoney(totals.limit - totals.spent)}
          </strong>
        </div>
        <div className="stat-cell stat-cell-month">
          <span className="stat-label">Période</span>
          <strong>{monthLabel(month)}</strong>
        </div>
      </div>

      {loading && budgets.length === 0 ? (
        <div className="budget-grid">
          {[0, 1, 2].map((index) => (
            <Card key={index}>
              <Skeleton height={40} width={180} />
              <div style={{ height: 22 }} />
              <Skeleton height={10} />
              <div style={{ height: 14 }} />
              <Skeleton height={10} width={120} />
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconTarget size={20} />}
            title="Aucun budget pour ce mois"
            description="Fixez un plafond à une catégorie de dépense pour suivre sa consommation."
            action={
              <button type="button" className="btn btn-soft" onClick={openCreate} disabled={availableCategories.length === 0}>
                Créer mon premier budget
              </button>
            }
          />
        </Card>
      ) : (
        <div className="budget-grid stagger">
          {budgets.map((budget) => {
            const over = budget.ratio >= 1;
            const warning = budget.ratio >= 0.85 && !over;
            return (
              <Card key={budget.id} className={`budget-card${over ? ' is-over' : ''}`}>
                <header className="budget-card-head">
                  <CategoryAvatar name={budget.category.name} size={42} />
                  <div className="budget-card-title">
                    <h2>{budget.category.name}</h2>
                    <p className={over ? 'is-over' : warning ? 'is-warning' : 'muted'}>
                      {over
                        ? `Dépassé de ${formatMoney(Math.abs(budget.remaining))}`
                        : warning
                          ? 'Proche du plafond'
                          : `${formatMoney(budget.remaining)} restants`}
                    </p>
                  </div>
                  <div className="budget-card-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Modifier le budget ${budget.category.name}`}
                      onClick={() => openEdit(budget)}
                    >
                      <IconPencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label={`Supprimer le budget ${budget.category.name}`}
                      onClick={() => setRemoving(budget)}
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </header>

                <div className="budget-figures">
                  <strong className={over ? 'is-over' : ''}>{formatMoney(budget.spent)}</strong>
                  <span className="muted">sur {formatMoney(budget.limit)}</span>
                </div>

                <ProgressBar ratio={budget.ratio} danger={over || warning} />

                <footer className="budget-card-foot">
                  <span>{Math.round(budget.ratio * 100)} % du plafond</span>
                  <span>{monthLabel(budget.month)}</span>
                </footer>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Modifier le budget' : 'Nouveau budget'}
        description={editing ? 'Ajustez le plafond mensuel de cette catégorie.' : `Un plafond pour ${monthLabel(month).toLowerCase()}.`}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDialogOpen(false)}>
              Annuler
            </button>
            <button type="submit" form="budget-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le budget'}
            </button>
          </>
        }
      >
        <form id="budget-form" className="form" onSubmit={submit}>
          <Field label="Catégorie de dépense" hint={editing ? 'La catégorie ne peut pas être modifiée.' : undefined}>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={Boolean(editing)}>
              {editing ? <option value={editing.categoryId}>{editing.category.name}</option> : null}
              {!editing && availableCategories.length === 0 ? <option value="">Toutes les catégories ont un budget</option> : null}
              {!editing
                ? availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                : null}
            </select>
          </Field>

          <Field label="Plafond mensuel (DT)">
            <input value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="400,00" inputMode="decimal" />
          </Field>

          {formError ? (
            <p className="form-error" role="alert">
              {formError}
            </p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        size="sm"
        title="Supprimer le budget ?"
        description="Les transactions restent intactes, seul le plafond disparaît."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setRemoving(null)}>
              Annuler
            </button>
            <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Le budget « {removing?.category.name} » ({removing ? formatMoney(removing.limit) : ''}) sera supprimé pour{' '}
          {removing ? monthLabel(removing.month).toLowerCase() : ''}.
        </p>
      </Modal>
    </div>
  );
}
