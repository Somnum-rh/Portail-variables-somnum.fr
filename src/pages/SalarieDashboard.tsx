import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, Clock, ChevronDown, ChevronUp, Save, CheckCircle } from 'lucide-react';

interface SalarieDashboardProps {
  nom: string;
  onLogout: () => void;
}

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

interface VarsData {
  conges: string;
  maladie: string;
  transport: string;
  ndf: string;       // KM
  frais_pro: string;
  regule: string;
  primes: string;
}

const EMPTY: VarsData = { conges:'', maladie:'', transport:'', ndf:'', frais_pro:'', regule:'', primes:'' };

interface MoisState {
  data: VarsData;
  saving: boolean;
  saved: boolean;
  loading: boolean;
}

export default function SalarieDashboard({ nom, onLogout }: SalarieDashboardProps) {
  const [heures, setHeures] = useState(0);
  const [openMois, setOpenMois] = useState<string>(MOIS[new Date().getMonth()]);
  const [moisStates, setMoisStates] = useState<Record<string, MoisState>>(
    () => Object.fromEntries(MOIS.map(m => [m, { data: { ...EMPTY }, saving: false, saved: false, loading: false }]))
  );
  const [totaux, setTotaux] = useState<VarsData>({ ...EMPTY });

  // Charger compteur heures
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('rh_data').select('ndf').eq('salarie_key', nom).eq('mois', '__heures__').maybeSingle();
      if (data) setHeures(parseFloat(data.ndf) || 0);
    })();
    // Realtime heures
    const ch = supabase.channel('rh_data_heures')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rh_data' }, (payload: any) => {
        const r = payload.new ?? payload.old;
        if (r?.mois === '__heures__' && r?.salarie_key === nom) setHeures(parseFloat(r.ndf) || 0);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [nom]);

  // Charger toutes les données pour les totaux
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('rh_data').select('*').eq('salarie_key', nom).neq('mois', '__heures__');
      if (data && data.length > 0) {
        const tot: VarsData = { ...EMPTY };
        data.forEach((r: any) => {
          (['conges','maladie','transport','ndf','frais_pro','regule','primes'] as (keyof VarsData)[]).forEach(k => {
            const v = parseFloat(r[k] || '0');
            if (v) tot[k] = String((parseFloat(tot[k]||'0') + v).toFixed(2));
          });
        });
        setTotaux(tot);
        // Init moisStates avec les données
        const newStates: Record<string, MoisState> = Object.fromEntries(MOIS.map(m => [m, { data: { ...EMPTY }, saving: false, saved: false, loading: false }]));
        data.forEach((r: any) => {
          if (newStates[r.mois]) {
            newStates[r.mois].data = { conges: r.conges||'', maladie: r.maladie||'', transport: r.transport||'', ndf: r.ndf||'', frais_pro: r.frais_pro||'', regule: r.regule||'', primes: r.primes||'' };
          }
        });
        setMoisStates(newStates);
      }
    })();
  }, [nom]);

  // Charger un mois spécifique à l'ouverture
  const handleToggle = async (mois: string) => {
    if (openMois === mois) { setOpenMois(''); return; }
    setOpenMois(mois);
    setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], loading: true } }));
    const { data } = await supabase.from('rh_data').select('*').eq('salarie_key', nom).eq('mois', mois).maybeSingle();
    setMoisStates(prev => ({
      ...prev,
      [mois]: {
        ...prev[mois],
        loading: false,
        data: data ? { conges: data.conges||'', maladie: data.maladie||'', transport: data.transport||'', ndf: data.ndf||'', frais_pro: data.frais_pro||'', regule: data.regule||'', primes: data.primes||'' } : { ...EMPTY }
      }
    }));
  };

  const handleChange = (mois: string, key: keyof VarsData, value: string) => {
    setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], data: { ...prev[mois].data, [key]: value } } }));
  };

  const handleSave = async (mois: string) => {
    setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], saving: true } }));
    const vars = moisStates[mois].data;
    await supabase.from('rh_data').upsert({ salarie_key: nom, mois, ...vars }, { onConflict: 'salarie_key,mois' });
    setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], saving: false, saved: true } }));
    setTimeout(() => setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], saved: false } })), 2000);
  };

  const inp = "w-full px-3 py-2.5 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10 placeholder-gray-400";
  const lbl = "block text-xs font-medium text-gray-500 mb-1";

  const totCards = [
    { key: 'conges' as keyof VarsData, label: 'Congés', unit: 'j', bg: 'bg-blue-100', color: 'text-blue-600' },
    { key: 'maladie' as keyof VarsData, label: 'Maladie', unit: 'j', bg: 'bg-orange-100', color: 'text-orange-600' },
    { key: 'transport' as keyof VarsData, label: 'Transport', unit: '€', bg: 'bg-green-100', color: 'text-green-600' },
    { key: 'ndf' as keyof VarsData, label: 'KM', unit: '€', bg: 'bg-cyan-100', color: 'text-cyan-600' },
    { key: 'frais_pro' as keyof VarsData, label: 'Frais pro', unit: '', bg: 'bg-purple-100', color: 'text-purple-600' },
    { key: 'regule' as keyof VarsData, label: 'Régul avance', unit: '', bg: 'bg-pink-100', color: 'text-pink-600' },
    { key: 'primes' as keyof VarsData, label: 'Primes', unit: '€', bg: 'bg-emerald-100', color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F4E79] to-[#2e75b6] text-white px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-0.5">Espace Salarié</p>
            <h1 className="text-2xl font-bold">{nom}</h1>
            <p className="text-blue-300 text-sm">Espace personnel</p>
          </div>
          <button onClick={onLogout} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 space-y-5">
        {/* Compteur d'heures */}
        <div className="bg-[#1F4E79] rounded-2xl p-5 text-white flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Clock size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Compteur D'Heures</p>
            <p className="text-4xl font-bold">{heures.toFixed(2)}</p>
            <p className="text-blue-300 text-sm">h</p>
          </div>
          <p className="text-blue-300 text-xs text-right">Mis à jour par<br/>l'administration</p>
        </div>

        {/* Total annuel */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Total Annuel 2026</p>
          <div className="grid grid-cols-4 gap-2">
            {totCards.map(card => (
              <div key={card.key} className={`${card.bg} rounded-2xl p-3 text-center`}>
                <p className={`text-lg font-bold ${card.color}`}>
                  {totaux[card.key] && totaux[card.key] !== '0.00' ? totaux[card.key] : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                {card.unit && <p className="text-xs text-gray-400">{card.unit}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Saisie mensuelle */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Saisie Mensuelle — 2026</p>
          <div className="space-y-2">
            {MOIS.map(mois => {
              const state = moisStates[mois];
              const isOpen = openMois === mois;
              const d = state.data;
              const hasData = Object.values(d).some(v => v !== '' && v !== '0' && v !== '0.00');

              return (
                <div key={mois} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isOpen ? 'ring-2 ring-[#1F4E79]/20' : ''}`}>
                  <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => handleToggle(mois)}>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800">{mois}</span>
                      {hasData && !isOpen && <span className="w-2 h-2 rounded-full bg-green-400" />}
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-[#1F4E79]" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      {state.loading ? (
                        <div className="flex justify-center py-6">
                          <div className="w-6 h-6 border-4 border-[#1F4E79]/20 border-t-[#1F4E79] rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="pt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={lbl}>Congés (jours)</label><input type="text" value={d.conges} onChange={e => handleChange(mois,'conges',e.target.value)} placeholder="0.00" className={inp} /></div>
                            <div><label className={lbl}>Maladie (jours)</label><input type="text" value={d.maladie} onChange={e => handleChange(mois,'maladie',e.target.value)} placeholder="0.00" className={inp} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={lbl}>Transport (€)</label><input type="text" value={d.transport} onChange={e => handleChange(mois,'transport',e.target.value)} placeholder="0.00" className={inp} /></div>
                            <div><label className={lbl}>Km (km)</label><input type="text" value={d.ndf} onChange={e => handleChange(mois,'ndf',e.target.value)} placeholder="0.00" className={inp} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={lbl}>Frais pro (€)</label><input type="text" value={d.frais_pro} onChange={e => handleChange(mois,'frais_pro',e.target.value)} placeholder="0.00" className={inp} /></div>
                            <div><label className={lbl}>Régul avance de frais (€)</label><input type="text" value={d.regule} onChange={e => handleChange(mois,'regule',e.target.value)} placeholder="0.00" className={inp} /></div>
                          </div>
                          <div><label className={lbl}>Primes (€)</label><input type="text" value={d.primes} onChange={e => handleChange(mois,'primes',e.target.value)} placeholder="0.00" className={inp} /></div>
                          <div className="flex justify-end pt-1">
                            <button onClick={() => handleSave(mois)} disabled={state.saving}
                              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${state.saved ? 'bg-green-500 text-white' : 'bg-[#1F4E79] hover:bg-[#163d61] text-white'} disabled:opacity-50`}>
                              {state.saved ? <><CheckCircle size={15}/>Enregistré !</> : state.saving ? 'Enregistrement…' : <><Save size={15}/>Sauvegarder</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
