// Données d'exemple FIGÉES pour la démonstration publique /demopro.
//
// ⚠️ Ce module ne doit JAMAIS importer @/lib/prisma ni @/lib/auth : la démo est
// servie sur le domaine live (branché sur la vraie base Turso). Toutes les
// valeurs sont statiques, calculées en mémoire, sans aucune lecture ni écriture
// de base. Les personas reprennent ceux du showroom (src/lib/showroom-seed.ts)
// mais sous forme d'objets, sans Prisma.
//
// Le catalogue véhicules réutilise les fixtures publiques (photos = blobs Vercel
// publics, aucune donnée personnelle). Le reste (clients, leads, RDV, devis,
// factures, garanties, diffusion, comptes) est inventé ici, à titre d'exemple.
import fixtures from "@/lib/showroom-fixtures.json";
import { emptyVehicleBlock, type VehicleBlock } from "@/lib/devis";

/* ────────────────────────── Dates relatives ──────────────────────────
   Recalculées à chaque requête pour que la démo reste « vivante »
   (Aujourd'hui / Demain dans le planning, mois glissants dans les courbes). */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}
function dayKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isoDay(offset: number): string {
  return dayKey(offset);
}

/* ────────────────────────── Véhicules ────────────────────────── */
export type DemoVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  color: string;
  transmission: string;
  fuel: string;
  power: number;
  origin: string;
  description: string;
  descriptionEn: string;
  features: string;
  featuresEn: string;
  images: string;
  conditionFacts: string;
  maintenanceHistory: string;
  maintenanceHighlights: string;
  documents: string;
  status: string;
  isPublished: boolean;
  createdAt: Date;
};

const V_STATUS = ["disponible", "disponible", "disponible", "reserve", "disponible", "vendu"];

export function getDemoVehicles(): DemoVehicle[] {
  return fixtures.vehicles.map((f, i) => ({
    ...f,
    id: `veh-${i + 1}`,
    status: V_STATUS[i] ?? "disponible",
    isPublished: true,
    createdAt: daysAgo(75 - i * 12),
  }));
}

export function getDemoVehicle(id: string): DemoVehicle | undefined {
  return getDemoVehicles().find((v) => v.id === id);
}

// Identités administratives d'exemple, pour les véhicules du catalogue de
// démonstration qui n'ont pas de dossier d'immatriculation ouvert. Le dossier,
// quand il existe, prime toujours : c'est la source réelle.
const IDENTITES_DEMO: Record<string, { vin: string; plate: string; firstRegDate: string }> = {
  "veh-2": { vin: "TRUZZZFV8K1006721", plate: "FT-118-QD", firstRegDate: "2019-04-22" },
  "veh-3": { vin: "TRUZZZ8J0E1042318", plate: "EJ-902-MH", firstRegDate: "2014-09-08" },
  "veh-4": { vin: "TRUZZZ8J0A1015904", plate: "CX-447-TB", firstRegDate: "2010-06-15" },
  "veh-5": { vin: "WAUZZZ8V4LA073612", plate: "GH-236-VN", firstRegDate: "2020-02-27" },
  "veh-6": { vin: "TRUZZZFV1J1008455", plate: "FQ-560-KR", firstRegDate: "2018-07-03" },
};

// Encart « Véhicule concerné » d'un devis d'exemple : la fiche du stock donne
// la photo et les caractéristiques, le dossier d'immatriculation donne le
// numéro de série et la plaque. C'est exactement le chemin du back-office.
export function getDemoVehicleBlock(vehicleId: string | null): VehicleBlock {
  const bloc = emptyVehicleBlock();
  if (!vehicleId) return bloc;
  const v = getDemoVehicle(vehicleId);
  if (!v) return bloc;
  const cle = `${v.make} ${v.model}`.toLowerCase();
  const dossier = getDemoRegistrations().find((r) => r.vehicleLabel.toLowerCase().startsWith(cle));
  let photo = "";
  try {
    const images = JSON.parse(v.images);
    if (Array.isArray(images) && typeof images[0] === "string") photo = images[0];
  } catch {
    /* une fiche sans photo reste une fiche valide */
  }
  const repli = IDENTITES_DEMO[vehicleId];
  return {
    ...bloc,
    show: true,
    label: `${v.make} ${v.model} — ${v.year}`,
    vin: dossier?.vin || repli?.vin || "",
    plate: dossier?.plateFinal || dossier?.plateForeign || repli?.plate || "",
    firstRegDate: dossier?.firstRegDate || repli?.firstRegDate || "",
    mileageKm: v.mileage,
    energy: [v.fuel, v.transmission].filter(Boolean).join(" · "),
    color: v.color,
    origin: v.origin,
    photoUrl: photo,
  };
}

