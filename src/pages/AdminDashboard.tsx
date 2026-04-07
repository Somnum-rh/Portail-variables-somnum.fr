import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, LogOut, AlertTriangle, CheckCircle, Clock, MessageSquare, UserPlus, Trash2, Copy, Pencil, Check, X, Search, Filter } from 'lucide-react';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const SALARIE_CODES: Record<string,string> = {
  "Cuisinier Céline":"482951","Salarié 02":"739204","Salarié 03":"156873","Salarié 04":"924017","Salarié 05":"371485","Salarié 06":"608342","Salarié 07":"219756","Salarié 08":"847293","Salarié 09":"563018","Salarié 10":"431679","Salarié 11":"987025","Salarié 12":"264803","Salarié 13":"718946","Salarié 14":"395271","Salarié 15":"842630","Salarié 16":"157489","Salarié 17":"630247","Salarié 18":"492815","Salarié 19":"873561","Salarié 20":"345098","Salarié 21":"761234","Salarié 22":"508976","Salarié 23":"234817","Salarié 24":"916053","Salarié 25":"673481","Salarié 26":"189327","Salarié 27":"547902","Salarié 28":"823465","Salarié 29":"410793","Salarié 30":"962148","Salarié 31":"285730","Salarié 32":"714896","Salarié 33":"439025","Salarié 34":"597384","Salarié 35":"163749","Salarié 36":"820416","Salarié 37":"375892","Salarié 38":"649203","Salarié 39":"917530","Salarié 40":"283647","Salarié 41":"504918","Salarié 42":"761385","Salarié 43":"428071","Salarié 44":"895364","Salarié 45":"137926","Salarié 46":"604851","Salarié 47":"392748","Salarié 48":"819043","Salarié 49":"256739","Salarié 50":"473862"
};
const SALARIES = Object.keys(SALARIE_CODES);
const DEFAULT_CODES = { ...SALARIE_CODES };

interface RhRow { salarie_key:string; mois:string; conges:string; maladie:string; transport:string; ndf:string; frais_pro:string; regule:string; primes:string; }
type Tab = 'synthese'|'collabs'|'compteurs'|'codes'|'notes';
interface AdminDashboardProps { onLogout:()=>void; }

