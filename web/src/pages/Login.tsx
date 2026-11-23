import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Field } from '../components/ui';
import { useAuth } from '../lib/auth';
import { errorMessage } from '../lib/errors';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  const demo = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('demo@finora.app', 'demo1234');
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
        <p className="eyebrow">Connexion</p>
        <h2 className="auth-title">Bon retour parmi nous</h2>
        <p className="auth-sub">Connectez-vous pour retrouver votre budget.</p>
      </div>

      <form className="form" onSubmit={submit}>
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
        <Field label="Mot de passe">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </Field>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="auth-divider">
        <span>ou</span>
      </div>

      <button type="button" className="btn btn-soft btn-block" onClick={() => void demo()} disabled={loading}>
        Explorer la démonstration
      </button>
      <p className="auth-hint">Compte de démonstration : demo@finora.app · demo1234</p>

      <p className="auth-switch">
        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </AuthLayout>
  );
}
