import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, LogOut, Clock, CheckCircle } from 'lucide-react';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const SALARIE_CODES: Record<string,string> = {
  "Cuisinier Céline":"482951","Salarié 02":"739204","Salarié 03":"156873",
  "Salarié 04":"924017","Salarié 05":"371485","Salarié 06":"608342",
  "Salarié 07":"219756","Salarié 08":"847293","Salarié 09":"563018",
  "Salarié 10":"431679","Salarié 11":"987025","Salarié 12":"264803",
  "Salarié 13":"718946","Salarié 14":"395271","Salarié 15":"842630",
  "Salarié 16":"157489","Salarié 17":"630247","Salarié 18":"492815",
  "Salarié 19":"873561","Salarié 20":"345098","Salarié 21":"761234",
  "Salarié 22":"508976","Salarié 23":"234817","Salarié 24":"916053",
  "Salarié 25":"673481","Salarié 26":"189327","Salarié 27":"547902",
  "Salarié 28":"823465","Salarié 29":"410793","Salarié 30":"962148",
  "Salarié 31":"285730","Salarié 32":"714896","Salarié 33":"439025",
  "Salarié 34":"597384","Salarié 35":"163749","Salarié 36":"820416",
  "Salarié 37":"375892","Salarié 38":"649203","Salarié 39":"917530",
  "Salarié 40":"283647","Salarié 41":"504918","Salarié 42":"761385",
  "Salarié 43":"428071","Salarié 44":"895364","Salarié 45":"137926",
  "Salarié 46":"604851","Salarié 47":"392748","Salarié 48":"819043",
  "Salarié 49":"256739","Salarié 50":"473862"
};
const SALARIES = Object.keys(SALARIE_CODES);

interface RhRow { salarie_key: string; mois: string; conges: string; maladie: string; transport: string; ndf: string; frais_pro: string; regule: string; primes: string; }

type Tab = 'synthese' | 'collabs' | 'compteurs';

