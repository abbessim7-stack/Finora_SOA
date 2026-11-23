import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { useRefresh } from '../lib/refresh';
import type { Category, TxType } from '../lib/types';
import { Card, EmptyState, Field, Modal, Segmented, Skeleton, useToast } from '../components/ui';
import { CategoryAvatar } from '../components/CategoryChip';
import { IconPencil, IconPlus, IconTag, IconTrash } from '../components/Icons';

export default function Categories() {
  const { key: refreshKey, refresh } = useRefresh();
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .listCategories()
      .then((data) => {
        if (alive) setCategories(data);
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
  }, [refreshKey, toast]);

  const groups = useMemo(
    () => ({
      expense: categories.filter((category) => category.type === 'expense'),
      income: categories.filter((category) => category.type === 'income'),
    }),
    [categories],
  );

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType('expense');
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setType(category.type);
    setFormError(null);
    setDialogOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setFormError('Le nom doit contenir au moins 2 caractères.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.updateCategory(editing.id, { name, type });
        toast.show('Catégorie mise à jour');
      } else {
        await api.createCategory({ name, type });
        toast.show('Catégorie créée');
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
      await api.deleteCategory(removing.id);
      toast.show('Catégorie supprimée');
      setRemoving(null);
      refresh();
    } catch (caught) {
      toast.show(errorMessage(caught), 'error');
      setRemoving(null);
    } finally {
      setDeleting(false);
    }
  };

  const renderList = (items: Category[]) => (
    <ul className="cat-list">
      {items.map((category) => (
        <li key={category.id} className="cat-row">
          <CategoryAvatar name={category.name} />
          <span className="cat-body">
            <strong>{category.name}</strong>
            <small>{category.type === 'income' ? 'Catégorie de revenu' : 'Catégorie de dépense'}</small>
          </span>
          <span className="cat-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label={`Renommer ${category.name}`}
              onClick={() => openEdit(category)}
            >
              <IconPencil size={16} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              aria-label={`Supprimer ${category.name}`}
              onClick={() => setRemoving(category)}
            >
              <IconTrash size={16} />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="page-inner">
      <div className="page-head">
        <div>
          <p className="eyebrow">Catégories</p>
          <h1 className="page-title">Votre organisation</h1>
          <p className="page-sub">Chaque transaction appartient à une catégorie de revenu ou de dépense.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <IconPlus size={17} />
          Nouvelle catégorie
        </button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="cat-columns">
          <Card>
            <Skeleton height={14} width={110} />
            <div style={{ height: 20 }} />
            <Skeleton height={150} radius={14} />
          </Card>
          <Card>
            <Skeleton height={14} width={110} />
            <div style={{ height: 20 }} />
            <Skeleton height={110} radius={14} />
          </Card>
        </div>
      ) : (
        <div className="cat-columns stagger">
          <Card>
            <div className="card-head">
              <div>
                <h2 className="card-title">Dépenses</h2>
                <p className="card-sub">{groups.expense.length} catégories</p>
              </div>
            </div>
            {groups.expense.length === 0 ? (
              <EmptyState
                icon={<IconTag size={20} />}
                title="Aucune catégorie de dépense"
                description="Créez-en une pour classer vos sorties d’argent."
              />
            ) : (
              renderList(groups.expense)
            )}
          </Card>

          <Card>
            <div className="card-head">
              <div>
                <h2 className="card-title">Revenus</h2>
                <p className="card-sub">{groups.income.length} catégories</p>
              </div>
            </div>
            {groups.income.length === 0 ? (
              <EmptyState
                icon={<IconTag size={20} />}
                title="Aucune catégorie de revenu"
                description="Créez-en une pour classer vos entrées d’argent."
              />
            ) : (
              renderList(groups.income)
            )}
          </Card>
        </div>
      )}

      <p className="hint-block">
        Une catégorie utilisée par des transactions ne peut pas être supprimée : modifiez d’abord ces transactions
        ou renommez la catégorie.
      </p>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        description="Le nom est unique pour chaque type de catégorie."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDialogOpen(false)}>
              Annuler
            </button>
            <button type="submit" form="category-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer la catégorie'}
            </button>
          </>
        }
      >
        <form id="category-form" className="form" onSubmit={submit}>
          <Field label="Nom de la catégorie">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alimentation, Loisirs, Salaire…"
              maxLength={40}
            />
          </Field>
          <Field label="Type">
            <Segmented
              ariaLabel="Type de catégorie"
              value={type}
              onChange={setType}
              options={[
                { value: 'expense', label: 'Dépense' },
                { value: 'income', label: 'Revenu' },
              ]}
            />
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
        title="Supprimer la catégorie ?"
        description="La suppression est refusée si des transactions l’utilisent."
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
        <p className="confirm-text">« {removing?.name} » sera définitivement supprimée.</p>
      </Modal>
    </div>
  );
}
