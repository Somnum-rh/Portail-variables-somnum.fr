import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LogOut, Clock, ChevronDown, ChevronUp, MessageSquare, Send } from 'lucide-react';

interface SalarieDashboardProps { nom: string; onLogout: () => void; }
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
interface VarsData { conges:string; maladie:string; transport:string; ndf:string; frais_pro:string; regule:string; primes:string; }
const EMPTY: VarsData = { conges:'',maladie:'',transport:'',ndf:'',frais_pro:'',regule:'',primes:'' };
const FIELDS: {key:keyof VarsData;label:string;unit:string;color:string;bg:string}[] = [
  {key:'conges',label:'Congés',unit:'j',color:'text-blue-600',bg:'bg-blue-100'},
  {key:'maladie',label:'Maladie',unit:'j',color:'text-orange-600',bg:'bg-orange-100'},
  {key:'transport',label:'Transport',unit:'€',color:'text-green-600',bg:'bg-green-100'},
  {key:'ndf',label:'KM',unit:'€',color:'text-cyan-600',bg:'bg-cyan-100'},
  {key:'frais_pro',label:'Frais pro',unit:'',color:'text-purple-600',bg:'bg-purple-100'},
  {key:'regule',label:'Régul avance',unit:'',color:'text-pink-600',bg:'bg-pink-100'},
  {key:'primes',label:'Primes',unit:'€',color:'text-emerald-600',bg:'bg-emerald-100'},
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
        rows.forEach((r:any) => { if(r.mois!=='__notes__') d[r.mois] = {conges:r.conges||'',maladie:r.maladie||'',transport:r.transport||'',ndf:r.ndf||'',frais_pro:r.frais_pro||'',regule:r.regule||'',primes:r.primes||''}; });
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
    const payload: Record<string,string> = {
      salarie_key: nom, mois,
      conges: d.conges, maladie: d.maladie, transport: d.transport,
      ndf: d.ndf, regule: d.regule, primes: d.primes
    };
    // frais_pro : inclus seulement si la colonne existe (on essaie toujours)
    const fullPayload = { ...payload, frais_pro: d.frais_pro };
    let { error } = await supabase.from('rh_data').upsert(fullPayload, { onConflict: 'salarie_key,mois' });
    if (error && error.message.includes('frais_pro')) {
      // Colonne absente : on sauvegarde sans frais_pro
      ({ error } = await supabase.from('rh_data').upsert(payload, { onConflict: 'salarie_key,mois' }));
    }
    setSaving(p=>({...p,[mois]:false}));
    if (error) { setSaveError(p=>({...p,[mois]: 'Erreur : ' + error!.message})); }
    else { setSaved(p=>({...p,[mois]:true})); setTimeout(()=>setSaved(p=>({...p,[mois]:false})),2000); }
  };

  const totaux = FIELDS.reduce((acc,f)=>{
    acc[f.key]=String(Object.values(allData).reduce((s,d)=>s+(parseFloat(d[f.key]||'0')),0)||0);
    return acc;
  },{} as VarsData);

  if(loading) return (
    <div className="min-h-screen bg-[#f0f4fa] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-[#1F4E79]/20 border-t-[#1F4E79] rounded-full animate-spin"/>
      <p className="text-sm text-gray-500">Chargement de vos données…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      <div className="bg-[#1F4E79] text-white px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Espace salarié</p>
            <p className="text-lg font-bold mt-0.5">{nom}</p>
            <p className="text-blue-300 text-xs">Espace personnel</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-sm font-medium transition-all">
            <LogOut size={14}/><span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* Compteur d'heures */}
        <div className="bg-[#1F4E79] rounded-2xl p-4 flex items-center gap-4 shadow-md mb-5">
          <div className="bg-white/20 rounded-xl p-3">
            <Clock className="text-white w-6 h-6"/>
          </div>
          <div className="flex-1">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Compteur d'heures</p>
            <p className="text-white text-3xl font-bold mt-0.5">{heures.toFixed(2)}</p>
            <p className="text-lg font-medium text-blue-200">h</p>
          </div>
          <div className="text-right">
            <p className="text-blue-300 text-xs">Mis à jour par l'administration</p>
          </div>
        </div>

        {/* Total annuel */}
        <div className="px-0 pt-0 pb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Total annuel</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {FIELDS.map(f=>(
              <div key={f.key} className={`${f.bg} rounded-2xl p-3 text-center`}>
                <p className={`text-lg font-bold ${f.color}`}>{parseFloat(totaux[f.key]||'0')>0?totaux[f.key]:'—'}</p>
                <p className="text-xs font-medium opacity-70">{f.label}</p>
                {f.unit&&<p className="text-xs opacity-60">{f.unit}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Saisie mensuelle */}
      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-2 mt-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Saisie mensuelle — {new Date().getFullYear()}</p>
        {MOIS.map(mois=>{
          const isOpen=openMois===mois;
          const d=getData(mois);
          const hasData=Object.values(d).some(v=>v&&v!=='0'&&v!=='0.00');
          return (
            <div key={mois} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors" onClick={()=>setOpenMois(isOpen?'':mois)}>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 text-sm">{mois}</span>
                  {mois===MOIS[new Date().getMonth()]&&<span className="ml-2 text-xs bg-[#1F4E79] text-white px-2 py-0.5 rounded-full">en cours</span>}
                  {hasData&&mois!==MOIS[new Date().getMonth()]&&<span className="text-xs text-green-600 font-medium">✓ Renseigné</span>}
                </div>
                <span className="text-gray-400">{isOpen?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</span>
              </button>
              {isOpen&&(
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {FIELDS.map(f=>(
                        <div key={f.key} className={f.key==='primes'?'col-span-2 sm:col-span-1':''}>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            {f.label} <span className="text-gray-400 font-normal ml-1">({f.unit})</span>
                          </label>
                          <input type="text" value={d[f.key]} onChange={e=>setField(mois,f.key,e.target.value)} placeholder="0.00"
                            className="w-full px-3 py-2 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79]"/>
                        </div>
                      ))}
                    </div>
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        {saveError[mois] && <p className="text-xs text-red-500 font-medium">❌ {saveError[mois]}</p>}
                        <button onClick={()=>handleSave(mois)} disabled={saving[mois]}
                          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ml-auto ${saved[mois]?'bg-green-500 text-white':saveError[mois]?'bg-red-500 text-white':saving[mois]?'bg-gray-200 text-gray-500':'bg-[#1F4E79] hover:bg-[#163d61] text-white'}`}>
                          {saving[mois]?<span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"/>:null}
                          {saved[mois]?'✓ Enregistré':saveError[mois]?'✗ Réessayer':saving[mois]?'…':'Sauvegarder'}
                        </button>
                      </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Notes partagées */}
      <div className="max-w-2xl mx-auto px-4 pb-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare size={15} className="text-[#1F4E79]" />
            <span className="font-semibold text-gray-800 text-sm">Mes notes</span>
            <span className="ml-auto text-xs text-gray-400">Partagées avec l'administration</span>
          </div>
          <div className="px-4 py-4">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Saisissez vos remarques, questions ou informations à transmettre à l'administration…"
              rows={5}
              className="w-full px-3 py-2.5 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] resize-none placeholder-gray-400"
            />
      <div className="flex justify-end mt-2">
        <div className="flex flex-col items-end gap-1">
          {noteError && <p className="text-xs text-red-500 font-medium">❌ {noteError}</p>}
          <button onClick={saveNote} disabled={savingNote}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${savedNote ? 'bg-green-500 text-white' : noteError ? 'bg-red-500 text-white' : savingNote ? 'bg-gray-200 text-gray-500' : 'bg-[#1F4E79] hover:bg-[#163d61] text-white'}`}>
            {savingNote ? <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" /> : <Send size={13} />}
            {savedNote ? '✓ Note enregistrée' : noteError ? '✗ Réessayer' : savingNote ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
          </div>
        </div>
      </div>
      <p className="text-center text-blue-300/50 text-xs mt-2 pb-4">© VARIABLES - SOMNUM</p>
    </div>
  );
}
