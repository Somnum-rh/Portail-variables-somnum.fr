import { Salarie } from '@/types';

export const salaries: Salarie[] = [
  {
    id: '1',
    code: '123456',
    nom: 'MARTIN',
    prenom: 'Sophie',
    poste: 'Responsable Formation',
    departement: 'Ressources Humaines',
    dateEntree: '2021-03-15',
    soldeCP: 12.5,
    soldeRTT: 4,
    variables: [
      { mois: 'Janvier', annee: 2026, salairebrut: 3200, salaireNet: 2486, primes: 200, chargesPatronales: 960, chargesSalariales: 514 },
      { mois: 'Février', annee: 2026, salairebrut: 3200, salaireNet: 2486, primes: 0, chargesPatronales: 960, chargesSalariales: 514 },
      { mois: 'Mars', annee: 2026, salairebrut: 3200, salaireNet: 2486, primes: 150, chargesPatronales: 960, chargesSalariales: 514 },
    ],
    absences: [
      { id: 'a1', type: 'CP', dateDebut: '2026-02-10', dateFin: '2026-02-14', nbJours: 5, statut: 'Validé' },
      { id: 'a2', type: 'RTT', dateDebut: '2026-03-17', dateFin: '2026-03-17', nbJours: 1, statut: 'Validé' },
    ],
    documents: [
      { id: 'd1', nom: 'Bulletin janvier 2026', type: 'Bulletin de paie', date: '2026-01-31' },
      { id: 'd2', nom: 'Bulletin février 2026', type: 'Bulletin de paie', date: '2026-02-28' },
      { id: 'd3', nom: 'Bulletin mars 2026', type: 'Bulletin de paie', date: '2026-03-31' },
      { id: 'd4', nom: 'Attestation employeur', type: 'Attestation', date: '2026-01-15' },
    ],
  },
  {
    id: '2',
    code: '654321',
    nom: 'DUPONT',
    prenom: 'Marc',
    poste: 'Formateur Senior',
    departement: 'Pédagogie',
    dateEntree: '2019-09-01',
    soldeCP: 18,
    soldeRTT: 6,
    variables: [
      { mois: 'Janvier', annee: 2026, salairebrut: 3800, salaireNet: 2953, primes: 300, chargesPatronales: 1140, chargesSalariales: 610 },
      { mois: 'Février', annee: 2026, salairebrut: 3800, salaireNet: 2953, primes: 0, chargesPatronales: 1140, chargesSalariales: 610 },
      { mois: 'Mars', annee: 2026, salairebrut: 3800, salaireNet: 2953, primes: 250, chargesPatronales: 1140, chargesSalariales: 610 },
    ],
    absences: [
      { id: 'a3', type: 'Maladie', dateDebut: '2026-01-20', dateFin: '2026-01-22', nbJours: 3, statut: 'Validé' },
    ],
    documents: [
      { id: 'd5', nom: 'Bulletin janvier 2026', type: 'Bulletin de paie', date: '2026-01-31' },
      { id: 'd6', nom: 'Bulletin février 2026', type: 'Bulletin de paie', date: '2026-02-28' },
      { id: 'd7', nom: 'Bulletin mars 2026', type: 'Bulletin de paie', date: '2026-03-31' },
    ],
  },
  {
    id: '3',
    code: '789012',
    nom: 'LEBLANC',
    prenom: 'Émilie',
    poste: 'Assistante Pédagogique',
    departement: 'Pédagogie',
    dateEntree: '2022-06-01',
    soldeCP: 8,
    soldeRTT: 2,
    variables: [
      { mois: 'Janvier', annee: 2026, salairebrut: 2600, salaireNet: 2021, primes: 0, chargesPatronales: 780, chargesSalariales: 418 },
      { mois: 'Février', annee: 2026, salairebrut: 2600, salaireNet: 2021, primes: 100, chargesPatronales: 780, chargesSalariales: 418 },
      { mois: 'Mars', annee: 2026, salairebrut: 2600, salaireNet: 2021, primes: 0, chargesPatronales: 780, chargesSalariales: 418 },
    ],
    absences: [
      { id: 'a4', type: 'CP', dateDebut: '2026-03-24', dateFin: '2026-03-28', nbJours: 5, statut: 'En attente' },
    ],
    documents: [
      { id: 'd8', nom: 'Bulletin janvier 2026', type: 'Bulletin de paie', date: '2026-01-31' },
      { id: 'd9', nom: 'Bulletin février 2026', type: 'Bulletin de paie', date: '2026-02-28' },
      { id: 'd10', nom: 'Bulletin mars 2026', type: 'Bulletin de paie', date: '2026-03-31' },
    ],
  },
];

export function findSalarieByCode(code: string): Salarie | undefined {
  return salaries.find(s => s.code === code);
}