/* ────────────────────────── Suivi véhicule ──────────────────────────
   Frais engagés (→ marge) et journal d'enquête, par véhicule. */
export type DemoVehicleCost = {
  id: string;
  vehicleId: string;
  category: string;
  label: string;
  amountCents: number;
  date: string;
};
export type DemoVehicleNote = {
  id: string;
  vehicleId: string;
  type: string;
  content: string;
  resolved: boolean;
  author: string;
  createdAt: Date;
};

export function getDemoVehicleCosts(vehicleId: string): DemoVehicleCost[] {
  const all: DemoVehicleCost[] = [
    { id: "cost-1", vehicleId: "veh-1", category: "achat", label: "Achat au négociant", amountCents: 1150000, date: isoDay(-70) },
    { id: "cost-2", vehicleId: "veh-1", category: "transport", label: "Convoyage depuis l'Allemagne", amountCents: 68000, date: isoDay(-68) },
    { id: "cost-3", vehicleId: "veh-1", category: "preparation", label: "Préparation esthétique + polish", amountCents: 42000, date: isoDay(-60) },
    { id: "cost-4", vehicleId: "veh-1", category: "controle", label: "Contrôle technique", amountCents: 8500, date: isoDay(-58) },
    { id: "cost-5", vehicleId: "veh-2", category: "achat", label: "Achat au négociant", amountCents: 2950000, date: isoDay(-40) },
    { id: "cost-6", vehicleId: "veh-2", category: "carrosserie", label: "Retouche pare-chocs arrière (sous-traité)", amountCents: 32000, date: isoDay(-35) },
  ];
  return all.filter((c) => c.vehicleId === vehicleId);
}

export function getDemoVehicleNotes(vehicleId: string): DemoVehicleNote[] {
  const all: DemoVehicleNote[] = [
    { id: "vnote-1", vehicleId: "veh-1", type: "probleme", content: "Petit à-coup sur la boîte de vitesses à froid, à faire vérifier avant mise en vente.", resolved: true, author: "Fab", createdAt: daysAgo(65) },
    { id: "vnote-2", vehicleId: "veh-1", type: "solution", content: "Vidange boîte faite chez le partenaire, plus aucun à-coup. RAS.", resolved: false, author: "Fab", createdAt: daysAgo(59) },
    { id: "vnote-3", vehicleId: "veh-1", type: "admin", content: "Carte grise reçue, Car-Pass à jour. Dossier complet.", resolved: false, author: "Julie", createdAt: daysAgo(57) },
    { id: "vnote-4", vehicleId: "veh-2", type: "probleme", content: "Rayure sur jante avant droite à faire rénover.", resolved: false, author: "Thomas", createdAt: daysAgo(20) },
  ];
  return all.filter((n) => n.vehicleId === vehicleId);
}

/* ────────────────────────── Clients & leads ────────────────────────── */
export type DemoLeadEvent = { id: string; type: string; content: string; author: string; createdAt: Date };
export type DemoLead = {
  id: string;
  clientId: string;
  title: string;
  stage: string;
  source: string;
  budget: number | null;
  vehicleId: string | null;
  createdAt: Date;
  events: DemoLeadEvent[];
};
export type DemoClient = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  createdAt: Date;
  leads: DemoLead[];
};

