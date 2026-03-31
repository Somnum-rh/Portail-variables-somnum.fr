import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, LogOut, RefreshCw, TrendingUp, BarChart2, Settings } from 'lucide-react';

interface RhRow {
  salarie_key: string;
  mois: string;
  conges: string;
  maladie: string;
  transport: string;
  km: string;
  frais_pro: string;
  regule: string;
  primes: string;
}

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

type Tab = 'synthese' | 'collabs' | 'compteurs' | 'gestion';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('synthese');
  const [data, setData] = useState<RhRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtime, setRealtime] = useState(false);
  const [showCodes, setShowCodes] = useState<Record<string,boolean>>({});

  const fetchData = async () => {
    try {
      const { data: rows, error } = await supabase
        .from('rh_data')
        .select('*')
        .neq('mois', '__heures__');
      if (!error && rows) setData(rows as RhRow[]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('rh_admin_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rh_data' }, () => {
        fetchData();
      })
      .subscribe((status) => {
        setRealtime(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getRow = (salarie: string, mois: string): RhRow | undefined =>
    data.find(r => r.salarie_key === salarie && r.mois === mois);

  const filledCount = SALARIES.filter(s =>
    data.some(r => r.salarie_key === s)
  ).length;

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'synthese', label: 'Synthèse', icon: TrendingUp },
    { id: 'collabs', label: 'Synthèse collabs', icon: BarChart2 },
    { id: 'compteurs', label: 'Compteurs', icon: RefreshCw },
    { id: 'gestion', label: 'Gestion collabs', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F4E79] to-[#2e75b6] text-white px-4 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Administration</p>
            <h1 className="text-lg font-bold mt-0.5 flex items-center gap-2">
              <Users size={18} /> VARIABLES - SOMNUM
            </h1>
            <p className="text-blue-300 text-xs">
              {loading ? 'Chargement…' : `${filledCount} / ${SALARIES.length} salariés ont saisi des données`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {realtime && (
              <div className="flex items-center gap-1 bg-green-500/20 rounded-xl px-3 py-1.5 text-xs text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                En direct
              </div>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs font-medium transition-all"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm mb-4 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-[#1F4E79] text-white shadow'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1F4E79]/20 border-t-[#1F4E79] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden pb-4">
            {/* SYNTHÈSE */}
            {tab === 'synthese' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1F4E79] text-white">
                      <th className="text-left px-3 py-3 font-medium sticky left-0 bg-[#1F4E79]">Salarié</th>
                      {MOIS.map(m => <th key={m} className="px-2 py-3 font-medium whitespace-nowrap">{m.slice(0,3)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SALARIES.map((sal, i) => (
                      <tr key={sal} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                        <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-inherit">{sal}</td>
                        {MOIS.map(mois => {
                          const row = getRow(sal, mois);
                          const hasSome = row && Object.values({
                            conges: row.conges, maladie: row.maladie, transport: row.transport,
                            km: row.km, frais_pro: row.frais_pro, regule: row.regule, primes: row.primes
                          }).some(v => v && v !== '0' && v !== '');
                          return (
                            <td key={mois} className="px-2 py-2 text-center">
                              {hasSome
                                ? <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                                : <span className="inline-block w-2 h-2 rounded-full bg-gray-200" />
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SYNTHÈSE COLLABS — SANS colonne Notes */}
            {tab === 'collabs' && (
              <div className="overflow-x-auto">
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
                    {data.filter(r => r.mois !== '__heures__').map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                        <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{row.salarie_key}</td>
                        <td className="px-2 py-2 text-gray-600">{row.mois}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{row.conges || '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{row.maladie || '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{row.transport || '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{row.km || '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{row.frais_pro || '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{row.regule || '-'}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{row.primes || '-'}</td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr><td colSpan={9} className="text-center py-8 text-gray-400">Aucune donnée saisie</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* COMPTEURS */}
            {tab === 'compteurs' && (
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {SALARIES.map(sal => {
                    const rows = data.filter(r => r.salarie_key === sal);
                    const totalConges = rows.reduce((s,r) => s + parseFloat(r.conges||'0'), 0);
                    const totalMaladie = rows.reduce((s,r) => s + parseFloat(r.maladie||'0'), 0);
                    return (
                      <div key={sal} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-xs font-semibold text-[#1F4E79] mb-2 truncate">{sal}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Congés</span>
                            <span className="font-medium text-gray-700">{totalConges || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Maladie</span>
                            <span className="font-medium text-gray-700">{totalMaladie || '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Mois saisis</span>
                            <span className="font-medium text-blue-600">{rows.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GESTION COLLABS */}
            {tab === 'gestion' && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#1F4E79] text-white">
                        <th className="text-left px-3 py-3 font-medium">Salarié</th>
                        <th className="px-3 py-3 font-medium">Code d'accès</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SALARIE_CODES).map(([nom, code], i) => (
                        <tr key={nom} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                          <td className="px-3 py-2 font-medium text-gray-700">{nom}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => setShowCodes(prev => ({ ...prev, [nom]: !prev[nom] }))}
                              className="font-mono text-gray-600 hover:text-[#1F4E79] transition-colors"
                            >
                              {showCodes[nom] ? code : '••••••'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
