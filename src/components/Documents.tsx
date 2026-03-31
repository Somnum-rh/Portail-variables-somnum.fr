import { Document } from '@/types';
import { FileText, Download } from 'lucide-react';

interface DocumentsProps {
  documents: Document[];
}

const typeIcons: Record<string, string> = {
  'Bulletin de paie': '📄',
  Attestation: '📋',
  Contrat: '📑',
};

export default function Documents({ documents }: DocumentsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-700">Mes Documents</h3>
      </div>
      {documents.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Aucun document disponible</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                  {typeIcons[doc.type] || '📄'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{doc.nom}</p>
                  <p className="text-xs text-gray-400">
                    {doc.type} • {new Date(doc.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <button className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