export function getDemoClients(): DemoClient[] {
  return [
    {
      id: "cli-1",
      name: "Sophie Laurent",
      company: "",
      email: "sophie.laurent@gmail.com",
      phone: "07 81 42 63 55",
      createdAt: daysAgo(4),
      leads: [
        {
          id: "lead-1", clientId: "cli-1", title: "Recherche SUV hybride familial", stage: "nouveau",
          source: "site-contact", budget: 35000, vehicleId: null, createdAt: daysAgo(0.1),
          events: [
            { id: "ev-1a", type: "creation", content: "Lead créé", author: "Site web", createdAt: daysAgo(0.1) },
            { id: "ev-1b", type: "note", content: "Bonjour, je cherche un SUV hybride récent, budget 35 000 €, plutôt gris ou noir.", author: "Julie", createdAt: daysAgo(0.05) },
          ],
        },
        {
          id: "lead-6", clientId: "cli-1", title: "Reprise Peugeot 3008 (2019)", stage: "nouveau",
          source: "reprise", budget: 16500, vehicleId: null, createdAt: daysAgo(3),
          events: [
            { id: "ev-6a", type: "creation", content: "Estimation de reprise créée", author: "Julie", createdAt: daysAgo(3) },
            { id: "ev-6b", type: "note", content: "Peugeot 3008 (2019)\n78 000 km · Diesel · Automatique\nÉtat : bon état général, léger impact pare-chocs arrière\nEstimation proposée : 16 500 €", author: "Julie", createdAt: daysAgo(3) },
          ],
        },
      ],
    },
    {
      id: "cli-2",
      name: "Jean Martin",
      company: "Garage Martin & Fils",
      email: "j.martin@garage-martin.fr",
      phone: "06 12 34 56 78",
      createdAt: daysAgo(3),
      leads: [
        {
          id: "lead-2", clientId: "cli-2", title: "Recherche Audi TT S-line", stage: "contacte",
          source: "telephone", budget: 26000, vehicleId: "veh-2", createdAt: daysAgo(2),
          events: [
            { id: "ev-2a", type: "creation", content: "Lead créé", author: "Site web", createdAt: daysAgo(2) },
            { id: "ev-2b", type: "note", content: "Rappelé ce matin : très intéressé, souhaite un essai ce week-end.", author: "Julie", createdAt: daysAgo(1) },
          ],
        },
      ],
    },
    {
      id: "cli-3",
      name: "Amélie Rousseau",
      company: "",
      email: "amelie.rousseau@outlook.fr",
      phone: "06 45 88 12 30",
      createdAt: daysAgo(5),
      leads: [
        {
          id: "lead-3", clientId: "cli-3", title: "Essai prévu — coupé essence", stage: "rdv",
          source: "recherche-perso", budget: 22000, vehicleId: "veh-3", createdAt: daysAgo(4),
          events: [
            { id: "ev-3a", type: "creation", content: "Lead créé", author: "Site web", createdAt: daysAgo(4) },
            { id: "ev-3b", type: "note", content: "Essai confirmé, vient avec son mari. Prévoir la carte grise et le carnet.", author: "Julie", createdAt: daysAgo(3) },
          ],
        },
      ],
    },
    {
      id: "cli-4",
      name: "Marc Dubois",
      company: "TransCar SPRL",
      email: "m.dubois@transcar.be",
      phone: "+32 475 11 22 33",
      createdAt: daysAgo(7),
      leads: [
        {
          id: "lead-4", clientId: "cli-4", title: "Devis envoyé — attente retour", stage: "devis_envoye",
          source: "manuel", budget: 21000, vehicleId: "veh-4", createdAt: daysAgo(6),
          events: [
            { id: "ev-4a", type: "creation", content: "Lead créé", author: "Julie", createdAt: daysAgo(6) },
            { id: "ev-4b", type: "note", content: "Devis 2026-041 envoyé hier. Relance prévue vendredi si pas de nouvelles.", author: "Julie", createdAt: daysAgo(5) },
          ],
        },
      ],
    },
    {
      id: "cli-5",
      name: "Karim Benali",
      company: "",
      email: "k.benali@gmail.com",
      phone: "06 20 15 78 41",
      createdAt: daysAgo(13),
      leads: [
        {
          id: "lead-5", clientId: "cli-5", title: "Vente conclue — Megane RS", stage: "gagne",
          source: "site-contact", budget: null, vehicleId: "veh-6", createdAt: daysAgo(12),
          events: [
            { id: "ev-5a", type: "creation", content: "Lead créé", author: "Site web", createdAt: daysAgo(12) },
            { id: "ev-5b", type: "note", content: "Livraison effectuée. Client ravi, pense à nous pour la voiture de sa femme.", author: "Fab", createdAt: daysAgo(7) },
          ],
        },
      ],
    },
  ];
}

export function getDemoClient(id: string): DemoClient | undefined {
  return getDemoClients().find((c) => c.id === id);
}

/** Tous les leads à plat (avec le client rattaché), pour le pipeline. */
export function getDemoLeads(): (DemoLead & { client: DemoClient })[] {
  const out: (DemoLead & { client: DemoClient })[] = [];
  for (const c of getDemoClients()) {
    for (const l of c.leads) out.push({ ...l, client: c });
  }
  return out;
}

