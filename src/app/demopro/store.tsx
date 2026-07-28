"use client";

// Magasin de la démonstration publique /demopro.
//
// La démo doit se manipuler comme le vrai produit : créer un rendez-vous, passer
// une voiture en vendu, écrire un devis. Rien ne part au serveur pour autant.
// Tout vit dans l'onglet du visiteur, conservé le temps de sa visite, et chaque
// visiteur a son propre bac à sable.
//
// ⚠️ Aucun accès base ici : les valeurs de départ viennent des données d'exemple
// figées, et les écritures ne quittent jamais le navigateur.
import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getDemoVehicles, getDemoAppointments, getDemoClients, getDemoQuotes,
  type DemoVehicle, type DemoAppointment, type DemoClient, type DemoQuote,
} from "@/lib/demo-data";

const KEY = "demopro_bac_a_sable";

export type DemoState = {
  vehicles: DemoVehicle[];
  appointments: DemoAppointment[];
  clients: DemoClient[];
  quotes: DemoQuote[];
};

function seed(): DemoState {
  return {
    vehicles: getDemoVehicles(),
    appointments: getDemoAppointments(),
    clients: getDemoClients(),
    quotes: getDemoQuotes(),
  };
}

/* ── Magasin ── */
// Un état de module plutôt qu'un état React : le décor doit survivre au
// changement de page, qui remonte tout l'arbre.
let state: DemoState = seed();
let listeners: Array<() => void> = [];
// L'instantané rendu par le serveur reste celui des données d'exemple : le
// navigateur ne remplace le décor qu'après le premier affichage, ce qui évite
// un écart entre ce que le serveur écrit et ce que le navigateur reconstruit.
const serverState: DemoState = state;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

function getSnapshot(): DemoState {
  return state;
}

function getServerSnapshot(): DemoState {
  return serverState;
}

/* ── Conservation dans l'onglet ── */
// Les dates traversent le stockage en texte : elles sont reconstruites au retour.
const DATE_FIELDS = ["createdAt", "updatedAt"] as const;

function revive(raw: unknown): DemoState {
  const parsed = raw as DemoState;
  const fix = <T,>(rows: T[]): T[] =>
    rows.map((r) => {
      const out = { ...r } as Record<string, unknown>;
      DATE_FIELDS.forEach((f) => {
        if (typeof out[f] === "string") out[f] = new Date(out[f] as string);
      });
      return out as T;
    });
  return {
    vehicles: fix(parsed.vehicles ?? []),
    appointments: parsed.appointments ?? [],
    clients: fix(parsed.clients ?? []),
    quotes: fix(parsed.quotes ?? []),
  };
}

function persist() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Stockage refusé : la démo reste manipulable, elle repartira du décor
    // d'origine au prochain chargement de page.
  }
}

function hydrate() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    state = revive(JSON.parse(raw));
    emit();
  } catch {
    /* décor abîmé : on garde celui d'origine */
  }
}

function setState(next: DemoState) {
  state = next;
  persist();
  emit();
}

// Annonce vierge posée en tête de liste, masquée du site : le parcours de
// création se montre sans reproduire le formulaire de 1 100 lignes du vrai
// back-office.
export function addBlankVehicle(): DemoVehicle {
  const row: DemoVehicle = {
    id: demoId("veh"),
    make: "Nouvelle",
    model: "annonce",
    year: new Date().getFullYear(),
    mileage: 0,
    price: 0,
    color: "",
    transmission: "Automatique",
    fuel: "Essence",
    power: 0,
    origin: "Allemagne",
    description: "",
    descriptionEn: "",
    features: "[]",
    featuresEn: "[]",
    images: "[]",
    conditionFacts: "[]",
    maintenanceHistory: "[]",
    maintenanceHighlights: "[]",
    documents: "[]",
    status: "disponible",
    isPublished: false,
    createdAt: new Date(),
  };
  insert("vehicles", row);
  return row;
}

export function resetDemo() {
  try { sessionStorage.removeItem(KEY); } catch { /* sans conséquence */ }
  state = seed();
  emit();
}

/* ── Écritures génériques ── */
type Collection = keyof DemoState;

function update<T extends { id: string }>(collection: Collection, id: string, delta: Partial<T>) {
  setState({
    ...state,
    [collection]: (state[collection] as unknown as T[]).map((r) => (r.id === id ? { ...r, ...delta } : r)),
  } as DemoState);
}

function insert<T extends { id: string }>(collection: Collection, row: T) {
  setState({ ...state, [collection]: [row, ...(state[collection] as unknown as T[])] } as DemoState);
}

function remove(collection: Collection, id: string) {
  setState({
    ...state,
    [collection]: (state[collection] as unknown as { id: string }[]).filter((r) => r.id !== id),
  } as DemoState);
}

// Identifiant lisible, distinct des données d'exemple pour qu'on voie du premier
// coup d'œil ce qui a été créé pendant la démonstration. Le suffixe aléatoire
// évite une collision avec ce que l'onglet a déjà conservé : un compteur simple
// repart à zéro au rechargement de page et fabriquerait des doublons.
export function demoId(prefix: string): string {
  return `${prefix}-demo-${Math.random().toString(36).slice(2, 9)}`;
}

/* ── Accès depuis les écrans ── */
// Le décor conservé dans l'onglet est repris après le premier affichage : le
// magasin prévient lui-même les écrans abonnés, aucun état React n'est requis.
export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { hydrate(); }, []);
  return <>{children}</>;
}

export function useDemoStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const actions = useMemo(() => ({
    updateVehicle: (id: string, delta: Partial<DemoVehicle>) => update<DemoVehicle>("vehicles", id, delta),
    removeVehicle: (id: string) => remove("vehicles", id),
    addVehicle: (row: DemoVehicle) => insert("vehicles", row),

    addAppointment: (row: DemoAppointment) => insert("appointments", row),
    updateAppointment: (id: string, delta: Partial<DemoAppointment>) => update<DemoAppointment>("appointments", id, delta),
    removeAppointment: (id: string) => remove("appointments", id),

    addClient: (row: DemoClient) => insert("clients", row),
    updateClient: (id: string, delta: Partial<DemoClient>) => update<DemoClient>("clients", id, delta),
    removeClient: (id: string) => remove("clients", id),

    addQuote: (row: DemoQuote) => insert("quotes", row),
    updateQuote: (id: string, delta: Partial<DemoQuote>) => update<DemoQuote>("quotes", id, delta),
    removeQuote: (id: string) => remove("quotes", id),

    reset: resetDemo,
  }), []);

  return { ...snapshot, actions, reset: resetDemo };
}
