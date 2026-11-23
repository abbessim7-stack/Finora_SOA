import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMonth } from '../lib/month';
import { useRefresh } from '../lib/refresh';
import { initials } from '../lib/format';
import { Brand } from './Brand';
import { MonthSwitcher } from './ui';
import { TransactionDialog } from './TransactionDialog';
import { IconArrows, IconGrid, IconLogout, IconPlus, IconTag, IconTarget, IconUser, IconWallet } from './Icons';

const USER_NAV = [
  { to: '/', label: 'Tableau de bord', mobileLabel: 'Accueil', icon: IconGrid, end: true },
  { to: '/transactions', label: 'Transactions', icon: IconArrows, end: false },
  { to: '/budgets', label: 'Budgets', icon: IconTarget, end: false },
  { to: '/categories', label: 'Catégories', icon: IconTag, end: false },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { month, setMonth } = useMonth();
  const { refresh } = useRefresh();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isAdminPage = location.pathname === '/admin';
  const nav = isAdmin
    ? [
        { to: '/admin', label: 'Administration', mobileLabel: 'Admin', icon: IconGrid, end: true },
        { to: '/budget', label: 'Mon budget', mobileLabel: 'Budget', icon: IconWallet, end: true },
        ...USER_NAV.slice(1),
      ]
    : USER_NAV;

  return (
    <div className="shell">
      <div className="ambient" aria-hidden="true" />

      <aside className="sidebar">
        <NavLink to="/" className="sidebar-brand" aria-label="Finora, accueil">
          <Brand />
        </NavLink>

        <nav className="nav" aria-label="Navigation principale">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
            >
              <Icon size={19} className="nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="sidebar-note-icon" aria-hidden="true">
            <IconTarget size={15} />
          </span>
          <p>
            {isAdmin ? 'Gérez les comptes et suivez le service en un seul endroit.' : 'Un budget tenu, c’est un objectif qui devient possible.'}
          </p>
        </div>

        <div className="user-card">
          <span className="avatar" aria-hidden="true">
            {user ? initials(user.name) : '··'}
          </span>
          <span className="user-meta">
            <strong>{user?.name ?? 'Invité'}</strong>
            <small>{user?.email ?? ''}</small>
          </span>
          <button type="button" className="icon-btn" aria-label="Se déconnecter" onClick={() => void logout()}>
            <IconLogout size={17} />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-brand">
            <Brand compact />
          </div>
          {!isAdminPage ? <MonthSwitcher month={month} onChange={setMonth} /> : null}
          <button type="button" className="btn btn-soft topbar-account" onClick={() => navigate('/account')}>
            <IconUser size={17} />
            <span className="topbar-account-label">Compte</span>
          </button>
          {!isAdminPage ? (
            <button type="button" className="btn btn-primary topbar-cta" onClick={() => setQuickAddOpen(true)}>
              <IconPlus size={17} />
              <span className="topbar-cta-label">Nouvelle transaction</span>
              <span className="topbar-cta-short">Ajouter</span>
            </button>
          ) : null}
        </header>

        <div className="page">
          <Outlet />
        </div>
      </main>

      <nav className={`tabbar${isAdmin ? ' tabbar-admin' : ''}`} aria-label="Navigation mobile">
        {nav.map(({ to, label, mobileLabel, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `tab${isActive ? ' is-active' : ''}`}
            aria-label={label}
          >
            <Icon size={21} />
            <span>{mobileLabel ?? label}</span>
          </NavLink>
        ))}
      </nav>

      {!isAdminPage ? (
        <TransactionDialog
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}