/* ────────────────────────── Planning atelier ────────────────────────── */
export type DemoAppointment = {
  id: string;
  date: string;
  startMin: number;
  durationMin: number;
  type: string;
  title: string;
  person: string | null;
  clientId: string | null;
  vehicleId: string | null;
};

export function getDemoAppointments(): DemoAppointment[] {
  return [
    { id: "rdv-1", date: dayKey(0), startMin: 10 * 60, durationMin: 60, type: "essai", title: "Essai TT S-line", person: "Julie", clientId: "cli-3", vehicleId: "veh-3" },
    { id: "rdv-2", date: dayKey(0), startMin: 15 * 60, durationMin: 180, type: "indispo", title: "RDV perso", person: "Julie", clientId: null, vehicleId: null },
    { id: "rdv-3", date: dayKey(1), startMin: 9 * 60, durationMin: 120, type: "preparation", title: "Préparation esthétique", person: "Thomas", clientId: null, vehicleId: "veh-1" },
    { id: "rdv-4", date: dayKey(1), startMin: 14 * 60, durationMin: 90, type: "livraison", title: "Livraison client", person: "Thomas", clientId: "cli-5", vehicleId: "veh-6" },
    { id: "rdv-5", date: dayKey(2), startMin: 9 * 60 + 30, durationMin: 60, type: "ct", title: "Contrôle technique", person: "Thomas", clientId: null, vehicleId: "veh-4" },
  ];
}

/* ────────────────────────── Devis & factures ────────────────────────── */
export type DemoQuoteItem = { id: string; designation: string; detail: string; qty: number; unitPrice: number };
export type DemoQuote = {
  id: string;
  number: string;
  status: string;
  docType: string;
  factureKind: string | null;
  paymentStatus: string | null;
  paidDate: string | null;
  kind: string;
  tvaMode: string;
  tvaRate: number;
  depositMode: string;
  depositValue: number;
  paymentTerms: string;
  clientId: string | null;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientCountry?: string;
  clientVatNumber?: string;
  docLang?: string;
  issueDate: string;
  vehicleId: string | null;
  items: DemoQuoteItem[];
  createdAt: Date;
  updatedAt: Date;
};

const QUOTE_BASE = {
  kind: "vehicule",
  tvaMode: "marge",
  tvaRate: 20,
  depositMode: "percent",
  depositValue: 30,
  paymentTerms: "Acompte à la commande, solde à la livraison.",
};

