import { useState } from 'react';
import { Salarie } from '@/types';
import PayVariables from './PayVariables';
import Absences from './Absences';
import Documents from './Documents';
import { LogOut, TrendingUp, Calendar, FileText, User } from 'lucide-react';

interface DashboardProps {
  salarie: Salarie;
  onLogout: () => void;
}

type Tab = 'variables' | 'absences' | 'documents';

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'variables', label: 'Variables de Paie', icon: TrendingUp },
  { id: 'absences', label: 'Absences', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
];

export default function Dashboard({ salarie, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('variables');

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0f2557 0%, #1a3a6e 50%, #0d2040 100%)' }}
    >
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">VARIABLES - SOMNUM</h1>
            <p className="text-blue-200 text-xs">Portail Salariés</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-white text-xs font-medium">
                {salarie.prenom} {salarie.nom}
              </p>
              <p className="text-blue-200 text-xs">{salarie.poste}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Info salarié */}
      <div className="px-4 pb-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-400/30 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {salarie.prenom} {salarie.nom}
              </h2>
              <p className="text-blue-200 text-sm">
                {salarie.poste} • {salarie.departement}
              </p>
              <p className="text-blue-300 text-xs">
                Entrée le {new Date(salarie.dateEntree).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="px-4 pb-8">
        <div className="bg-gray-50 rounded-2xl shadow-xl overflow-hidden">
          {/* Onglets */}
          <div className="flex bg-white border-b border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 text-xs font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Contenu */}
          <div className="p-4 md:p-6">
            {activeTab === 'variables' && <PayVariables variables={salarie.variables} />}
            {activeTab === 'absences' && <Absences salarie={salarie} />}
            {activeTab === 'documents' && <Documents documents={salarie.documents} />}
          </div>
        </div>
      </div>
    </div>
  );
}
