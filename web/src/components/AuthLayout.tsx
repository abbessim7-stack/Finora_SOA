import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from './Brand';
import { IconCheck, IconSparkle } from './Icons';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="ambient" aria-hidden="true" />

      <aside className="auth-aside">
        <Link to="/" className="auth-brand" aria-label="Finora">
          <Brand />
        </Link>

        <div className="auth-pitch">
          <p className="eyebrow">
            <IconSparkle size={14} /> Gestion de budget personnel
          </p>
          <h1>
            Reprenez la main sur votre argent, <em>un mois à la fois</em>.
          </h1>
          <p className="auth-lead">
            Finora réunit vos revenus, vos dépenses et vos plafonds dans un tableau de bord qui se lit d’un regard.
          </p>

          <ul className="auth-points">
            <li>
              <span className="auth-check">
                <IconCheck size={13} />
              </span>
              Un solde, une répartition, des budgets — sans tableur.
            </li>
            <li>
              <span className="auth-check">
                <IconCheck size={13} />
              </span>
              Des alertes avant le dépassement, pas après.
            </li>
            <li>
              <span className="auth-check">
                <IconCheck size={13} />
              </span>
              Une API REST documentée pour vos autres outils.
            </li>
          </ul>
        </div>

        <div className="auth-preview">
          <div className="auth-preview-chart" aria-hidden="true">
            <div className="auth-donut">
              <span>68 %</span>
            </div>
          </div>
          <div className="auth-preview-body">
            <span className="stat-label">Budget de novembre</span>
            <strong>2 603,81 DT</strong>
            <span className="auth-preview-note">de solde disponible</span>
          </div>
        </div>

        <p className="auth-foot">Atelier SOA · React · NestJS · MySQL</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