interface AdminDashboardProps { onLogout: () => void; }

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('synthese');
  const [data, setData] = useState<RhRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtime, setRealtime] = useState(false);
  // Compteur heures : { [salarie]: valeur string }
  const [heures, setHeures] = useState<Record<string,string>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [savedMap, setSavedMap] = useState<Record<string,boolean>>({});
  const cancelRef = useRef(false);

  const fetchData = async () => {
    try {
      const { data: rows } = await supabase.from('rh_data').select('*').neq('mois','__heures__');
      if (rows) setData(rows as RhRow[]);
    } catch {}
    setLoading(false);
  };

  const fetchHeures = async () => {
    try {
      const { data: rows } = await supabase.from('rh_data').select('salarie_key, ndf').eq('mois','__heures__');
      if (rows) {
        const h: Record<string,string> = {};
        rows.forEach((r: any) => { h[r.salarie_key] = String(parseFloat(r.ndf)||0); });
        setHeures(prev => {
          const merged = { ...prev };
          Object.entries(h).forEach(([k,v]) => { if (!(k in merged) || merged[k] === '') merged[k] = v; });
          return merged;
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetchHeures();
    const ch = supabase.channel('rh_admin_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rh_data' }, () => { fetchData(); fetchHeures(); })
      .subscribe((s: string) => setRealtime(s === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filledCount = SALARIES.filter(s => data.some(r => r.salarie_key === s)).length;
  const totalHeures = SALARIES.reduce((sum, s) => sum + (parseFloat(heures[s]||'0')), 0);

  const getRow = (sal: string, mois: string) => data.find(r => r.salarie_key === sal && r.mois === mois);

  const saveOneHeures = async (sal: string) => {
    const val = heures[sal] || '0';
    await supabase.from('rh_data').upsert({ salarie_key: sal, mois: '__heures__', ndf: val }, { onConflict: 'salarie_key,mois' });
    setSavedMap(prev => ({ ...prev, [sal]: true }));
    setTimeout(() => setSavedMap(prev => ({ ...prev, [sal]: false })), 2000);
  };

  const saveAllHeures = async () => {
    setSavingAll(true);
    cancelRef.current = false;
    for (const sal of SALARIES) {
      if (cancelRef.current) break;
      await saveOneHeures(sal);
    }
    setSavingAll(false);
    setSavedAll(true);
    setTimeout(() => setSavedAll(false), 2000);
  };

  const tabs = [
    { id: 'synthese' as Tab, label: 'Synthèse', icon: '📊' },
    { id: 'collabs' as Tab, label: 'Synthèse collabs', icon: '👥' },
    { id: 'compteurs' as Tab, label: 'Compteurs', icon: '🕐' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F4E79] to-[#2e75b6] text-white px-4 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Administration</p>
            <h1 className="text-lg font-bold mt-0.5 flex items-center gap-2"><Users size={18}/> VARIABLES - SOMNUM</h1>
            <p className="text-blue-300 text-xs">{loading ? 'Chargement…' : `${filledCount} / ${SALARIES.length} salariés ont saisi des données`}</p>
          </div>
          <div className="flex items-center gap-2">
            {realtime && (
              <div className="flex items-center gap-1 bg-green-500/20 rounded-xl px-3 py-1.5 text-xs text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>En direct
              </div>
            )}
            <button onClick={onLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs font-medium transition-all">
              <LogOut size={13}/><span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4 pb-10">
        {/* Onglets */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm mb-4 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-[#1F4E79] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1F4E79]/20 border-t-[#1F4E79] rounded-full animate-spin"/>
          </div>
        ) : (
          <>
            {/* SYNTHÈSE */}
            {tab === 'synthese' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1F4E79] text-white">
                      <th className="text-left px-3 py-3 font-medium sticky left-0 bg-[#1F4E79]">Salarié</th>
                      {MOIS.map(m => <th key={m} className="px-2 py-3 font-medium whitespace-nowrap">{m.slice(0,3)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SALARIES.map((sal,i) => (
                      <tr key={sal} className={i%2===0?'bg-white':'bg-blue-50/30'}>
                        <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-inherit">{sal}</td>
                        {MOIS.map(mois => {
                          const row = getRow(sal, mois);
                          const has = row && ['conges','maladie','transport','ndf','frais_pro','regule','primes'].some(k => (row as any)[k] && (row as any)[k] !== '0');
                          return <td key={mois} className="px-2 py-2 text-center">{has ? <span className="inline-block w-2 h-2 rounded-full bg-green-400"/> : <span className="inline-block w-2 h-2 rounded-full bg-gray-200"/>}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SYNTHÈSE COLLABS — SANS Notes */}
            {tab === 'collabs' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1F4E79] text-white">
                      <th className="text-left px-3 py-3 font-medium">Salarié</th>
                      <th className="px-2 py-3 font-medium">Mois</th>
                      <th className="px-2 py-3 font-medium">Congés</th>
                      <th className="px-2 py-3 font-medium">Maladie</th>
                      <th className="px-2 py-3 font-medium">Transport</th>
                      <th className="px-2 py-3 font-medium">KM</th>
                      <th className="px-2 py-3 font-medium">Frais pro</th>
                      <th className="px-2 py-3 font-medium">Régul</th>
                      <th className="px-2 py-3 font-medium">Primes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-gray-400">Aucune donnée saisie</td></tr>}
                    {data.map((row,i) => (
                      <tr key={i} className={i%2===0?'bg-white':'bg-blue-50/30'}>
                        <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{row.salarie_key}</td>
                        <td className="px-2 py-2 text-gray-600">{row.mois}</td>
                        <td className="px-2 py-2 text-center">{row.conges||'-'}</td>
                        <td className="px-2 py-2 text-center">{row.maladie||'-'}</td>
                        <td className="px-2 py-2 text-center">{row.transport||'-'}</td>
                        <td className="px-2 py-2 text-center">{row.ndf||'-'}</td>
                        <td className="px-2 py-2 text-center">{row.frais_pro||'-'}</td>
                        <td className="px-2 py-2 text-center">{row.regule||'-'}</td>
                        <td className="px-2 py-2 text-center">{row.primes||'-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* COMPTEURS D'HEURES */}
            {tab === 'compteurs' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Compteurs D'Heures</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Saisissez et sauvegardez les compteurs directement</p>
                </div>
                <button onClick={saveAllHeures} disabled={savingAll}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${savedAll ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-70`}>
                  <CheckCircle size={15}/>{savedAll ? 'Tout sauvegardé !' : savingAll ? 'Sauvegarde…' : 'Tout sauvegarder'}
                </button>

                {/* Total */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Clock size={20} className="text-indigo-600"/>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-500 font-medium">Total tous collaborateurs</p>
                    <p className="text-2xl font-bold text-indigo-700">{totalHeures.toFixed(2)} h</p>
                  </div>
                </div>

                {/* Tableau */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#1F4E79] text-white">
                        <th className="text-left px-4 py-3 font-semibold">Collaborateur</th>
                        <th className="px-4 py-3 font-semibold text-center">Heures</th>
                        <th className="px-4 py-3 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SALARIES.map((sal,i) => (
                        <tr key={sal} className={i%2===0?'bg-white':'bg-gray-50/50'}>
                          <td className="px-4 py-3 font-medium text-gray-700">{sal}</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="text"
                                value={heures[sal] ?? '0'}
                                onChange={e => setHeures(prev => ({ ...prev, [sal]: e.target.value }))}
                                className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:border-[#1F4E79] bg-[#f0f4fa] font-medium"
                              />
                              <span className="text-gray-400 text-sm">h</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => saveOneHeures(sal)}
                              className={`flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all ${savedMap[sal] ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                              <CheckCircle size={13}/>{savedMap[sal] ? 'Sauvé !' : 'Sauver'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
