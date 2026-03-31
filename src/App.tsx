import { useState } from 'react';
import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import SalarieDashboard from '@/pages/SalarieDashboard';

interface AuthResult {
  nom: string;
  isAdmin: boolean;
}

export default function App() {
  const [auth, setAuth] = useState<AuthResult | null>(null);

  if (!auth) return <LoginPage onLogin={setAuth} />;
  if (auth.isAdmin) return <AdminDashboard onLogout={() => setAuth(null)} />;
  return <SalarieDashboard nom={auth.nom} onLogout={() => setAuth(null)} />;
}
