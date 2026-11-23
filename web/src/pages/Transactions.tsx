import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { exportTransactionsCsv } from '../lib/csv';
import { formatDate, formatMoney } from '../lib/format';
import { useMonth } from '../lib/month';
import { useRefresh } from '../lib/refresh';
import type { Category, Transaction, TransactionPage, TxType } from '../lib/types';
import { Card, EmptyState, Modal, Segmented, useToast } from '../components/ui';
import { CategoryChip } from '../components/CategoryChip';
import { TransactionDialog } from '../components/TransactionDialog';
import {
  IconArrows,
  IconDownload,
  IconPencil,
  IconSearch,
  IconTrash,
} from '../components/Icons';

const PAGE_SIZE = 10;

export default function Transactions() {
  const { month } = useMonth();
  const { key: refreshKey, refresh } = useRefresh();
  const toast = useToast();

  const [data, setData] = useState<TransactionPage | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TxType | 'all'>('all');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [removing, setRemoving] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [month, type, categoryId, debouncedSearch]);

  useEffect(() => {
    api
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [refreshKey]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .listTransactions({ month, type, categoryId, search: debouncedSearch, page, limit: PAGE_SIZE })
      .then((result) => {
        if (alive) setData(result);
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
  }, [month, type, categoryId, debouncedSearch, page, refreshKey, toast]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExport = async () => {
    try {
      const all = await api.listTransactions({
        month,
        type,
        categoryId,
        search: debouncedSearch,
        page: 1,
        limit: 100,
      });
      if (all.items.length === 0) {
        toast.show('Aucune transaction à exporter pour ces filtres', 'info');
        return;
      }
      exportTransactionsCsv(all.items, categories);
      toast.show('Export CSV généré');
    } catch (caught) {
      toast.show(errorMessage(caught), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!removing) return;
    setDeleting(true);
    try {
      await api.deleteTransaction(removing.id);
      toast.show('Transaction supprimée');
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
          <p className="eyebrow">Transactions</p>
          <h1 className="page-title">Vos mouvements</h1>
          <p className="page-sub">
            {total} transaction{total > 1 ? 's' : ''} sur le mois sélectionné.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Ajouter
        </button>
      </div>

      <div className="toolbar">
        <Segmented
          ariaLabel="Filtrer par type"
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: 'Toutes' },
            { value: 'income', label: 'Revenus' },
            { value: 'expense', label: 'Dépenses' },
          ]}
        />

        <div className="toolbar-right">
          <label className="search">
            <IconSearch size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un libellé"
              aria-label="Rechercher une transaction"
            />
          </label>

          <div className="select-wrap">
            <select
              className="select"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              aria-label="Filtrer par catégorie"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="btn btn-soft" onClick={() => void handleExport()}>
            <IconDownload size={16} />
            CSV
          </button>
        </div>
      </div>

      <Card className="table-card">
        <div className="table-head">
          <span>Date</span>
          <span>Libellé</span>
          <span>Catégorie</span>
          <span>Type</span>
          <span className="ta-right">Montant</span>
          <span aria-hidden="true" />
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<IconArrows size={20} />}
            title={loading ? 'Chargement…' : 'Aucune transaction'}
            description={
              loading
                ? 'Nous récupérons vos mouvements.'
                : 'Ajustez les filtres ou ajoutez une nouvelle transaction.'
            }
            action={
              !loading ? (
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  Ajouter une transaction
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className={`table-body${loading ? ' is-loading' : ''}`}>
            {items.map((transaction) => {
              const category = categoryById.get(transaction.categoryId);
              return (
                <li key={transaction.id} className="table-row">
                  <span className="cell-date">{formatDate(transaction.date)}</span>
                  <span className="cell-label">{transaction.label}</span>
                  <span className="cell-category">
                    <CategoryChip name={category?.name ?? 'Sans catégorie'} />
                  </span>
                  <span className={`cell-type ${transaction.type}`}>
                    {transaction.type === 'income' ? 'Revenu' : 'Dépense'}
                  </span>
                  <span className={`cell-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '−'}
                    {formatMoney(transaction.amount)}
                  </span>
                  <span className="cell-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Modifier ${transaction.label}`}
                      onClick={() => {
                        setEditing(transaction);
                        setDialogOpen(true);
                      }}
                    >
                      <IconPencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label={`Supprimer ${transaction.label}`}
                      onClick={() => setRemoving(transaction)}
                    >
                      <IconTrash size={16} />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {total > PAGE_SIZE ? (
          <div className="pagination">
            <span className="muted">
              Page {page} sur {pageCount}
            </span>
            <div className="pagination-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Précédent
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >
                Suivant
              </button>
            </div>
          </div>
        ) : null}
      </Card>

      <TransactionDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={refresh}
      />

      <Modal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        size="sm"
        title="Supprimer la transaction ?"
        description="Cette action est définitive."
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
          « {removing?.label} » ({removing ? formatMoney(removing.amount) : ''}) sera retirée de votre historique.
        </p>
      </Modal>
    </div>
  );
}
