import { Salarie } from '@/types';
import { Calendar, Sun, Clock } from 'lucide-react';

interface AbsencesProps {
  salarie: Salarie;
}

const typeColors: Record<string, string> = {
  CP: 'bg-green-100 text-green-700',
  RTT: 'bg-blue-100 text-blue-700',
  Maladie: 'bg-orange-100 text-orange-700',
  Autre: 'bg-gray-100 text-gray-700',
};

const statutColors: Record<string, string> = {
  Validé: 'bg-green-50 text-green-600 border border-green-200',
  'En attente': 'bg-yellow-50 text-yellow-600 border border-yellow-200',
  Refusé: 'bg-red-50 text-red-600 border border-red-200',
};

export default function Absences({ salarie }: AbsencesProps) {
  return (
    <div className="space-y-6">
      {/* Soldes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">Congés Payés</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{salarie.soldeCP}</p>
          <p className="text-xs text-green-500">jours disponibles</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">RTT</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{salarie.soldeRTT}</p>
          <p className="text-xs text-blue-500">jours disponibles</p>
        </div>
      </div>

      {/* Liste des absences */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-700">Historique des absences</h3>
        </div>
        {salarie.absences.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucune absence enregistrée</p>
        ) : (
          <div className="space-y-3">
            {salarie.absences.map((absence) => (
              <div
                key={absence.id}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${typeColors[absence.type]}`}
                  >
                    {absence.type}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Du {new Date(absence.dateDebut).toLocaleDateString('fr-FR')} au{' '}
                      {new Date(absence.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {absence.nbJours} jour{absence.nbJours > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${statutColors[absence.statut]}`}
                >
                  {absence.statut}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