const FIELDS: {key:keyof Omit<RhRow,'salarie_key'|'mois'>;label:string;unit:string;color:string;bg:string}[] = [
  {key:'conges',label:'Congés',unit:'j',color:'text-blue-700',bg:'bg-blue-100'},
  {key:'maladie',label:'Maladie',unit:'j',color:'text-orange-700',bg:'bg-orange-100'},
  {key:'transport',label:'Transport',unit:'€',color:'text-green-700',bg:'bg-green-100'},
  {key:'ndf',label:'KM',unit:'km',color:'text-cyan-700',bg:'bg-cyan-100'},
  {key:'frais_pro',label:'Frais pro',unit:'€',color:'text-purple-700',bg:'bg-purple-100'},
  {key:'regule',label:'Régul',unit:'€',color:'text-pink-700',bg:'bg-pink-100'},
  {key:'primes',label:'Primes',unit:'€',color:'text-emerald-700',bg:'bg-emerald-100'},
];

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('synthese');
  const [data, setData] = useState<RhRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtime, setRealtime] = useState(false);
  const [heures, setHeures] = useState<Record<string,string>>({});
  const [savedH, setSavedH] = useState<Record<string,boolean>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [selectedSal, setSelectedSal] = useState<string|null>(null);
  const [dynCodes, setDynCodes] = useState<Record<string,string>>(SALARIE_CODES);
  const [dynSocietes, setDynSocietes] = useState<Record<string,string>>({});
  const [newNom, setNewNom] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newSociete, setNewSociete] = useState('');
  const [addingCollab, setAddingCollab] = useState(false);
  const [addMsg, setAddMsg] = useState('');
  const [deletingCollab, setDeletingCollab] = useState<string|null>(null);
  const [copiedCode, setCopiedCode] = useState<string|null>(null);
  const [filterSociete, setFilterSociete] = useState<string|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbOk, setDbOk] = useState<boolean|null>(null);
  const [allNotes, setAllNotes] = useState<Record<string,string>>({});

  // États édition inline
  const [editingCollab, setEditingCollab] = useState<string|null>(null);
  const [editNom, setEditNom] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editSociete, setEditSociete] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchCodes = async () => {
    try {
      const { data: rows } = await supabase.from('rh_codes').select('salarie_key, code, societe');
      if (rows && rows.length > 0) {
        const m: Record<string,string> = { ...DEFAULT_CODES };
        const s: Record<string,string> = {};
        rows.forEach((r:any) => { m[r.salarie_key] = r.code; if (r.societe) s[r.salarie_key] = r.societe; });
        setDynCodes(m);
        setDynSocietes(s);
      }
    } catch {}
  };

  const fetchData = async () => {
    try {
      const { data: rows, error } = await supabase.from('rh_data').select('*').neq('mois','__heures__').neq('mois','__notes__');
      if (error) { setDbOk(false); setLoading(false); return; }
      setDbOk(true);
      if (rows) setData(rows as RhRow[]);
    } catch { setDbOk(false); }
    setLoading(false);
  };
  const fetchHeures = async () => {
    try {
      const { data: rows } = await supabase.from('rh_data').select('salarie_key,ndf').eq('mois','__heures__');
      if (rows) {
        setHeures(prev => {
          const m = { ...prev };
          rows.forEach((r:any) => { m[r.salarie_key] = String(parseFloat(r.ndf)||0); });
          return m;
        });
      }
    } catch {}
  };
  const fetchNotes = async () => {
    try {
      const { data: rows } = await supabase.from('rh_data').select('salarie_key, notes').eq('mois', '__notes__');
      if (rows) {
        const m: Record<string,string> = {};
        rows.forEach((r: any) => { if (r.notes) m[r.salarie_key] = r.notes; });
        setAllNotes(m);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCodes(); fetchData(); fetchHeures(); fetchNotes();
    const ch = supabase.channel('rh_admin')
      .on('postgres_changes',{event:'*',schema:'public',table:'rh_data'},()=>{fetchData();fetchHeures();fetchNotes();})
      .subscribe(s=>setRealtime(s==='SUBSCRIBED'));
    return ()=>{ supabase.removeChannel(ch); };
  },[]);

  const filledCount = SALARIES.filter(s=>data.some(r=>r.salarie_key===s)).length;
  const totalHeures = SALARIES.reduce((sum,s)=>sum+(parseFloat(heures[s]||'0')),0);

  const SALARIES_DYN = Object.keys(dynCodes);

  const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

  const startEdit = (sal: string) => {
    setEditingCollab(sal);
    setEditNom(sal);
    setEditCode(dynCodes[sal] || '');
    setEditSociete(dynSocietes[sal] || '');
  };

  const saveEdit = async (oldSal: string) => {
    const nom = editNom.trim();
    const code = editCode.trim() || genCode();
    const societe = editSociete.trim();
    if (!nom) return;
    setSavingEdit(true);
    try {
      // Si le nom a changé : supprimer l'ancien, insérer le nouveau
      if (nom !== oldSal) {
        await supabase.from('rh_codes').delete().eq('salarie_key', oldSal);
        await supabase.from('rh_data').update({ salarie_key: nom }).eq('salarie_key', oldSal);
      }
      await supabase.from('rh_codes').upsert({ salarie_key: nom, code, societe }, { onConflict: 'salarie_key' });
      // Mettre à jour l'état local
      setDynCodes(prev => {
        const n = { ...prev };
        if (nom !== oldSal) delete n[oldSal];
        n[nom] = code;
        return n;
      });
      setDynSocietes(prev => {
        const n = { ...prev };
        if (nom !== oldSal) delete n[oldSal];
        n[nom] = societe;
        return n;
      });
      setEditingCollab(null);
    } catch {}
    setSavingEdit(false);
  };

  const addCollab = async () => {
    const nom = newNom.trim();
    const code = newCode.trim() || genCode();
    const soc = newSociete.trim();
    if (!nom) return;
    setAddingCollab(true);
    try {
      await supabase.from('rh_codes').upsert({ salarie_key: nom, code, societe: soc || null }, { onConflict: 'salarie_key' });
      setDynCodes(prev => ({ ...prev, [nom]: code }));
      setDynSocietes(prev => soc ? { ...prev, [nom]: soc } : prev);
      setNewNom(''); setNewCode(''); setNewSociete('');
      setAddMsg(`✓ ${nom} ajouté avec le code ${code}`);
      setTimeout(() => setAddMsg(''), 3500);
    } catch {}
    setAddingCollab(false);
  };

  const deleteCollab = async (sal: string) => {
    if (!window.confirm(`Supprimer ${sal} et toutes ses données ?`)) return;
    setDeletingCollab(sal);
    try {
      await supabase.from('rh_codes').delete().eq('salarie_key', sal);
      await supabase.from('rh_data').delete().eq('salarie_key', sal);
      setDynCodes(prev => { const n = { ...prev }; delete n[sal]; return n; });
    } catch {}
    setDeletingCollab(null);
    if (selectedSal === sal) setSelectedSal(null);
  };

  const copyCode = (code: string, sal: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(sal);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const getRow = (sal:string,mois:string) => data.find(r=>r.salarie_key===sal&&r.mois===mois);
  const totaux = FIELDS.reduce((acc,f)=>{
    acc[f.key as string] = data.reduce((s,r)=>s+(parseFloat(r[f.key as keyof RhRow]||'0')||0),0);
    return acc;
  },{} as Record<string,number>);

  const saveH = async (sal:string) => {
    const val = heures[sal]||'0';
    await supabase.from('rh_data').upsert({salarie_key:sal,mois:'__heures__',ndf:val},{onConflict:'salarie_key,mois'});
    setSavedH(p=>({...p,[sal]:true}));
    setTimeout(()=>setSavedH(p=>({...p,[sal]:false})),2000);
  };
  const saveAllH = async () => {
    setSavingAll(true);
    for(const sal of SALARIES) await saveH(sal);
    setSavingAll(false); setSavedAll(true);
    setTimeout(()=>setSavedAll(false),2000);
  };

  const TABS = [
    {id:'synthese' as Tab,label:'📊 Synthèse'},
    {id:'collabs' as Tab,label:'👥 Synthèse collabs'},
    {id:'compteurs' as Tab,label:'⏱ Compteurs'},
    {id:'codes' as Tab,label:'🔑 Gestion collabs'},
    {id:'notes' as Tab,label:'💬 Notes'},
  ];

  const societes = [...new Set(Object.values(dynSocietes).filter(Boolean))].sort();
  const SALARIES_SORTED = [...SALARIES_DYN].sort((a, b) => a.localeCompare(b, 'fr'));
  const filteredSalaries = SALARIES_SORTED
    .filter(s => !filterSociete || dynSocietes[s] === filterSociete)
    .filter(s => !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase()) || (dynSocietes[s]||'').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f0f4fa]">
      <div className="bg-gradient-to-r from-[#1F4E79] to-[#2e75b6] text-white px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Administration</p>
            <h1 className="text-lg font-bold mt-0.5 flex items-center gap-2"><Users size={16}/> VARIABLES - SOMNUM</h1>
            <p className="text-blue-300 text-xs">
              {loading?'Chargement…':filterSociete?`${filteredSalaries.length} salariés — ${filterSociete}`:`${filledCount} / ${SALARIES_DYN.length} salariés ont saisi des données`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {realtime&&<div className="flex items-center gap-1 bg-green-500/20 rounded-xl px-2 py-1 text-xs text-green-300"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>En direct</div>}
            <button onClick={onLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs font-medium transition-all">
              <LogOut size={12}/><span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {loading?(
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-[#1F4E79]/20 border-t-[#1F4E79] rounded-full animate-spin"/>
          <p className="text-sm text-gray-500 font-medium">Chargement des données…</p>
        </div>
      ):dbOk===false?(
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-8">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-amber-200">
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20}/>
              <div>
                <p className="font-bold text-amber-900 text-base">Base de données non configurée</p>
                <p className="text-amber-700 text-sm mt-1">Les tables Supabase doivent être créées pour que les données soient partagées entre tous les appareils.</p>
              </div>
            </div>
          </div>
        </div>
      ):(
        <>
          {/* Barre recherche + filtre société */}
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                  placeholder="Rechercher un collaborateur…"
                  className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1F4E79] shadow-sm"/>
                {searchQuery && <button onClick={()=>setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13}/></button>}
              </div>
              {societes.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Filter size={13} className="text-gray-400"/>
                  <button onClick={()=>setFilterSociete(null)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterSociete===null?'bg-[#1F4E79] text-white':'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
                    Toutes
                  </button>
                  {societes.map(s=>(
                    <button key={s} onClick={()=>setFilterSociete(s===filterSociete?null:s)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filterSociete===s?'bg-[#1F4E79] text-white':'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm overflow-x-auto">
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${tab===t.id?'bg-[#1F4E79] text-white shadow':'text-gray-500 hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
            {/* SYNTHÈSE */}
            {tab==='synthese'&&(
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Totaux globaux</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 mb-6">
                  {FIELDS.map(f=>(
                    <div key={f.key} className={`${f.bg} rounded-2xl p-3 text-center`}>
                      <p className={`text-lg font-bold ${f.color}`}>{totaux[f.key]>0?totaux[f.key].toFixed(2):'—'}</p>
                      <p className="text-xs font-medium opacity-70">{f.label}</p>
                      <p className="text-xs opacity-60">{f.unit}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Récapitulatif ({filteredSalaries.length} salariés{filterSociete ? ` — ${filterSociete}` : ''})</p>
                <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#1F4E79] text-white">
                        <th className="text-left px-3 py-3 font-medium">Salarié</th>
                        {MOIS.map(m=><th key={m} className="px-2 py-3 font-medium whitespace-nowrap">{m.slice(0,3)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSalaries.map((sal,i)=>(
                        <tr key={sal} className={i%2===0?'bg-white':'bg-blue-50/30'}>
                          <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{sal}</td>
                          {MOIS.map(mois=>{
                            const row=getRow(sal,mois);
                            const has=row&&FIELDS.some(f=>row[f.key as keyof RhRow]&&row[f.key as keyof RhRow]!=='0');
                            return <td key={mois} className="px-2 py-2 text-center">{has?<span className="inline-block w-2 h-2 rounded-full bg-green-400"/>:<span className="inline-block w-2 h-2 rounded-full bg-gray-200"/>}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SYNTHÈSE COLLABS — sans Notes */}
            {tab==='collabs'&&(
              <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1F4E79] text-white">
                      <th className="text-left px-3 py-3 font-medium">Salarié</th>
                      <th className="px-2 py-3">Mois</th>
                      <th className="px-2 py-3">Congés</th>
                      <th className="px-2 py-3">Maladie</th>
                      <th className="px-2 py-3">Transport</th>
                      <th className="px-2 py-3">KM (km)</th>
                      <th className="px-2 py-3">Frais pro</th>
                      <th className="px-2 py-3">Régul</th>
                      <th className="px-2 py-3">Primes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length===0&&<tr><td colSpan={9} className="text-center py-8 text-gray-400">Aucune donnée saisie</td></tr>}
                    {data.map((row,i)=>(
                      <tr key={i} className={i%2===0?'bg-white':'bg-blue-50/30'}>
                        <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{row.salarie_key}</td>
                        <td className="px-2 py-2 text-gray-600">{row.mois}</td>
                        <td className="px-2 py-2 text-center">{row.conges||'—'}</td>
                        <td className="px-2 py-2 text-center">{row.maladie||'—'}</td>
                        <td className="px-2 py-2 text-center">{row.transport||'—'}</td>
                        <td className="px-2 py-2 text-center">{row.ndf||'—'}</td>
                        <td className="px-2 py-2 text-center">{row.frais_pro||'—'}</td>
                        <td className="px-2 py-2 text-center">{row.regule||'—'}</td>
                        <td className="px-2 py-2 text-center">{row.primes||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* COMPTEURS */}
            {tab==='compteurs'&&(
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Clock size={20} className="text-indigo-600"/></div>
                  <div>
                    <p className="text-xs text-indigo-500 font-medium">Total tous collaborateurs</p>
                    <p className="text-2xl font-bold text-indigo-700">{totalHeures.toFixed(2)} h</p>
                  </div>
                </div>
                <button onClick={saveAllH} disabled={savingAll}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${savedAll?'bg-green-500 text-white':'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-70`}>
                  <CheckCircle size={14}/>{savedAll?'Tout sauvegardé !':savingAll?'Sauvegarde…':'Tout sauvegarder'}
                </button>
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
                      {SALARIES_DYN.map((sal,i)=>(
                        <tr key={sal} className={i%2===0?'bg-white':'bg-gray-50/50'}>
                          <td className="px-4 py-3 font-medium text-gray-700">{sal}</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <input type="text" value={heures[sal]??'0'} onChange={e=>setHeures(p=>({...p,[sal]:e.target.value}))}
                                className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:border-[#1F4E79] bg-[#f0f4fa] font-medium"/>
                              <span className="text-gray-400 text-sm">h</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={()=>saveH(sal)}
                              className={`flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all ${savedH[sal]?'bg-green-100 text-green-600':'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}>
                              <CheckCircle size={12}/>{savedH[sal]?'Sauvé !':'Sauver'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GESTION COLLABS */}
            {tab==='codes'&&(
              <div className="space-y-4">
                {/* Formulaire ajout */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus size={16} className="text-[#1F4E79]"/>
                    <span className="font-bold text-gray-800 text-sm">Ajouter un collaborateur</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Nom complet</label>
                      <input type="text" value={newNom} onChange={e=>setNewNom(e.target.value)} placeholder="Ex: Dupont Marie"
                        className="w-full px-3 py-2.5 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79]"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Code (auto si vide)</label>
                      <input type="text" value={newCode} onChange={e=>setNewCode(e.target.value)} placeholder="Ex: 123456"
                        className="w-full px-3 py-2.5 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] font-mono"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Société</label>
                      <input type="text" value={newSociete} onChange={e=>setNewSociete(e.target.value)} placeholder="Ex: SOMNUM"
                        className="w-full px-3 py-2.5 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79]"/>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={addCollab} disabled={!newNom.trim()||addingCollab}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#1F4E79] hover:bg-[#163d61] text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                      <UserPlus size={13}/>{addingCollab?'Ajout…':'Ajouter'}
                    </button>
                    {addMsg && <p className="text-green-600 text-xs font-medium">{addMsg}</p>}
                  </div>
                </div>

                {/* Liste */}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{SALARIES_DYN.length} collaborateurs</p>
                {selectedSal===null?(
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SALARIES_DYN.map(sal=>(
                      <div key={sal} className="bg-white rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all">
                        {editingCollab === sal ? (
                          /* MODE ÉDITION */
                          <div className="space-y-2">
                            <input type="text" value={editNom} onChange={e=>setEditNom(e.target.value)}
                              placeholder="Nom complet"
                              className="w-full px-3 py-2 bg-[#f0f4fa] border border-[#1F4E79] rounded-xl text-sm focus:outline-none font-medium"/>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={editCode} onChange={e=>setEditCode(e.target.value)}
                                placeholder="Code accès"
                                className="w-full px-3 py-2 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none font-mono"/>
                              <input type="text" value={editSociete} onChange={e=>setEditSociete(e.target.value)}
                                placeholder="Société"
                                className="w-full px-3 py-2 bg-[#f0f4fa] border border-gray-200 rounded-xl text-sm focus:outline-none"/>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button onClick={()=>saveEdit(sal)} disabled={savingEdit}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#1F4E79] text-white rounded-xl text-xs font-semibold hover:bg-[#163d61] transition-all disabled:opacity-50">
                                <Check size={12}/>{savingEdit?'…':'Enregistrer'}
                              </button>
                              <button onClick={()=>setEditingCollab(null)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-medium hover:bg-gray-200 transition-all">
                                <X size={12}/>Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* MODE LECTURE */
                          <div className="flex items-center justify-between">
                            <button onClick={()=>setSelectedSal(sal)} className="flex-1 text-left min-w-0">
                              <span className="font-medium text-gray-700 text-sm block truncate">{sal}</span>
                              {dynSocietes[sal] && <span className="text-xs text-gray-400">{dynSocietes[sal]}</span>}
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="text-xs bg-[#1F4E79]/10 text-[#1F4E79] px-2 py-1 rounded-lg font-mono">{dynCodes[sal]}</span>
                              <button onClick={()=>copyCode(dynCodes[sal], sal)} title="Copier"
                                className={`p-1.5 rounded-lg transition-all ${copiedCode===sal?'bg-green-100 text-green-600':'text-gray-400 hover:bg-gray-100'}`}>
                                <Copy size={12}/>
                              </button>
                              <button onClick={()=>startEdit(sal)} title="Modifier"
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-[#1F4E79] transition-all">
                                <Pencil size={12}/>
                              </button>
                              <button onClick={()=>deleteCollab(sal)} disabled={deletingCollab===sal} title="Supprimer"
                                className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50">
                                {deletingCollab===sal?<span className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin block"/>:<Trash2 size={12}/>}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ):(
                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800">{selectedSal}</h3>
                      <button onClick={()=>setSelectedSal(null)} className="text-xs text-gray-400 hover:text-gray-600">← Retour</button>
                    </div>
                    <div className="bg-[#f0f4fa] rounded-xl px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Code d'accès</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1F4E79] text-lg">{dynCodes[selectedSal]}</span>
                        <button onClick={()=>copyCode(dynCodes[selectedSal],selectedSal)}
                          className={`p-1.5 rounded-lg transition-all ${copiedCode===selectedSal?'bg-green-100 text-green-600':'text-gray-400 hover:bg-gray-100'}`}>
                          <Copy size={14}/>
                        </button>
                      </div>
                    </div>
                    {dynSocietes[selectedSal] && (
                      <div className="bg-[#f0f4fa] rounded-xl px-4 py-3 flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 font-medium">Société</span>
                        <span className="font-medium text-gray-700 text-sm">{dynSocietes[selectedSal]}</span>
                      </div>
                    )}
                    <button onClick={()=>{ setSelectedSal(null); startEdit(selectedSal); }}
                      className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#1F4E79] hover:bg-blue-50 transition-all">
                      <Pencil size={12}/>Modifier les informations
                    </button>
                    <button onClick={()=>deleteCollab(selectedSal)} disabled={deletingCollab===selectedSal}
                      className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                      <Trash2 size={12}/>Supprimer ce collaborateur
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* NOTES */}
            {tab === 'notes' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Notes des collaborateurs</p>
                {Object.keys(allNotes).length === 0 && (
                  <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                    Aucune note n'a encore été saisie
                  </div>
                )}
                {SALARIES_DYN.filter(s => allNotes[s]).map(sal => (
                  <div key={sal} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-[#1F4E79]/10 flex items-center justify-center shrink-0">
                        <MessageSquare size={13} className="text-[#1F4E79]" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{sal}</span>
                    </div>
                    <p className="text-sm text-gray-600 bg-[#f0f4fa] rounded-xl px-3 py-2.5 whitespace-pre-wrap">{allNotes[sal]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
