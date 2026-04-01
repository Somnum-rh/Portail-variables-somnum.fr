import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, LogIn } from 'lucide-react';

interface AuthResult { nom: string; isAdmin: boolean; }
interface LoginPageProps { onLogin: (r: AuthResult) => void; }

const ADMIN_CODE = 'adminRH';
const SALARIE_CODES: Record<string,string> = {
  "Cuisinier Céline":"482951","Salarié 02":"739204","Salarié 03":"156873","Salarié 04":"924017","Salarié 05":"371485","Salarié 06":"608342","Salarié 07":"219756","Salarié 08":"847293","Salarié 09":"563018","Salarié 10":"431679","Salarié 11":"987025","Salarié 12":"264803","Salarié 13":"718946","Salarié 14":"395271","Salarié 15":"842630","Salarié 16":"157489","Salarié 17":"630247","Salarié 18":"492815","Salarié 19":"873561","Salarié 20":"345098","Salarié 21":"761234","Salarié 22":"508976","Salarié 23":"234817","Salarié 24":"916053","Salarié 25":"673481","Salarié 26":"189327","Salarié 27":"547902","Salarié 28":"823465","Salarié 29":"410793","Salarié 30":"962148","Salarié 31":"285730","Salarié 32":"714896","Salarié 33":"439025","Salarié 34":"597384","Salarié 35":"163749","Salarié 36":"820416","Salarié 37":"375892","Salarié 38":"649203","Salarié 39":"917530","Salarié 40":"283647","Salarié 41":"504918","Salarié 42":"761385","Salarié 43":"428071","Salarié 44":"895364","Salarié 45":"137926","Salarié 46":"604851","Salarié 47":"392748","Salarié 48":"819043","Salarié 49":"256739","Salarié 50":"473862"
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = code.trim();
    if (!t) return;
    setLoading(true); setError('');
    if (t === ADMIN_CODE) { onLogin({ nom: 'Administrateur', isAdmin: true }); return; }
    try {
      const { data } = await supabase.from('rh_codes').select('salarie_key').eq('code', t).maybeSingle();
      if (data) { onLogin({ nom: data.salarie_key, isAdmin: false }); return; }
    } catch {}
    const entry = Object.entries(SALARIE_CODES).find(([,v]) => v === t);
    if (entry) { onLogin({ nom: entry[0], isAdmin: false }); return; }
    setError("Code d'accès incorrect. Veuillez réessayer.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2744] via-[#1a3a6e] to-[#0d2040] px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-3xl">📋</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">VARIABLES - SOMNUM</h1>
        <p className="text-blue-200 mt-1 text-sm font-medium">Portail Salariés</p>
      </div>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#1F4E79]/10 flex items-center justify-center">
            <Lock className="text-[#1F4E79] w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#1F4E79] leading-tight">Connexion</p>
            <p className="text-xs text-gray-400">Saisissez votre code personnel</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Code d'accès</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={show ? 'text' : 'password'}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10 bg-gray-50"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="text-red-500 text-xs">❌</span>
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}
          <button type="submit" disabled={!code.trim() || loading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#1F4E79] hover:bg-[#163d61] text-white transition-all disabled:opacity-50">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><LogIn className="w-4 h-4" /> Accéder à mon espace</>}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">Votre code personnel vous a été communiqué par le service RH</p>
      </div>
    </div>
  );
}