export function getDemoQuotes(): DemoQuote[] {
  const year = new Date().getFullYear();
  const v = getDemoVehicles();
  const veh4 = v[3];
  const veh6 = v[5];
  const transTotal = (veh4?.price ?? 20990) + 490;
  return [
    {
      ...QUOTE_BASE,
      id: "q-041", number: `${year}-041`, status: "envoye", docType: "devis",
      factureKind: null, paymentStatus: null, paidDate: null,
      clientId: "cli-4", clientName: "Marc Dubois", clientCompany: "TransCar SPRL",
      clientEmail: "m.dubois@transcar.be", clientPhone: "+32 475 11 22 33",
      // Vente à un professionnel belge : la démonstration montre l'exonération
      // intracommunautaire, avec le numéro de TVA du preneur et la mention légale.
      clientCountry: "BE", clientVatNumber: "BE0456789123", tvaMode: "intracom",
      // Document en anglais : la démonstration montre le devis bilingue.
      docLang: "en",
      issueDate: isoDay(-12), vehicleId: "veh-4",
      items: [
        { id: "it1", designation: `${veh4?.make ?? "Véhicule"} ${veh4?.model ?? ""}`.trim(), detail: veh4 ? `${veh4.year} · ${veh4.mileage} km` : "", qty: 1, unitPrice: veh4?.price ?? 20990 },
        { id: "it2", designation: "Garantie 12 mois", detail: "Extension constructeur", qty: 1, unitPrice: 490 },
      ],
      createdAt: daysAgo(12), updatedAt: daysAgo(12),
    },
    {
      ...QUOTE_BASE,
      id: "q-038", number: `${year}-038`, status: "accepte", docType: "devis",
      factureKind: null, paymentStatus: null, paidDate: null,
      clientId: "cli-5", clientName: "Karim Benali", clientCompany: "",
      clientEmail: "k.benali@gmail.com", clientPhone: "06 20 15 78 41",
      issueDate: isoDay(-9), vehicleId: "veh-6",
      items: [
        { id: "it1", designation: `${veh6?.make ?? "Véhicule"} ${veh6?.model ?? ""}`.trim(), detail: veh6 ? `${veh6.year} · ${veh6.mileage} km` : "", qty: 1, unitPrice: veh6?.price ?? 15490 },
      ],
      createdAt: daysAgo(9), updatedAt: daysAgo(9),
    },
    {
      // Devis parti sans réponse depuis 45 jours : passé la validité de 30 jours,
      // la liste le signale « expiré » et propose la relance.
      ...QUOTE_BASE,
      id: "q-035", number: `${year}-035`, status: "envoye", docType: "devis",
      factureKind: null, paymentStatus: null, paidDate: null,
      clientId: "cli-2", clientName: "Sophie Marchand", clientCompany: "",
      clientEmail: "s.marchand@outlook.fr", clientPhone: "06 71 45 09 22",
      issueDate: isoDay(-45), vehicleId: "veh-2",
      items: [
        { id: "it1", designation: `${v[1]?.make ?? "Véhicule"} ${v[1]?.model ?? ""}`.trim(), detail: v[1] ? `${v[1].year} · ${v[1].mileage} km` : "", qty: 1, unitPrice: v[1]?.price ?? 24900 },
        { id: "it2", designation: "Carte grise et frais de dossier", detail: "Immatriculation incluse", qty: 1, unitPrice: 480 },
      ],
      createdAt: daysAgo(45), updatedAt: daysAgo(45),
    },
    {
      // Brouillon en cours de rédaction, client encore à renseigner.
      ...QUOTE_BASE,
      id: "q-042", number: `${year}-042`, status: "brouillon", docType: "devis",
      factureKind: null, paymentStatus: null, paidDate: null,
      clientId: null, clientName: "", clientCompany: "",
      clientEmail: "", clientPhone: "",
      issueDate: isoDay(-1), vehicleId: "veh-1",
      items: [
        { id: "it1", designation: `${v[0]?.make ?? "Véhicule"} ${v[0]?.model ?? ""}`.trim(), detail: v[0] ? `${v[0].year} · ${v[0].mileage} km` : "", qty: 1, unitPrice: v[0]?.price ?? 18900 },
      ],
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      // Refusé : le prospect est parti sur un autre modèle.
      ...QUOTE_BASE,
      id: "q-030", number: `${year}-030`, status: "refuse", docType: "devis",
      factureKind: null, paymentStatus: null, paidDate: null,
      clientId: "cli-3", clientName: "Julien Roy", clientCompany: "Roy Automobiles",
      clientEmail: "contact@roy-automobiles.fr", clientPhone: "04 78 33 21 09",
      issueDate: isoDay(-62), vehicleId: "veh-3",
      items: [
        { id: "it1", designation: `${v[2]?.make ?? "Véhicule"} ${v[2]?.model ?? ""}`.trim(), detail: v[2] ? `${v[2].year} · ${v[2].mileage} km` : "", qty: 1, unitPrice: v[2]?.price ?? 31900 },
      ],
      createdAt: daysAgo(62), updatedAt: daysAgo(60),
    },
    {
      ...QUOTE_BASE,
      id: "fac-001", number: `FAC-${year}-001`, status: "envoye", docType: "facture",
      factureKind: "complete", paymentStatus: "payee", paidDate: isoDay(-7),
      depositMode: "none", depositValue: 0,
      clientId: "cli-5", clientName: "Karim Benali", clientCompany: "",
      clientEmail: "k.benali@gmail.com", clientPhone: "06 20 15 78 41",
      issueDate: isoDay(-8), vehicleId: "veh-6",
      paymentTerms: "Réglé par virement.",
      items: [
        { id: "it1", designation: `${veh6?.make ?? "Véhicule"} ${veh6?.model ?? ""}`.trim(), detail: veh6 ? `${veh6.year} · ${veh6.mileage} km` : "", qty: 1, unitPrice: veh6?.price ?? 15490 },
      ],
      createdAt: daysAgo(8), updatedAt: daysAgo(7),
    },
    {
      ...QUOTE_BASE,
      id: "fac-002", number: `FAC-${year}-002`, status: "envoye", docType: "facture",
      factureKind: "acompte", paymentStatus: "impayee", paidDate: null,
      depositMode: "none", depositValue: 0,
      clientId: "cli-4", clientName: "Marc Dubois", clientCompany: "TransCar SPRL",
      clientEmail: "m.dubois@transcar.be", clientPhone: "+32 475 11 22 33",
      // 35 jours : l'échéance à 30 jours est dépassée, la facture illustre le
      // centre de relances (« retard 5 j ») sans contredire sa fiche.
      issueDate: isoDay(-35), vehicleId: "veh-4",
      paymentTerms: "Facture d'acompte. Le solde fera l'objet d'une facture ultérieure.",
      items: [
        { id: "acompte", designation: `Acompte sur commande — ${veh4 ? `${veh4.make} ${veh4.model}` : "véhicule"}`, detail: `Acompte 30 % sur devis ${year}-041`, qty: 1, unitPrice: Math.round(transTotal * 0.3) },
      ],
      createdAt: daysAgo(35), updatedAt: daysAgo(35),
    },
  ];
}

