import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Login } from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Transactions = lazy(() => import('./pages/Transactions').then(module => ({ default: module.Transactions })));
const AddTransaction = lazy(() => import('./pages/AddTransaction').then(module => ({ default: module.AddTransaction })));
const Wallets = lazy(() => import('./pages/Wallets').then(module => ({ default: module.Wallets })));
const Categories = lazy(() => import('./pages/Categories').then(module => ({ default: module.Categories })));
const Budgets = lazy(() => import('./pages/Budgets').then(module => ({ default: module.Budgets })));
const Recurring = lazy(() => import('./pages/Recurring').then(module => ({ default: module.Recurring })));
const Reports = lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Loans = lazy(() => import('./pages/Loans').then(module => ({ default: module.Loans })));
const Savings = lazy(() => import('./pages/Savings').then(module => ({ default: module.Savings })));

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen text="Đang khởi động..." />;
  if (!user) return <Login />;

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner fullScreen text="Đang tải..." />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/add-transaction" element={<AddTransaction />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
