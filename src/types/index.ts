export interface Absence {
  id: string;
  type: 'CP' | 'RTT' | 'Maladie' | 'Autre';
  dateDebut: string;
  dateFin: string;
  nbJours: number;
  statut: 'Validé' | 'En attente' | 'Refusé';
}

export interface PayVariable {
  mois: string;
  annee: number;
  salairebrut: number;
  salaireNet: number;
  primes: number;
  chargesPatronales: number;
  chargesSalariales: number;
}

export interface Document {
  id: string;
  nom: string;
  type: 'Bulletin de paie' | 'Attestation' | 'Contrat';
  date: string;
  url?: string;
}

export interface Salarie {
  id: string;
  code: string; // Code d'accès PIN
  nom: string;
  prenom: string;
  poste: string;
  departement: string;
  dateEntree: string;
  variables: PayVariable[];
  absences: Absence[];
  documents: Document[];
  soldeCP: number;
  soldeRTT: number;
}