export function getDemoQuote(id: string): DemoQuote | undefined {
  return getDemoQuotes().find((q) => q.id === id);
}

/* ────────────────────────── Journal des relances ──────────────────────────
   Ce qui a déjà été fait dans le centre de relances : le prospect voit que
   l'outil garde la trace de chaque envoi, appel et report. */
export type DemoRelanceLog = {
  id: string;
  quoteId: string;
  number: string;
  client: string;
  action: string;
  detail: string;
  author: string;
  at: string;
};

export function getDemoRelanceLog(): DemoRelanceLog[] {
  const year = new Date().getFullYear();
  // Heures fixes dans la journée, pour un journal lisible et stable.
  const at = (jours: number, heure: number, minute: number) => {
    const d = new Date();
    d.setDate(d.getDate() - jours);
    d.setHours(heure, minute, 0, 0);
    return d.toISOString();
  };
  return [
    { id: "rl-1", quoteId: "q-035", number: `${year}-035`, client: "Sophie Marchand", action: "email", detail: "Email envoyé à s.marchand@outlook.fr", author: "Fab", at: at(2, 9, 12) },
    { id: "rl-2", quoteId: "fac-002", number: `FAC-${year}-002`, client: "TransCar SPRL", action: "telephone", detail: "Relance notée : contact par téléphone", author: "Julie", at: at(3, 11, 40) },
    { id: "rl-3", quoteId: "q-041", number: `${year}-041`, client: "TransCar SPRL", action: "report", detail: "Reporté au " + isoDay(4).split("-").reverse().join("/"), author: "Fab", at: at(4, 16, 5) },
    { id: "rl-4", quoteId: "q-035", number: `${year}-035`, client: "Sophie Marchand", action: "email", detail: "Email envoyé à s.marchand@outlook.fr", author: "Fab", at: at(12, 10, 30) },
    { id: "rl-5", quoteId: "fac-001", number: `FAC-${year}-001`, client: "Karim Benali", action: "email", detail: "Email envoyé à k.benali@gmail.com", author: "Thomas", at: at(14, 14, 22) },
    { id: "rl-6", quoteId: "q-030", number: `${year}-030`, client: "Roy Automobiles", action: "arret", detail: "Relances arrêtées pour ce document", author: "Fab", at: at(20, 8, 55) },
    { id: "rl-7", quoteId: "q-030", number: `${year}-030`, client: "Roy Automobiles", action: "echec", detail: "Envoi refusé par le service d'email : adresse inconnue", author: "Fab", at: at(22, 17, 48) },
  ];
}

/* ────────────────────────── Garanties ────────────────────────── */
export type DemoWarranty = {
  id: string;
  clientName: string;
  clientEmail: string;
  vehicleLabel: string;
  type: string;
  startDate: string;
  endDate: string;
  notes: string;
};

export function getDemoWarranties(): DemoWarranty[] {
  return [
    { id: "war-1", clientName: "Karim Benali", clientEmail: "k.benali@gmail.com", vehicleLabel: "Renault Megane 3 RS", type: "constructeur", startDate: isoDay(-695), endDate: isoDay(35), notes: "Garantie constructeur 24 mois." },
    { id: "war-2", clientName: "Amélie Rousseau", clientEmail: "amelie.rousseau@outlook.fr", vehicleLabel: "Audi TT 40 TFSI S-line", type: "extension", startDate: isoDay(-120), endDate: isoDay(605), notes: "Extension 24 mois souscrite à la vente." },
  ];
}

