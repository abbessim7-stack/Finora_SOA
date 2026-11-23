import { useEffect, useMemo, useState } from 'react';
import { Card, EmptyState, Skeleton, useToast } from '../components/ui';
import { IconAlert, IconCheck, IconRefresh, IconSearch } from '../components/Icons';
import { errorMessage } from '../lib/errors';
import { useAuth } from '../lib/auth';
import { adminApi, type AdminOverview, type AdminUserPage } from '../lib/httpApi';

const PAGE_SIZE = 10;

function formatDay(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(date);
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days} j ${hours} h`;
  if (hours) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (seconds > 0 && !minutes) return '<1 min';
  if (!hours) return `${minutes} min`;
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}

function formatCompactDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (seconds > 0 && !minutes) return '<1m';
  if (!hours) return `${minutes}m`;
  return remainingMinutes ? `${hours}h${remainingMinutes}m` : `${hours}h`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserPage | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    let alive = true;
    setOverviewLoading(true);
    setOverviewError(null);
    adminApi
      .overview()
      .then((result) => {
        if (alive) setOverview(result);
      })
      .catch((caught) => {
        if (alive) setOverviewError(errorMessage(caught));
      })
      .finally(() => {
        if (alive) setOverviewLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let alive = true;
    setUsersLoading(true);
    setUsersError(null);
    adminApi
      .listUsers(debouncedSearch, page, PAGE_SIZE)
      .then((result) => {
        if (alive) setUsers(result);
      })
      .catch((caught) => {
        if (alive) setUsersError(errorMessage(caught));
      })
      .finally(() => {
        if (alive) setUsersLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [debouncedSearch, page, refreshKey]);

  const maxLoggedInUsers = useMemo(
    () => Math.max(1, ...(overview?.usage.map((entry) => entry.loggedInUsers) ?? [])),
    [overview],
  );
  const activeTimeTotal = overview?.usage.reduce((total, entry) => total + entry.activeSeconds, 0) ?? 0;
  const pageCount = Math.max(1, Math.ceil((users?.total ?? 0) / PAGE_SIZE));
  const firstItem = users?.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(page * PAGE_SIZE, users?.total ?? 0);

  const updateUser = async (
    targetId: number,
    change: { role?: 'user' | 'admin'; isActive?: boolean },
  ) => {
    const target = users?.items.find((item) => item.id === targetId);
    if (!target) return;
    if (change.role && change.role !== target.role) {
      const action = change.role === 'admin' ? 'accorder les droits admin à' : 'retirer les droits admin de';
      if (!window.confirm(`Confirmer : ${action} ${target.name} ?`)) return;
    }
    if (change.isActive === false && !window.confirm(`Désactiver le compte de ${target.name} ?`)) return;

    setSavingId(targetId);
    try {
      await adminApi.updateUser(targetId, change);
      toast.show('Compte mis à jour.');
      setRefreshKey((key) => key + 1);
    } catch (caught) {
      toast.show(errorMessage(caught), 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="page-inner admin-page">
      <div className="page-head admin-page-head">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-sub">Comptes, activité de la plateforme et état des services.</p>
        </div>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={overviewLoading || usersLoading}
        >
          <IconRefresh size={16} />
          Actualiser
        </button>
      </div>

      <p className="admin-privacy">
        <IconCheck size={16} />
        Les données financières individuelles ne sont pas accessibles depuis cet espace.
      </p>

      {overviewError ? (
        <div className="alert-banner" role="alert">
          <IconAlert size={18} />
          <span>{overviewError}</span>
        </div>
      ) : null}

      <section className="admin-stats" aria-label="Statistiques utilisateurs">
        {[
          { label: 'Comptes', value: overview?.users.total },
          { label: 'Actifs', value: overview?.users.active },
          { label: 'Nouveaux · 30 jours', value: overview?.users.newLast30Days },
          { label: 'Admins actifs', value: overview?.users.admins },
        ].map((stat) => (
          <div className="admin-stat" key={stat.label}>
            <span>{stat.label}</span>
            {overviewLoading && !overview ? (
              <Skeleton height={28} width={62} />
            ) : (
              <strong>{stat.value ?? '—'}</strong>
            )}
          </div>
        ))}
      </section>

      <div className="admin-insights">
        <Card className="admin-traffic">
          <div className="card-head">
            <div>
              <h2 className="card-title">Utilisation</h2>
              <p className="card-sub">Comptes connectés uniques · temps actif · 7 jours</p>
            </div>
            <strong className="admin-traffic-total" title="Temps actif cumulé sur sept jours">
              {overviewLoading && !overview ? '—' : formatDuration(activeTimeTotal)}
            </strong>
          </div>
          {overview?.usage.length ? (
            <>
              <div className="traffic-chart" aria-label="Comptes connectés et temps actif quotidien sur sept jours">
                {overview.usage.map((entry) => (
                  <div
                    className="traffic-day"
                    key={entry.day}
                    title={`${entry.loggedInUsers} comptes connectés · ${formatDuration(entry.activeSeconds)} de temps actif`}
                  >
                    <span className="traffic-count">{entry.loggedInUsers}</span>
                    <div className="traffic-track">
                      {entry.loggedInUsers ? (
                        <span
                          style={{
                            height: `${Math.max(3, (entry.loggedInUsers / maxLoggedInUsers) * 100)}%`,
                          }}
                        />
                      ) : null}
                    </div>
                    <span className="traffic-label">{formatDay(entry.day)}</span>
                    <span className="traffic-time">{formatCompactDuration(entry.activeSeconds)}</span>
                  </div>
                ))}
              </div>
              <p className="traffic-note">
                Temps actif estimé avec onglet visible et activité récente (2 min). Suivi depuis le déploiement.
              </p>
            </>
          ) : overviewLoading ? (
            <Skeleton height={140} />
          ) : (
            <EmptyState title="Aucune activité enregistrée" description="Les connexions et le temps actif apparaîtront ici." />
          )}
        </Card>

        <Card className="admin-services">
          <div className="card-head">
            <div>
              <h2 className="card-title">État des services</h2>
              <p className="card-sub">Vérification en direct</p>
            </div>
          </div>
          {overviewLoading && !overview ? (
            <div className="admin-service-list">
              <Skeleton height={42} />
              <Skeleton height={42} />
            </div>
          ) : (
            <ul className="admin-service-list">
              <li>
                <span>API Finora</span>
                <strong className="service-state is-operational">
                  <i /> {overview?.services.api === 'operational' ? 'Opérationnelle' : 'Indisponible'}
                </strong>
              </li>
              <li>
                <span>Base de données</span>
                <strong className={`service-state ${overview?.services.database === 'operational' ? 'is-operational' : 'is-degraded'}`}>
                  <i /> {overview?.services.database === 'operational' ? 'Connectée' : 'Dégradée'}
                </strong>
              </li>
              <li>
                <span>API active depuis</span>
                <strong>{overview ? formatUptime(overview.services.uptimeSeconds) : '—'}</strong>
              </li>
            </ul>
          )}
          {overview ? (
            <p className="admin-updated">
              Mis à jour à {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(overview.updatedAt))}
            </p>
          ) : null}
        </Card>
      </div>

      <section className="admin-accounts" aria-labelledby="admin-accounts-title">
        <div className="admin-section-head">
          <div>
            <h2 className="card-title" id="admin-accounts-title">Comptes utilisateurs</h2>
            <p className="card-sub">Gérez les accès et les rôles. Les changements prennent effet immédiatement.</p>
          </div>
          <label className="search admin-search">
            <IconSearch size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom ou email"
              aria-label="Rechercher un compte par nom ou email"
            />
          </label>
        </div>

        {usersError ? (
          <div className="alert-banner" role="alert">
            <IconAlert size={18} />
            <span>{usersError}</span>
          </div>
        ) : null}

        <div className={`admin-table-wrap${usersLoading ? ' is-loading' : ''}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Compte</th>
                <th scope="col">Inscription</th>
                <th scope="col">Rôle</th>
                <th scope="col">Statut</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {users?.items.map((account) => {
                const isSelf = String(account.id) === String(user?.id);
                const saving = savingId === account.id;
                return (
                  <tr key={account.id}>
                    <td>
                      <strong>{account.name}</strong>
                      <span>{account.email}</span>
                    </td>
                    <td className="admin-date">
                      {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(account.createdAt))}
                    </td>
                    <td>
                      <select
                        className="admin-role-select"
                        aria-label={`Rôle de ${account.name}`}
                        value={account.role}
                        disabled={saving || isSelf}
                        onChange={(event) => void updateUser(account.id, { role: event.target.value as 'user' | 'admin' })}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`admin-status${account.isActive ? ' is-active' : ' is-disabled'}`}>
                        <i /> {account.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="admin-action-cell">
                      <button
                        type="button"
                        className="btn btn-soft admin-action"
                        disabled={saving || isSelf}
                        onClick={() => void updateUser(account.id, { isActive: !account.isActive })}
                      >
                        {saving ? 'Patientez…' : account.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!usersLoading && users?.items.length === 0 ? (
            <EmptyState
              title={debouncedSearch ? 'Aucun compte correspondant' : 'Aucun compte'}
              description={debouncedSearch ? 'Essayez un autre nom ou une autre adresse email.' : 'Les comptes inscrits apparaîtront ici.'}
            />
          ) : null}
          {usersLoading && !users ? (
            <div className="admin-table-skeleton">
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
            </div>
          ) : null}
        </div>

        <div className="admin-pagination">
          <span>{firstItem}–{lastItem} sur {users?.total ?? 0}</span>
          <div>
            <button type="button" className="btn btn-soft" disabled={page <= 1 || usersLoading} onClick={() => setPage((current) => current - 1)}>
              Précédent
            </button>
            <button type="button" className="btn btn-soft" disabled={page >= pageCount || usersLoading} onClick={() => setPage((current) => current + 1)}>
              Suivant
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
