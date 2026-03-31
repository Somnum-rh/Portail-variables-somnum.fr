import { useState } from 'react';
import { Salarie } from '@/types';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/components/Dashboard';

export default function App() {
  const [salarie, setSalarie] = useState<Salarie | null>(null);

  const handleLogin = (s: Salarie) => {
    setSalarie(s);
  };

  const handleLogout = () => {
    setSalarie(null);
  };

  if (!salarie) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard salarie={salarie} onLogout={handleLogout} />;
}