/* ────────────────────────── Diffusion ────────────────────────── */
export type DemoListing = { id: string; vehicleId: string; portal: string; status: string; publishedAt: Date };

export function getDemoListings(): DemoListing[] {
  const portals = ["lacentrale", "leboncoin", "autoscout24", "facebook"];
  const out: DemoListing[] = [];
  portals.forEach((portal, i) => out.push({ id: `lst-a${i}`, vehicleId: "veh-1", portal, status: "publie", publishedAt: daysAgo(12) }));
  portals.slice(0, 2).forEach((portal, i) => out.push({ id: `lst-b${i}`, vehicleId: "veh-2", portal, status: "publie", publishedAt: daysAgo(5) }));
  return out;
}

/* ────────────────────────── Atelier (notes d'équipe) ────────────────────────── */
export type DemoNote = { id: string; content: string; status: string; urgency: string; author: string; category: string; createdAt: Date };

export function getDemoNotes(): DemoNote[] {
  return [
    { id: "note-1", content: "Pneus avant de la TT S-line à contrôler avant l'essai de samedi.", status: "todo", urgency: "urgente", author: "Thomas", category: "véhicules", createdAt: daysAgo(1) },
    { id: "note-2", content: "Penser à réactiver la campagne d'annonces après le week-end.", status: "in-progress", urgency: "normale", author: "Julie", category: "commercial", createdAt: daysAgo(2) },
  ];
}

/* ────────────────────────── Comptes associés (registre César / Fab) ────────────────────────── */
export type DemoLedgerEntry = {
  id: string;
  date: string;
  label: string;
  category: string;
  amountCents: number;
  paidBy: "César" | "Fab";
  scope: "commun" | "César" | "Fab";
  share: number;
  note: string;
};

export function getDemoLedger(): DemoLedgerEntry[] {
  return [
    { id: "led-1", date: isoDay(-2), label: "Claude Code", category: "abonnement", amountCents: 20000, paidBy: "César", scope: "commun", share: 50, note: "" },
    { id: "led-2", date: isoDay(-5), label: "API Anthropic", category: "api", amountCents: 30000, paidBy: "César", scope: "commun", share: 50, note: "" },
    { id: "led-3", date: isoDay(-8), label: "Abonnement Vercel", category: "abonnement", amountCents: 24000, paidBy: "César", scope: "commun", share: 50, note: "" },
    { id: "led-4", date: isoDay(-11), label: "Base de données Turso", category: "abonnement", amountCents: 5800, paidBy: "César", scope: "commun", share: 50, note: "" },
    { id: "led-5", date: isoDay(-14), label: "Convoyage véhicule Allemagne", category: "vehicule", amountCents: 68000, paidBy: "César", scope: "commun", share: 50, note: "Mégane RS" },
    { id: "led-6", date: isoDay(-18), label: "Nom de domaine", category: "abonnement", amountCents: 6000, paidBy: "Fab", scope: "commun", share: 50, note: "" },
    { id: "led-7", date: isoDay(-20), label: "Resend (emails)", category: "abonnement", amountCents: 4000, paidBy: "Fab", scope: "commun", share: 50, note: "" },
    { id: "led-8", date: isoDay(-24), label: "Avance sur salaire", category: "salaire", amountCents: 50000, paidBy: "César", scope: "Fab", share: 50, note: "Avance ponctuelle" },
    { id: "led-9", date: isoDay(-28), label: "Apport de trésorerie", category: "apport", amountCents: 200000, paidBy: "Fab", scope: "Fab", share: 50, note: "" },
  ];
}

/* ────────────────────────── Dossiers d'immatriculation (SIV) ────────────────────────── */
export type DemoRegistration = {
  id: string;
  reference: string;
  type: "import_ue" | "titulaire" | "duplicata";
  status: string;
  vehicleLabel: string;
  vin: string;
  plateForeign: string;
  plateFinal: string;
  countryOrigin: string;
  firstRegDate: string;
  mileageKm: number;
  holderName: string;
  holderAddress: string;
  vatRegime: "neuf" | "occasion";
  documents: string[]; // clés des pièces fournies (déjà « parsées »)
  acquiredOn: string;
  deliveredOn: string;
  quitusDate: string;
  registeredOn: string;
  createdAt: Date;
};

