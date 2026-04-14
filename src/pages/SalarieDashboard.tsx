import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, Clock, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';

interface SalarieDashboardProps { nom: string; onLogout: () => void; }
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
interface VarsData { conges:string; maladie:string; transport:string; ndf:string; frais_pro:string; regule:string; primes:string; heures_sup:string; }
const EMPTY: VarsData = { conges:'',maladie:'',transport:'',ndf:'',frais_pro:'',regule:'',primes:'', heures_sup:'' };
const FIELDS: {key:keyof VarsData;label:string;unit:string;color:string;bg:string}[] = [
  {key:'conges',label:'Congés',unit:'j',color:'text-blue-600',bg:'bg-blue-100'},
  {key:'maladie',label:'Maladie',unit:'j',color:'text-orange-600',bg:'bg-orange-100'},
  {key:'transport',label:'Transport',unit:'€',color:'text-green-600',bg:'bg-green-100'},
  {key:'ndf',label:'KM',unit:'km',color:'text-cyan-600',bg:'bg-cyan-100'},
  {key:'frais_pro',label:'Frais pro',unit:'',color:'text-purple-600',bg:'bg-purple-100'},
  {key:'regule',label:'Régul avance',unit:'',color:'text-pink-600',bg:'bg-pink-100'},
  {key:'primes',label:'Primes',unit:'€',color:'text-emerald-600',bg:'bg-emerald-100'},
  {key:'heures_sup',label:'HS à payer',unit:'h',color:'text-amber-600',bg:'bg-amber-100'},
];

