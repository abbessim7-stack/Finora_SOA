import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { todayISO } from '../lib/format';
import type { Category, Id, Transaction, TxType } from '../lib/types';
import { Field, Modal, Segmented, useToast } from './ui';

interface TransactionDialogProps {
  open: boolean;
  editing?: Transaction | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function TransactionDialog({ open, editing = null, onClose, onSaved }: TransactionDialogProps) {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TxType>('expense');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<Id>('');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api
      .listCategories()
      .then(setCategories)
      .catch((caught) => setError(errorMessage(caught)));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setType(editing?.type ?? 'expense');
    setLabel(editing?.label ?? '');
    setAmount(editing ? String(editing.amount).replace('.', ',') : '');
    setCategoryId(editing?.categoryId ?? '');
    setDate(editing?.date ?? todayISO());
  }, [open, editing]);

  const options = categories.filter((category) => category.type === type);
  const activeCategoryId = options.some((category) => category.id === categoryId)
    ? categoryId
    : (options[0]?.id ?? '');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = Number(amount.replace(/\s/g, '').replace(',', '.'));
    if (!label.trim()) return setError('Indiquez un libellé pour cette transaction.');
    if (!Number.isFinite(parsed) || parsed <= 0) return setError('Le montant doit être strictement positif.');
    if (!activeCategoryId) return setError('Choisissez une catégorie.');
    if (!date) return setError('Choisissez une date.');

    setSaving(true);
    try {
      const payload = { label, amount: parsed, type, categoryId: activeCategoryId, date };
      if (editing) {
        await api.updateTransaction(editing.id, payload);
        toast.show('Transaction mise à jour');
      } else {
        await api.createTransaction(payload);
        toast.show('Transaction ajoutée');
      }
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Modifier la transaction' : 'Nouvelle transaction'}
      description="Un revenu ou une dépense, classé dans la bonne catégorie."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" form="transaction-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter la transaction'}
          </button>
        </>
      }
    >
      <form id="transaction-form" className="form" onSubmit={submit}>
        <Segmented
          ariaLabel="Type de transaction"
          value={type}
          onChange={(next) => {
            setType(next);
            setCategoryId('');
          }}
          options={[
            { value: 'expense', label: 'Dépense' },
            { value: 'income', label: 'Revenu' },
          ]}
        />

        <Field label="Libellé">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={type === 'expense' ? 'Courses, loyer, restaurant…' : 'Salaire, freelance…'}
            maxLength={80}
          />
        </Field>

        <div className="form-row">
          <Field label="Montant (DT)">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Date">
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
        </div>

        <Field label="Catégorie" hint={options.length === 0 ? 'Créez d’abord une catégorie de ce type.' : undefined}>
          <select value={activeCategoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {options.length === 0 ? <option value="">Aucune catégorie</option> : null}
            {options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