export function getDemoRegistrations(): DemoRegistration[] {
  return [
    {
      id: "reg-1", reference: "IMM-2026-014", type: "import_ue", status: "quitus",
      vehicleLabel: "BMW Série 3 320d", vin: "WBA8E11050K123456", plateForeign: "M-AB 1234", plateFinal: "",
      countryOrigin: "Allemagne", firstRegDate: "2021-03-10", mileageKm: 62000,
      holderName: "Sophie Laurent", holderAddress: "12 rue des Lilas, 75012 Paris",
      vatRegime: "occasion",
      documents: ["ci_etranger", "preuve_achat", "coc", "controle_technique", "identite", "domicile"],
      acquiredOn: isoDay(-12), deliveredOn: isoDay(-10), quitusDate: "", registeredOn: "", createdAt: daysAgo(12),
    },
    {
      id: "reg-2", reference: "IMM-2026-013", type: "import_ue", status: "pret",
      vehicleLabel: "Audi Q3 35 TFSI", vin: "WAUZZZF39M1123456", plateForeign: "B-XY 9087", plateFinal: "",
      countryOrigin: "Allemagne", firstRegDate: isoDay(-110), mileageKm: 3500,
      holderName: "Jean Martin", holderAddress: "8 avenue du Général Leclerc, 92100 Boulogne",
      vatRegime: "neuf",
      documents: ["ci_etranger", "preuve_achat", "coc", "tva_france", "quitus", "controle_technique", "identite", "domicile"],
      acquiredOn: isoDay(-8), deliveredOn: isoDay(-6), quitusDate: isoDay(-4), registeredOn: "", createdAt: daysAgo(8),
    },
    {
      id: "reg-3", reference: "IMM-2026-012", type: "titulaire", status: "immatricule",
      vehicleLabel: "Renault Megane 3 RS", vin: "VF1DZ0R0H12345678", plateForeign: "", plateFinal: "GT-482-RS",
      countryOrigin: "France", firstRegDate: "2009-06-01", mileageKm: 165000,
      holderName: "Karim Benali", holderAddress: "5 impasse des Tilleuls, 69003 Lyon",
      vatRegime: "occasion",
      documents: ["ci_barre", "cession", "csa", "controle_technique", "identite", "domicile", "mandat", "cerfa_13750"],
      acquiredOn: isoDay(-25), deliveredOn: "", quitusDate: "", registeredOn: isoDay(-5), createdAt: daysAgo(25),
    },
  ];
}

/* ────────────────────────── Utilisateurs (équipe) ────────────────────────── */
export type DemoUser = { id: string; email: string; role: "patron" | "gestionnaire" | "vendeur"; createdAt: Date };

export function getDemoUsers(): DemoUser[] {
  return [
    { id: "usr-1", email: "cesar@intelligence-automobile.fr", role: "patron", createdAt: daysAgo(320) },
    { id: "usr-2", email: "fabrice@intelligence-automobile.fr", role: "gestionnaire", createdAt: daysAgo(280) },
    { id: "usr-3", email: "julie@intelligence-automobile.fr", role: "vendeur", createdAt: daysAgo(140) },
    { id: "usr-4", email: "thomas@intelligence-automobile.fr", role: "vendeur", createdAt: daysAgo(95) },
  ];
}

/* ────────────────────────── Avis clients ────────────────────────── */
export type DemoReviewClient = { id: string; name: string; email: string; reason: string; requestedAt: string | null };

export function getDemoReviewClients(): DemoReviewClient[] {
  return [
    { id: "rev-1", name: "Karim Benali", email: "k.benali@gmail.com", reason: "Vente conclue · facture payée", requestedAt: null },
    { id: "rev-2", name: "Amélie Rousseau", email: "amelie.rousseau@outlook.fr", reason: "Livraison effectuée", requestedAt: null },
    { id: "rev-3", name: "Antoine Mercier", email: "a.mercier@gmail.com", reason: "Vente conclue", requestedAt: isoDay(-9) },
  ];
}

/* ────────────────────────── Mois glissants (courbes) ────────────────────────── */
export function lastMonths(n: number): { key: string; label: string }[] {
  const now = new Date();
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const raw = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
    out.push({ key, label: raw.charAt(0).toUpperCase() + raw.slice(1) });
  }
  return out;
}
