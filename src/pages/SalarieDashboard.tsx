import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, Save, CheckCircle } from 'lucide-react';

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
}

const EMPTY_VARS: VarsData = {
  conges: '', maladie: '', transport: '', km: '', frais_pro: '', regule: '', primes: ''
};

const FIELDS: { key: keyof VarsData; label: string }[] = [
  { key: 'conges', label: 'Congés payés (jours)' },
  { key: 'maladie', label: 'Arrêt maladie (jours)' },
  { key: 'transport', label: 'Remboursement transport (€)' },
  { key: 'km', label: 'Indemnités kilométriques (km)' },
  { key: 'frais_pro', label: 'Frais professionnels (€)' },
  { key: 'regule', label: 'Régularisation / Avance (€)' },
  { key: 'primes', label: 'Primes (€)' },
];

export default function SalarieDashboard({ nom, onLogout }: SalarieDashboardProps) {
  const [selectedMois, setSelectedMois] = useState(MOIS[new Date().getMonth()]);
  const [vars, setVars] = useState<VarsData>(EMPTY_VARS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async (mois: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rh_data')
        .select('*')
        .eq('salarie_key', nom)
        .eq('mois', mois)
        .maybeSingle();
      if (!error && data) {
        setVars({
          conges: data.conges || '',
          maladie: data.maladie || '',
          transport: data.transport || '',
          km: data.km || '',
          frais_pro: data.frais_pro || '',
          regule: data.regule || '',
          primes: data.primes || '',
        });
      } else {
        setVars(EMPTY_VARS);
      }
    } catch {
      setVars(EMPTY_VARS);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(selectedMois); }, [selectedMois, nom]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('rh_data').upsert(
        { salarie_key: nom, mois: selectedMois, ...vars },
        { onConflict: 'salarie_key,mois' }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F4E79] to-[#2e75b6] text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs">Portail Salariés</p>
            <h1 className="text-base font-bold mt-0.5">📋 {nom}</h1>
            <p className="text-blue-300 text-xs">Mis à jour par l'administration</p>
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

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
        {/* Sélecteur de mois */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Sélectionner le mois</p>
          <div className="flex flex-wrap gap-2">
            {MOIS.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMois(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedMois === m
                    ? 'bg-[#1F4E79] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-[#1F4E79] mb-4 text-sm">
            Variables de paie — {selectedMois}
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#1F4E79]/20 border-t-[#1F4E79] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {FIELDS.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={vars[field.key]}
                    onChange={e => setVars(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10 bg-gray-50"
                  />
                </div>
              ))}

              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all mt-2 ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-[#1F4E79] hover:bg-[#163d61] text-white'
                } disabled:opacity-50`}
              >
                {saved ? <><CheckCircle size={16} /> Enregistré !</> : saving ? 'Enregistrement…' : <><Save size={16} /> Enregistrer</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
