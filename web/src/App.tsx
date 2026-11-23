import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Brand } from './components/Brand';
import { ToastProvider } from './components/ui';
import { AuthProvider, useAuth } from './lib/auth';
import { ActivityTracker } from './lib/ActivityTracker';
import { MonthProvider } from './lib/month';
import { RefreshProvider } from './lib/refresh';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Transactions from './pages/Transactions';
import Account from './pages/Account';
import AdminDashboard from './pages/AdminDashboard';

function HomeRoute() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />;
}

function AdminRoute() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />;
}

function Splash() {
  return (
    <div className="splash">
      <div className="ambient" aria-hidden="true" />
      <Brand />
      <p>Préparation de votre tableau de bord…</p>
    </div>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/connexion" replace />;
  return (
    <RefreshProvider>
      <MonthProvider>
        <ActivityTracker />
        <AppShell />
      </MonthProvider>
    </RefreshProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/budget" element={<Dashboard />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/account" element={<Account />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