export default function SalarieDashboard({ nom, onLogout }: SalarieDashboardProps) {
  const [heures, setHeures] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openMois, setOpenMois] = useState(MOIS[new Date().getMonth()]);
  const [allData, setAllData] = useState<Record<string,VarsData>>({});
  const [saving, setSaving] = useState<Record<string,boolean>>({});
  const [saved, setSaved] = useState<Record<string,boolean>>({});
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: hData }, { data: rows }] = await Promise.all([
        supabase.from('rh_data').select('ndf').eq('salarie_key',nom).eq('mois','__heures__').maybeSingle(),
        supabase.from('rh_data').select('*').eq('salarie_key',nom).neq('mois','__heures__'),
      ]);
      if (hData) setHeures(parseFloat(hData.ndf)||0);
      if (rows) {
        const d: Record<string,VarsData> = {};
        rows.forEach((r:any) => {
          if(r.mois!=='__notes__') d[r.mois] = {
            conges:r.conges||'',
            maladie:r.maladie||'',
            transport:r.transport||'',
            ndf:r.ndf||'',
            frais_pro:r.frais_pro||'',
            regule:r.regule||'',
            primes:r.primes||'',
            heures_sup:r.heures_sup||'',
          };
        });
        setAllData(d);
      }
      // Charger note
      const { data: noteData } = await supabase.from('rh_data').select('notes').eq('salarie_key', nom).eq('mois', '__notes__').maybeSingle();
      if (noteData?.notes) setNote(noteData.notes);
      setLoading(false);
    })();
    const ch = supabase.channel('rh_sal_'+nom)
      .on('postgres_changes',{event:'*',schema:'public',table:'rh_data'},(p:any)=>{
        const r=p.new??p.old; if(!r||r.salarie_key!==nom) return;
        if(r.mois==='__heures__') setHeures(parseFloat(r.ndf)||0);
        if(r.mois==='__notes__' && r.salarie_key===nom) setNote(r.notes||'');
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  },[nom]);

  const getData = (mois:string): VarsData => allData[mois]??{...EMPTY};
  const setField = (mois:string, key:keyof VarsData, val:string) => {
    setAllData(prev=>({...prev,[mois]:{...getData(mois),[key]:val}}));
  };
  const [saveError, setSaveError] = useState<Record<string,string>>({});
  const [noteError, setNoteError] = useState('');

  const saveNote = async () => {
    setSavingNote(true); setNoteError('');
    const { error } = await supabase.from('rh_data').upsert(
      { salarie_key: nom, mois: '__notes__', notes: note },
      { onConflict: 'salarie_key,mois' }
    );
    setSavingNote(false);
    if (error) { setNoteError('Erreur : ' + error.message); }
    else { setSavedNote(true); setTimeout(() => setSavedNote(false), 2500); }
  };

  const handleSave = async (mois:string) => {
    setSaving(p=>({...p,[mois]:true})); setSaveError(p=>({...p,[mois]:''}) );
    const d = getData(mois);
    const { error } = await supabase.from('rh_data').upsert(
      { salarie_key: nom, mois, conges: d.conges, maladie: d.maladie, transport: d.transport, ndf: d.ndf, frais_pro: d.frais_pro, regule: d.regule, primes: d.primes, heures_sup: d.heures_sup },
      { onConflict: 'salarie_key,mois' }
    );
    setSaving(p=>({...p,[mois]:false}));
    if (error) { setSaveError(p=>({...p,[mois]: 'Erreur : ' + error.message})); }
    else { setSaved(p=>({...p,[mois]:true})); setTimeout(()=>setSaved(p=>({...p,[mois]:false})),2000); }
  };

  const totaux = FIELDS.reduce((acc,f)=>{
    acc[f.key]=String(Object.values(allData).reduce((s,d)=>s+(parseFloat((d[f.key] as string)||'0')),0)||0);
    return acc;
  },{} as Record<string,string>);

  if(loading) return (
    <div className="min-h-screen bg-[#f0f4fa] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#1F4E79]/20 border-t-[#1F4E79] rounded-full animate-spin"/>
      <p className="text-sm text-gray-500 font-medium">Chargement de vos données…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F4E79] to-[#2e75b6] text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Espace personnel</p>
            <h1 className="text-lg font-bold mt-0.5">{nom}</h1>
            <p className="text-blue-300 text-xs flex items-center gap-1.5 mt-0.5">
              <Clock size={11}/> {heures.toFixed(2)} h comptabilisées
            </p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs font-medium transition-all">
            <LogOut size={12}/><span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 space-y-4">
        {/* Totaux annuels */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Totaux annuels</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {FIELDS.map(f=>(
              <div key={f.key} className={`${f.bg} rounded-2xl p-3 text-center`}>
                <p className={`text-base font-bold ${f.color}`}>{parseFloat(totaux[f.key]||'0')>0?parseFloat(totaux[f.key]).toFixed(2):'—'}</p>
                <p className="text-xs font-medium opacity-70 leading-tight">{f.label}</p>
                <p className="text-xs opacity-50">{f.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accordéon mensuel */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Données mensuelles</p>
          <div className="space-y-2">
            {MOIS.map(mois=>{
              const d = getData(mois);
              const isOpen = openMois === mois;
              const hasData = FIELDS.some(f=>parseFloat(d[f.key]||'0')>0);
              return (
                <div key={mois} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={()=>setOpenMois(isOpen?'':mois)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-gray-700 text-sm">{mois}</span>
                      {hasData && <span className="w-2 h-2 rounded-full bg-green-400"/>}
                    </div>
                    {isOpen?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </button>

                  {isOpen&&(
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {FIELDS.map(f=>(
                          <div key={f.key}>
                            <label className={`block text-xs font-semibold mb-1 ${f.color} uppercase tracking-wide`}>{f.label} {f.unit&&<span className="font-normal opacity-60">({f.unit})</span>}</label>
                            <input
                              type="text"
                              value={(d[f.key] as string)||''}
                              onChange={e=>setField(mois, f.key, e.target.value)}
                              className="w-full px-3 py-2 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] transition-colors"
                            />
                          </div>
                        ))}
                      </div>

                      {saveError[mois] && <p className="text-xs text-red-500 font-medium">{saveError[mois]}</p>}
                      <button
                        onClick={()=>handleSave(mois)}
                        disabled={saving[mois]}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all w-full justify-center ${saved[mois]?'bg-green-500 text-white':saving[mois]?'bg-gray-300 text-gray-500':'bg-[#1F4E79] hover:bg-[#163d61] text-white'}`}>
                        {saved[mois]?'✓ Sauvegardé !':saving[mois]?'Sauvegarde…':'Sauvegarder'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Note */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Message à l'administration</p>
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare size={15}/>
              <span className="text-sm font-medium">Note libre</span>
            </div>
            <textarea
              value={note}
              onChange={e=>setNote(e.target.value)}
              rows={3}
              placeholder="Écrivez ici votre message ou remarque pour l'administration…"
              className="w-full px-3 py-2.5 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] resize-none transition-colors"
            />
            {noteError && <p className="text-xs text-red-500 font-medium">{noteError}</p>}
            <button
              onClick={saveNote}
              disabled={savingNote}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${savedNote?'bg-green-500 text-white':savingNote?'bg-gray-300 text-gray-500':'bg-[#1F4E79] hover:bg-[#163d61] text-white'}`}>
              <Send size={13}/>{savedNote?'Envoyé !':savingNote?'Envoi…':'Envoyer la note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
