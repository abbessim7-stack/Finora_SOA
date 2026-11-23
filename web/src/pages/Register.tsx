import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Field } from '../components/ui';
import { useAuth } from '../lib/auth';
import { errorMessage } from '../lib/errors';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card-head">
        <p className="eyebrow">Inscription</p>
        <h2 className="auth-title">Créer votre espace Finora</h2>
        <p className="auth-sub">Quelques secondes, et vos catégories de départ sont prêtes.</p>
      </div>

      <form className="form" onSubmit={submit}>
        <Field label="Nom complet">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Camille Rousseau"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Adresse email">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@exemple.fr"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Mot de passe" hint="8 caractères minimum.">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="auth-switch">
        Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
      </p>
    </AuthLayout>
  );
}
