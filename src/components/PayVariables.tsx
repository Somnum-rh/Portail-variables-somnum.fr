import { PayVariable } from '@/types';
import { TrendingUp } from 'lucide-react';

interface PayVariablesProps {
  variables: PayVariable[];
}

export default function PayVariables({ variables }: PayVariablesProps) {
  const formatEur = (n: number) =>
    n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-700">Variables de Paie 2026</h3>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="text-left px-4 py-3 font-medium">Mois</th>
              <th className="text-right px-4 py-3 font-medium">Salaire Brut</th>
              <th className="text-right px-4 py-3 font-medium">Charges Sal.</th>
              <th className="text-right px-4 py-3 font-medium">Primes</th>
              <th className="text-right px-4 py-3 font-medium font-bold">Salaire Net</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                <td className="px-4 py-3 font-medium text-gray-700">{v.mois}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatEur(v.salairebrut)}</td>
                <td className="px-4 py-3 text-right text-red-500">-{formatEur(v.chargesSalariales)}</td>
                <td className="px-4 py-3 text-right text-green-600">+{formatEur(v.primes)}</td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">{formatEur(v.salaireNet)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-4 py-3 font-semibold text-gray-700">Total</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-600">
                {formatEur(variables.reduce((s, v) => s + v.salairebrut, 0))}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-red-500">
                -{formatEur(variables.reduce((s, v) => s + v.chargesSalariales, 0))}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-green-600">
                +{formatEur(variables.reduce((s, v) => s + v.primes, 0))}
              </td>
              <td className="px-4 py-3 text-right font-bold text-blue-700">
                {formatEur(variables.reduce((s, v) => s + v.salaireNet, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
