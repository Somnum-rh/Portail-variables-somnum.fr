import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, Save, CheckCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface SalarieDashboardProps {
  nom: string;
  onLogout: () => void;
}

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

interface VarsData {
  conges: string;
  maladie: string;
  transport: string;
  km: string;
  frais_pro: string;
  regule: string;
  primes: string;
  heures_sup: string;
  heures_abs: string;
}

const EMPTY_VARS: VarsData = {
  conges: '', maladie: '', transport: '', km: '',
  frais_pro: '', regule: '', primes: '',
  heures_sup: '', heures_abs: ''
};

interface MoisState {
  data: VarsData;
  saving: boolean;
  saved: boolean;
  loading: boolean;
}

export default function SalarieDashboard({ nom, onLogout }: SalarieDashboardProps) {
  const [openMois, setOpenMois] = useState<string>(MOIS[new Date().getMonth()]);
  const [moisStates, setMoisStates] = useState<Record<string, MoisState>>(() =>
    Object.fromEntries(MOIS.map(m => [m, { data: { ...EMPTY_VARS }, saving: false, saved: false, loading: false }]))
  );

  const fetchMois = async (mois: string) => {
    setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], loading: true } }));
    try {
      const { data, error } = await supabase
        .from('rh_data')
        .select('*')
        .eq('salarie_key', nom)
        .eq('mois', mois)
        .maybeSingle();
      if (!error && data) {
        setMoisStates(prev => ({
          ...prev,
          [mois]: {
            ...prev[mois],
            loading: false,
            data: {
              conges: data.conges || '',
              maladie: data.maladie || '',
              transport: data.transport || '',
              km: data.km || '',
              frais_pro: data.frais_pro || '',
              regule: data.regule || '',
              primes: data.primes || '',
              heures_sup: data.heures_sup || '',
              heures_abs: data.heures_abs || '',
            }
          }
        }));
      } else {
        setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], loading: false, data: { ...EMPTY_VARS } } }));
      }
    } catch {
      setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], loading: false } }));
    }
  };

  useEffect(() => {
    fetchMois(openMois);
  }, [openMois]);

  const handleToggle = (mois: string) => {
    if (openMois === mois) {
      setOpenMois('');
    } else {
      setOpenMois(mois);
    }
  };

  const handleChange = (mois: string, key: keyof VarsData, value: string) => {
    setMoisStates(prev => ({
      ...prev,
      [mois]: { ...prev[mois], data: { ...prev[mois].data, [key]: value } }
    }));
  };

  const handleSave = async (mois: string) => {
    setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], saving: true } }));
    try {
      const vars = moisStates[mois].data;
      await supabase.from('rh_data').upsert(
        { salarie_key: nom, mois, ...vars },
        { onConflict: 'salarie_key,mois' }
      );
      setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], saving: false, saved: true } }));
      setTimeout(() => setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], saved: false } })), 2000);
    } catch {
      setMoisStates(prev => ({ ...prev, [mois]: { ...prev[mois], saving: false } }));
    }
  };

  const inp = "w-full px-3 py-2.5 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10 placeholder-gray-400";
  const lbl = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F4E79] to-[#2e75b6] text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs">VARIABLES - SOMNUM</p>
            <h1 className="text-base font-bold mt-0.5">📋 {nom}</h1>
            <p className="text-blue-300 text-xs">Portail Salariés</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs font-medium transition-all"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 space-y-3">
        {MOIS.map(mois => {
          const state = moisStates[mois];
          const isOpen = openMois === mois;
          const d = state.data;
          const hasData = Object.values(d).some(v => v !== '');

          return (
            <div
              key={mois}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all ${isOpen ? 'ring-2 ring-[#1F4E79]/30' : ''}`}
            >
              {/* En-tête accordéon */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => handleToggle(mois)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 text-sm">{mois}</span>
                  {hasData && !isOpen && (
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                  )}
                </div>
                {isOpen ? <ChevronUp size={16} className="text-[#1F4E79]" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {/* Contenu dépliable */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  {state.loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-4 border-[#1F4E79]/20 border-t-[#1F4E79] rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="pt-4 space-y-3">

                      {/* Compteur d'heures */}
                      <div className="bg-blue-50 rounded-xl p-3 mb-2 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={14} className="text-[#1F4E79]" />
                          <span className="text-xs font-semibold text-[#1F4E79] uppercase tracking-wide">Compteur d'heures</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lbl}>Heures supplémentaires</label>
                            <input
                              type="text"
                              value={d.heures_sup}
                              onChange={e => handleChange(mois, 'heures_sup', e.target.value)}
                              placeholder="0.00"
                              className={inp}
                            />
                          </div>
                          <div>
                            <label className={lbl}>Heures d'absence</label>
                            <input
                              type="text"
                              value={d.heures_abs}
                              onChange={e => handleChange(mois, 'heures_abs', e.target.value)}
                              placeholder="0.00"
                              className={inp}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Congés / Maladie */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Congés (jours)</label>
                          <input type="text" value={d.conges} onChange={e => handleChange(mois, 'conges', e.target.value)} placeholder="0.00" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Maladie (jours)</label>
                          <input type="text" value={d.maladie} onChange={e => handleChange(mois, 'maladie', e.target.value)} placeholder="0.00" className={inp} />
                        </div>
                      </div>

                      {/* Transport / KM */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Transport (€)</label>
                          <input type="text" value={d.transport} onChange={e => handleChange(mois, 'transport', e.target.value)} placeholder="0.00" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Km (km)</label>
                          <input type="text" value={d.km} onChange={e => handleChange(mois, 'km', e.target.value)} placeholder="0.00" className={inp} />
                        </div>
                      </div>

                      {/* Frais pro / Régul */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Frais pro (€)</label>
                          <input type="text" value={d.frais_pro} onChange={e => handleChange(mois, 'frais_pro', e.target.value)} placeholder="0.00" className={inp} />
                        </div>
                        <div>
                          <label className={lbl}>Régul avance de frais (€)</label>
                          <input type="text" value={d.regule} onChange={e => handleChange(mois, 'regule', e.target.value)} placeholder="0.00" className={inp} />
                        </div>
                      </div>

                      {/* Primes */}
                      <div>
                        <label className={lbl}>Primes (€)</label>
                        <input type="text" value={d.primes} onChange={e => handleChange(mois, 'primes', e.target.value)} placeholder="0.00" className={inp} />
                      </div>

                      {/* Bouton sauvegarder */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleSave(mois)}
                          disabled={state.saving}
                          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                            state.saved
                              ? 'bg-green-500 text-white'
                              : 'bg-[#1F4E79] hover:bg-[#163d61] text-white'
                          } disabled:opacity-50`}
                        >
                          {state.saved
                            ? <><CheckCircle size={15} /> Enregistré !</>
                            : state.saving
                            ? 'Enregistrement…'
                            : <><Save size={15} /> Sauvegarder</>
                          }
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
  );
}
