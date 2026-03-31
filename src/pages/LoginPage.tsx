import { useState } from 'react';
import { findSalarieByCode } from '@/data/employees';
import { Salarie } from '@/types';
import { Eye, EyeOff, Lock, LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: (salarie: Salarie) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salarie = findSalarieByCode(code);
    if (salarie) {
      setError('');
      onLogin(salarie);
    } else {
      setError("Code d'accès incorrect. Veuillez réessayer.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f2557 0%, #1a3a6e 50%, #0d2040 100%)' }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-700/60 flex items-center justify-center text-3xl mx-auto mb-4">
          📋
        </div>
        <h1 className="text-3xl font-bold text-white tracking-wide">VARIABLES - SOMNUM</h1>
        <p className="text-blue-200 mt-1 text-sm">Portail Salariés</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <span className="text-blue-600 text-lg">🔑</span>
          </div>
          <div>
            <h2 className="text-blue-700 font-semibold text-base">Connexion</h2>
            <p className="text-gray-400 text-xs">Saisissez votre code personnel</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-2 tracking-wider">
              CODE D'ACCÈS
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: code.trim() ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#9ca3af',
              color: 'white',
            }}
          >
            <LogIn className="w-4 h-4" />
            Accéder à mon espace
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-4">
          Votre code personnel vous a été communiqué par le service RH
        </p>
      </div>

      <p className="text-blue-300/50 text-xs mt-8">© VARIABLES - SOMNUM</p>
    </div>
  );
}
