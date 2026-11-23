import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Field, Modal, useToast } from '../components/ui';
import { IconLogout, IconTrash } from '../components/Icons';
import { useAuth } from '../lib/auth';
import { errorMessage } from '../lib/errors';
import { initials } from '../lib/format';
import { api } from '../lib/api';

export default function Account() {
  const { user, updateAccount, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const hasChanges = name.trim() !== user.name || email.trim().toLowerCase() !== user.email;

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await updateAccount({ name: name.trim(), email: email.trim() });
      toast.show('Vos informations ont été mises à jour.');
    } catch (caught) {
      setFormError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/connexion', { replace: true });
    } catch (caught) {
      toast.show(errorMessage(caught), 'error');
    } finally {
      setLoggingOut(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      await logout();
      navigate('/connexion', { replace: true });
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
          <h1 className="page-title">Votre compte</h1>
          <p className="page-sub">Gérez vos informations et l’accès à votre compte Finora.</p>
        </div>
      </div>

      <div className="account-layout">
        <Card className="account-form">
          <div className="account-identity">
            <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
            <div className="account-identity-copy">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <form className="form" onSubmit={(event) => void saveAccount(event)}>
            <h2 className="account-section-title">Informations personnelles</h2>
            <Field label="Nom complet">
              <input
                autoComplete="name"
                maxLength={80}
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label="Adresse email">
              <input
                autoComplete="email"
                type="email"
                maxLength={180}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            {formError ? <p className="field-hint field-error" role="alert">{formError}</p> : null}
            <div>
              <button type="submit" className="btn btn-primary" disabled={saving || !hasChanges}>
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </Card>

        <div className="account-panel">
          <Card className="account-security">
            <div>
              <h2 className="account-section-title">Session</h2>
              <p>Déconnectez-vous de Finora sur cet appareil. Vous pourrez vous reconnecter à tout moment.</p>
            </div>
            <button type="button" className="btn btn-soft" disabled={loggingOut} onClick={() => void signOut()}>
              <IconLogout size={17} />
              {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
          </Card>

          <Card className="account-danger">
            <h2 className="account-section-title">Supprimer le compte</h2>
            <p>Cette action supprime définitivement votre compte, vos transactions, budgets et catégories.</p>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
              <IconTrash size={17} />
              Supprimer mon compte
            </button>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmingDelete}
        title="Supprimer votre compte ?"
        description="Cette suppression est définitive et ne peut pas être annulée."
        onClose={() => {
          if (!deleting) setConfirmingDelete(false);
        }}
        footer={
          <>
            <button type="button" className="btn btn-ghost" disabled={deleting} onClick={() => setConfirmingDelete(false)}>
              Annuler
            </button>
            <button type="button" className="btn btn-danger" disabled={deleting} onClick={() => void deleteAccount()}>
              <IconTrash size={16} />
              {deleting ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Toutes vos données Finora seront effacées. Vous serez ensuite déconnecté.
        </p>
      </Modal>
    </div>
  );
}
