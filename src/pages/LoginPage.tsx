import { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface AuthResult {
  nom: string;
  isAdmin: boolean;
}

interface LoginPageProps {
  onLogin: (result: AuthResult) => void;
}

const ADMIN_CODE = '000000';

const SALARIE_CODES: Record<string, string> = {
  "Cuisinier Céline": "482951",
  "Salarié 02": "739204",
  "Salarié 03": "156873",
  "Salarié 04": "924017",
  "Salarié 05": "371485",
  "Salarié 06": "608342",
  "Salarié 07": "219756",
  "Salarié 08": "847293",
  "Salarié 09": "563018",
  "Salarié 10": "431679",
  "Salarié 11": "987025",
  "Salarié 12": "264803",
  "Salarié 13": "718946",
  "Salarié 14": "395271",
  "Salarié 15": "842630",
  "Salarié 16": "157489",
  "Salarié 17": "630247",
  "Salarié 18": "492815",
  "Salarié 19": "873561",
  "Salarié 20": "345098",
  "Salarié 21": "761234",
  "Salarié 22": "508976",
  "Salarié 23": "234817",
  "Salarié 24": "916053",
  "Salarié 25": "673481",
  "Salarié 26": "189327",
  "Salarié 27": "547902",
  "Salarié 28": "823465",
  "Salarié 29": "410793",
  "Salarié 30": "962148",
  "Salarié 31": "285730",
  "Salarié 32": "714896",
  "Salarié 33": "439025",
  "Salarié 34": "597384",
  "Salarié 35": "163749",
  "Salarié 36": "820416",
  "Salarié 37": "375892",
  "Salarié 38": "649203",
  "Salarié 39": "917530",
  "Salarié 40": "283647",
  "Salarié 41": "504918",
  "Salarié 42": "761385",
  "Salarié 43": "428071",
  "Salarié 44": "895364",
  "Salarié 45": "137926",
  "Salarié 46": "604851",
  "Salarié 47": "392748",
  "Salarié 48": "819043",
  "Salarié 49": "256739",
  "Salarié 50": "473862",
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Code admin
    if (code === ADMIN_CODE) {
      setError('');
      onLogin({ nom: 'Administrateur', isAdmin: true });
      return;
    }
    // Code salarié
    const found = Object.entries(SALARIE_CODES).find(([, c]) => c === code);
    if (found) {
      setError('');
      onLogin({ nom: found[0], isAdmin: false });
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
            <label className="block text-xs font-semibold text-gray-500 mb-2 tracking-wider uppercase">
              Code d'accès
            </label>
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="••••••"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base font-mono tracking-widest focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCode(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#1F4E79] hover:bg-[#163d61] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <LogIn size={15} />
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
