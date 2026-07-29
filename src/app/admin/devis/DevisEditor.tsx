"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown, Copy, FileText, GripVertical, Loader2, Lock, Maximize2, Move, RefreshCw, RotateCcw, Send, Trash2, Undo2, Users, X } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { matchesSearch } from "@/lib/vehicules";
import {
  computeTotals,
  formatEuro,
  formatDateFr,
  kindDefaults,
  blockBox,
  headerHeightFor,
  lineTotal,
  lineGross,
  lineDiscount,
  presetsFor,
  REPRISE_DESIGNATION,
  type LinePreset,
  UNIT_OPTIONS,
  ACCENT_PRESETS,
  type DocTheme,
  type QuoteData,
  type QuoteItem,
  type TvaMode,
  type DepositMode,
  type QuoteStatus,
  type LogoAlign,
  type QuoteKind,
  type HeaderBlockId,
  type VehicleBlock,
  emptyVehicleBlock,
} from "@/lib/devis";
import DevisDocument from "./DevisDocument";
import {
  T,
  TONE,
  SectionCard,
  fieldClass,
  fieldStyle,
  labelClass,
  btnPrimaryClass,
  btnPrimaryStyle,
  btnGhostClass,
  btnGhostStyle,
  StatusBadge,
} from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";
import EnvoiDialog from "./EnvoiDialog";

export type VehicleLite = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel: string;
  transmission: string;
  power: number | null;
  status?: string;
  // Achat + frais engagés, en centimes.
  costCents?: number;
  color?: string;
  origin?: string;
  // Identité administrative, venue du dossier d'immatriculation.
  vin?: string;
  plate?: string;
  firstRegDate?: string;
  photoUrl?: string;
};

// Identité du véhicule à imprimer, recopiée d'une fiche du stock.
function blockFromVehicle(v: VehicleLite, precedent: VehicleBlock): VehicleBlock {
  const energie = [v.fuel, v.transmission].filter(Boolean).join(" · ");
  return {
    // Le devis affiche le véhicule dès qu'on le prend au stock : c'est la
    // raison d'être de l'encart. Le choix contraire, une fois fait, se garde.
    show: true,
    label: `${v.make} ${v.model}${v.year ? ` — ${v.year}` : ""}`,
    vin: v.vin ?? "",
    plate: v.plate ?? "",
    firstRegDate: v.firstRegDate ?? "",
    mileageKm: v.mileage ?? 0,
    energy: energie,
    color: v.color ?? "",
    origin: v.origin ?? "",
    photoUrl: v.photoUrl ?? "",
    // Ce qui a été saisi à la main et que le stock ignore se conserve.
    ...(precedent.vin && !v.vin ? { vin: precedent.vin } : {}),
    ...(precedent.plate && !v.plate ? { plate: precedent.plate } : {}),
    ...(precedent.firstRegDate && !v.firstRegDate ? { firstRegDate: precedent.firstRegDate } : {}),
  };
}

const A4_W = 793.7; // 210 mm @ 96 dpi
// Marges de la feuille (voir .devis-sheet dans DevisDocument) : les positions
// libres du logo et des blocs sont exprimées À L'INTÉRIEUR de ces marges.
const SHEET_PAD_X_MM = 16;
const SHEET_PAD_Y_MM = 15;
const CONTENT_W_MM = 210 - SHEET_PAD_X_MM * 2; // 178 mm utiles

// Grammaire du tableau des lignes.
const colHead = "text-[9.5px] tracking-[0.14em] uppercase";
const lineBtn = "adm-act inline-flex items-center justify-center flex-shrink-0 w-7 h-7";

let _seq = 0;
const newId = () => `it_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

// ── Brouillon local ──
// Lecture unique par clé : le brouillon présent à l'ouverture reste la référence,
// et les écritures suivantes (celles de la saisie en cours) le laissent tranquille.
const draftCache = new Map<string, string | null>();
function readDraft(key: string): string | null {
  if (!draftCache.has(key)) {
    try {
      draftCache.set(key, localStorage.getItem(key));
    } catch {
      draftCache.set(key, null);
    }
  }
  return draftCache.get(key) ?? null;
}
const subscribeDraft = () => () => {};

// Lecture d'un montant saisi ou collé, quel que soit son format d'origine :
// « 15 490,00 », « 15.490,00 », « 15,490.00 », « 15.490 » et « -8 500 » donnent
// tous la valeur attendue. Le signe moins est conservé (ligne de reprise).
export function parseAmount(s: string): number {
  const raw = String(s ?? "").trim();
  const negative = /^[-−]/.test(raw);
  const t = raw.replace(/[^\d.,]/g, "");
  if (!t) return 0;

  const lastDot = t.lastIndexOf(".");
  const lastComma = t.lastIndexOf(",");
  let dec = -1;
  if (lastDot >= 0 && lastComma >= 0) {
    // Les deux séparateurs : le dernier porte les décimales, l'autre les milliers.
    dec = Math.max(lastDot, lastComma);
  } else if (lastDot >= 0 || lastComma >= 0) {
    const i = Math.max(lastDot, lastComma);
    const repeated = t.split(t[i]).length - 1 > 1;
    // Un groupe de trois chiffres derrière un entier court est un séparateur de
    // milliers : « 15.490 » vaut 15 490 et non 15,49.
    const thousands = repeated || (t.length - i - 1 === 3 && i > 0 && i <= 3);
    dec = thousands ? -1 : i;
  }

  const digits = (v: string) => v.replace(/[.,]/g, "");
  const intPart = digits(dec >= 0 ? t.slice(0, dec) : t) || "0";
  const fracPart = dec >= 0 ? digits(t.slice(dec + 1)) : "";
  const n = parseFloat(`${intPart}.${fracPart || "0"}`);
  if (!isFinite(n)) return 0;
  return negative ? -n : n;
}

export default function DevisEditor({
  initial,
  vehicles,
  isEdit,
  sourceQuote = null,
  canFinance = false,
  canUnlock = false,
  canBranding = false,
  sentAt = "",
  publicToken = null,
}: {
  initial: QuoteData;
  vehicles: VehicleLite[];
  isEdit: boolean;
  // Devis d'origine d'une facture, pour le lien de retour.
  sourceQuote?: { id: string; number: string } | null;
  canFinance?: boolean;
  canUnlock?: boolean;
  // L'identité du document appartient aux réglages de la marque : hors de ce
  // droit, elle se consulte mais ne se réécrit pas devis par devis.
  canBranding?: boolean;
  // Envoi déjà effectué : la proposition d'envoyer cesse alors de revenir.
  sentAt?: string;
  publicToken?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState<QuoteData>(initial);
  // Tampons de frappe : la valeur brute reste telle que tapée le temps de la
  // saisie, sinon la virgule disparaît sous les doigts et « 12,5 » devient 125.
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(initial.items.map((it) => [it.id, it.unitPrice ? String(it.unitPrice) : ""]))
  );
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(initial.items.map((it) => [it.id, it.discount ? String(it.discount) : ""]))
  );
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
  const [depositInput, setDepositInput] = useState(() => (initial.depositValue ? String(initial.depositValue) : ""));
  const [kmInput, setKmInput] = useState(() => (initial.vehicle.mileageKm ? formatNumber(initial.vehicle.mileageKm) : ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [prestaOpen, setPrestaOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  // Devis qui vient d'être enregistré : déclenche le message de confirmation.
  const [created, setCreated] = useState<{ id: string; number: string; nouveau: boolean } | null>(null);
  // Fenêtre d'envoi, ouverte depuis cette confirmation.
  const [envoiOpen, setEnvoiOpen] = useState(false);
  // Reste faux tant que le client n'a rien reçu : c'est ce qui décide si l'on
  // propose l'envoi après un enregistrement.
  const [envoye, setEnvoye] = useState(!!sentAt);
  const [draftDismissed, setDraftDismissed] = useState(false);
  const savingRef = useRef(false);

  // Un document accepté ou facturé se fige : le retaper librement, facture
  // marquée payée comprise, referme une démonstration devant un gérant.
  const isFacture = initial.docType === "facture";
  const [unlocked, setUnlocked] = useState(false);
  const shouldLock = isFacture || initial.status === "accepte";
  const locked = shouldLock && !unlocked;
  const [paying, setPaying] = useState(false);
  // Aperçu : niveau de zoom, plein écran, et mode « mise en page » explicite.
  const [zoom, setZoom] = useState<"fit" | 0.75 | 1>("fit");
  const [fullscreen, setFullscreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(initial.paymentStatus);
  const [paidDate, setPaidDate] = useState(initial.paidDate);

  // Copie de la saisie en cours, lue après l'aller-retour réseau pour savoir si
  // quelque chose a changé entre-temps.
  const qRef = useRef(q);
  useEffect(() => {
    qRef.current = q;
  }, [q]);

  /* ── Table des lignes ── */
  // Détail replié par défaut : il ne s'ouvre que s'il porte du texte.
  const [openDetail, setOpenDetail] = useState<Set<string>>(
    () => new Set(initial.items.filter((it) => it.detail).map((it) => it.id)),
  );
  const [lineUndo, setLineUndo] = useState<{ label: string; run: () => void } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pickerIndex, setPickerIndex] = useState(0);
  const desigRefs = useRef(new Map<string, HTMLInputElement>());
  const pendingFocus = useRef<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const prestaRef = useRef<HTMLDivElement>(null);

  // Le champ n'existe pas encore au moment de l'ajout : on vise le rendu suivant.
  const focusLater = useCallback((id: string) => {
    pendingFocus.current = id;
  }, []);
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    desigRefs.current.get(id)?.focus();
  }, [q.items]);

  useEffect(() => {
    if (!lineUndo) return;
    const t = setTimeout(() => setLineUndo(null), 8000);
    return () => clearTimeout(t);
  }, [lineUndo]);

  const totals = useMemo(() => computeTotals(q), [q]);

  /* ── Fichier clients ── */
  type CrmClient = { id: string; name: string; company: string; email: string; phone: string };
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const clientsAsked = useRef(false);

  // Le fichier se lit une seule fois, à la première frappe.
  const loadClients = useCallback(() => {
    if (clientsAsked.current) return;
    clientsAsked.current = true;
    fetch("/api/admin/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: CrmClient[]) => {
        setClients(Array.isArray(rows) ? rows : []);
        setClientsLoaded(true);
      })
      .catch(() => setClientsLoaded(true));
  }, []);

  const clientMatches = useMemo(() => {
    const s = clientSearch.trim();
    if (!s) return [];
    return clients
      .filter((c) => matchesSearch(`${c.name} ${c.company} ${c.email} ${c.phone}`, s))
      .slice(0, 8);
  }, [clients, clientSearch]);

  function pickClient(c: CrmClient) {
    update({
      clientId: c.id,
      clientName: c.name,
      clientCompany: c.company,
      clientEmail: c.email,
      clientPhone: c.phone,
    });
    setClientSearch("");
  }

  // Marge : total du devis moins ce que les véhicules ont coûté (achat + frais).
  // La donnée existait dans le suivi du stock et restait invisible là où se
  // prennent les décisions de prix.
  const vehicleCostEuros = useMemo(() => {
    const ids = new Set(q.items.map((it) => it.vehicleId).filter(Boolean) as string[]);
    let cents = 0;
    for (const id of ids) cents += vehicles.find((v) => v.id === id)?.costCents ?? 0;
    return Math.round(cents) / 100;
  }, [q.items, vehicles]);
  const margin = Math.round((totals.totalTTC - vehicleCostEuros) * 100) / 100;

  function update(patch: Partial<QuoteData>) {
    setQ((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }
  function updateBranding(patch: Partial<QuoteData["branding"]>) {
    setQ((prev) => ({ ...prev, branding: { ...prev.branding, ...patch } }));
    setDirty(true);
  }
  function updateVehicle(patch: Partial<VehicleBlock>) {
    setQ((prev) => ({ ...prev, vehicle: { ...prev.vehicle, ...patch } }));
    setDirty(true);
  }
  // Bascule le type de devis et applique les défauts (TVA + conditions) correspondants.
  function setKind(kind: QuoteKind) {
    const d = kindDefaults(kind);
    setQ((prev) => ({ ...prev, kind, tvaMode: d.tvaMode, paymentTerms: d.paymentTerms }));
    setDirty(true);
  }
  // Ajoute une ligne à la fin et y place le curseur : le geste s'enchaîne sans
  // avoir à remonter chercher le champ.
  function appendItem(it: QuoteItem, priceText = "", discountText = "") {
    setPriceInputs((x) => ({ ...x, [it.id]: priceText }));
    setDiscountInputs((x) => ({ ...x, [it.id]: discountText }));
    setQ((prev) => ({ ...prev, items: [...prev.items, it] }));
    setDirty(true);
    if (it.detail) setOpenDetail((s) => new Set(s).add(it.id));
    focusLater(it.id);
  }

  function addPreset(p: LinePreset) {
    appendItem(
      { id: newId(), designation: p.designation, detail: p.detail, qty: 1, unitPrice: p.unitPrice ?? 0, unit: p.unit },
      p.unitPrice ? formatNumber(p.unitPrice) : "",
    );
    setPrestaOpen(false);
  }

  // Reprise : le montant vient en déduction du devis, donc négatif.
  function addReprise() {
    appendItem({ id: newId(), designation: REPRISE_DESIGNATION, detail: "", qty: 1, unitPrice: 0 });
    setPrestaOpen(false);
    setPickerOpen(false);
  }

  function addFreeLine() {
    appendItem({ id: newId(), designation: "", detail: "", qty: 1, unitPrice: 0 });
  }

  function updateItem(id: string, patch: Partial<QuoteItem>) {
    setQ((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
    setDirty(true);
  }

  function duplicateItem(id: string) {
    const src = q.items.find((it) => it.id === id);
    if (!src) return;
    const copy: QuoteItem = { ...src, id: newId() };
    const i = q.items.findIndex((it) => it.id === id);
    setPriceInputs((x) => ({ ...x, [copy.id]: src.unitPrice ? formatNumber(src.unitPrice) : "" }));
    setDiscountInputs((x) => ({ ...x, [copy.id]: src.discount ? String(src.discount) : "" }));
    setQ((prev) => {
      const items = [...prev.items];
      items.splice(i + 1, 0, copy);
      return { ...prev, items };
    });
    if (src.detail) setOpenDetail((s) => new Set(s).add(copy.id));
    setDirty(true);
    focusLater(copy.id);
  }

  // La suppression reste rattrapable 8 secondes : la croix effaçait jusqu'ici
  // désignation, détail, prix et remise sans retour possible.
  function removeItem(id: string) {
    const index = q.items.findIndex((it) => it.id === id);
    const gone = q.items[index];
    if (!gone) return;
    const priceText = priceInputs[id] ?? "";
    const discountText = discountInputs[id] ?? "";
    setQ((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
    setDirty(true);
    setLineUndo({
      label: gone.designation ? `Ligne « ${gone.designation} » supprimée.` : "Ligne supprimée.",
      run: () => {
        setPriceInputs((x) => ({ ...x, [id]: priceText }));
        setDiscountInputs((x) => ({ ...x, [id]: discountText }));
        setQ((prev) => {
          const items = [...prev.items];
          items.splice(Math.min(index, items.length), 0, gone);
          return { ...prev, items };
        });
        setDirty(true);
      },
    });
  }

  function moveItem(id: string, dir: -1 | 1) {
    setQ((prev) => {
      const i = prev.items.findIndex((it) => it.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.items.length) return prev;
      const items = [...prev.items];
      [items[i], items[j]] = [items[j], items[i]];
      return { ...prev, items };
    });
    setDirty(true);
  }

  // Réordonnancement au glisser : la ligne survolée prend la place tout de suite.
  function reorder(from: number, to: number) {
    if (from === to) return;
    setQ((prev) => {
      const items = [...prev.items];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { ...prev, items };
    });
    setDirty(true);
  }
  function addVehicle(v: VehicleLite) {
    const detail = [
      v.year ? `${v.year}` : null,
      v.mileage ? `${formatNumber(v.mileage)} km` : null,
      v.fuel,
      v.transmission,
      v.power ? `${v.power} ch` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const it: QuoteItem = {
      id: newId(),
      designation: `${v.make} ${v.model}`,
      detail,
      qty: 1,
      unitPrice: v.price || 0,
      vehicleId: v.id,
    };
    setPriceInputs((p) => ({ ...p, [it.id]: v.price ? formatNumber(v.price) : "" }));
    setKmInput(v.mileage ? formatNumber(v.mileage) : "");
    setQ((prev) => ({
      ...prev,
      items: [...prev.items, it],
      vehicleId: prev.vehicleId ?? v.id,
      // Le premier véhicule pris au stock devient celui du document : numéro de
      // série, plaque et 1re mise en circulation arrivent d'eux-mêmes.
      vehicle: prev.vehicleId && prev.vehicleId !== v.id ? prev.vehicle : blockFromVehicle(v, prev.vehicle),
    }));
    setOpenDetail((s) => new Set(s).add(it.id));
    setDirty(true);
    setPickerOpen(false);
    setSearch("");
    focusLater(it.id);
  }

  // Fermeture des panneaux au clic extérieur : ils recouvraient les lignes déjà
  // saisies et ne se refermaient qu'en recliquant le bouton qui les avait ouverts.
  useEffect(() => {
    if (!pickerOpen && !prestaOpen) return;
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (pickerRef.current?.contains(t) || prestaRef.current?.contains(t)) return;
      setPickerOpen(false);
      setPrestaOpen(false);
    }
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [pickerOpen, prestaOpen]);

  // ── Filet de sécurité : brouillon conservé dans le navigateur ──
  // Même mécanique que la fiche véhicule : le travail en cours survit à une
  // fermeture d'onglet, à un retour arrière et à une coupure de connexion.
  const draftKey = `ia_devis_draft_${initial.id ?? "nouveau"}`;
  const initialJson = useMemo(() => JSON.stringify(initial), [initial]);

  const storedDraft = useSyncExternalStore(subscribeDraft, () => readDraft(draftKey), () => null);
  const draftFound = !draftDismissed && !!storedDraft && storedDraft !== initialJson;

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    draftCache.set(draftKey, null);
    setDraftDismissed(true);
  }, [draftKey]);

  const save = useCallback(async (): Promise<string | null> => {
    if (savingRef.current) return null;
    savingRef.current = true;
    setSaving(true);
    setError("");
    const sent = qRef.current;
    const sentJson = JSON.stringify(sent);
    const url = isEdit ? `/api/admin/devis/${sent.id}` : "/api/admin/devis";
    const method = isEdit ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: sentJson,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg = j.error ?? "L'enregistrement a échoué.";
        setError(msg);
        toast.error(msg);
        return null;
      }
      const saved = await res.json();
      // « Enregistré » seulement si rien n'a changé pendant l'aller-retour réseau,
      // sinon une frappe passée entre-temps serait annoncée comme enregistrée.
      if (JSON.stringify(qRef.current) === sentJson) {
        setDirty(false);
        setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        clearDraft();
      }
      const numero = saved.number ?? sent.number;
      // Un devis qui vient d'être écrit sert à être envoyé : on le propose tant
      // qu'il n'est pas parti. Une fois envoyé, l'enregistrement redevient
      // silencieux pour ne plus interrompre le travail de correction.
      if (!isEdit || !envoye) {
        setCreated({ id: saved.id as string, number: numero, nouveau: !isEdit });
      } else {
        toast.success(`Devis ${numero} enregistré.`);
      }
      router.refresh();
      return saved.id as string;
    } catch {
      setError("La connexion a échoué. Vos saisies restent à l'écran.");
      toast.error("La connexion a échoué. Vos saisies restent à l'écran.");
      return null;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [isEdit, router, toast, clearDraft, envoye]);

  async function saveAndPrint() {
    // L'onglet s'ouvre dans le geste de l'utilisateur : ouvert après l'attente
    // réseau, il serait bloqué par le navigateur.
    const win = window.open("", "_blank");
    const id = await save();
    if (!id) {
      win?.close();
      return;
    }
    // Le document s'affiche dans le nouvel onglet : la confirmation de création
    // ferait doublon, le vendeur voit déjà son devis.
    setCreated(null);
    if (win) win.location.href = `/admin/devis/${id}/imprimer`;
  }

  // Écriture du brouillon à chaque modification.
  useEffect(() => {
    if (!dirty) return;
    try {
      const d = JSON.stringify(q);
      if (d !== initialJson) localStorage.setItem(draftKey, d);
    } catch {
      /* ignore */
    }
  }, [q, dirty, draftKey, initialJson]);

  function restoreDraft() {
    if (!storedDraft) return;
    let d: QuoteData;
    try {
      d = JSON.parse(storedDraft) as QuoteData;
    } catch {
      setDraftDismissed(true);
      return;
    }
    setQ(d);
    setPriceInputs(Object.fromEntries(d.items.map((it) => [it.id, it.unitPrice ? String(it.unitPrice) : ""])));
    setDiscountInputs(Object.fromEntries(d.items.map((it) => [it.id, it.discount ? String(it.discount) : ""])));
    setDepositInput(d.depositValue ? String(d.depositValue) : "");
    setDirty(true);
    setDraftDismissed(true);
  }

  // Alerte du navigateur tant que des modifications restent à enregistrer.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (dirty && !savingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Ctrl+S enregistre, Échap referme le panneau ouvert.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "s" || e.key === "S") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Tant que la confirmation de création est ouverte, un second Ctrl+S
        // créerait un deuxième devis identique.
        if (!created) void save();
        return;
      }
      if (e.key === "Escape") {
        setPickerOpen(false);
        setPrestaOpen(false);
        setFullscreen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, created]);

  // Encaissement d'une facture, depuis sa propre fiche.
  async function togglePaid() {
    setPaying(true);
    try {
      const next = paymentStatus !== "payee";
      const res = await fetch(`/api/admin/devis/${initial.id}/paiement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setPaymentStatus(j.paymentStatus);
      setPaidDate(j.paidDate ?? "");
      toast.success(next ? "Facture marquée payée." : "Facture remise en impayée.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La mise à jour a échoué.");
    } finally {
      setPaying(false);
    }
  }

  function leave() {
    if (dirty) {
      setLeaveOpen(true);
      return;
    }
    router.push(isFacture ? "/admin/factures" : "/admin/devis");
  }

  // ── Aperçu live mis à l'échelle ──
  const wrapRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [docH, setDocH] = useState(1122);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // « Ajuster » suit la largeur du cadre ; 75 % et 100 % fixent l'échelle et
    // laissent le cadre défiler. Les 28 px retirés sont le retrait intérieur.
    const compute = () => (zoom === "fit" ? Math.min(1, (wrap.clientWidth - 28) / A4_W) : zoom);
    const ro = new ResizeObserver(() => setScale(compute()));
    ro.observe(wrap);
    setScale(compute());
    return () => ro.disconnect();
  }, [zoom]);
  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    const ro = new ResizeObserver(() => setDocH(doc.scrollHeight));
    ro.observe(doc);
    setDocH(doc.scrollHeight);
    return () => ro.disconnect();
  }, []);

  // Glisser le logo directement dans l'aperçu → position libre (mm depuis le coin haut-gauche).
  const PX_PER_MM = 96 / 25.4;
  function onLogoPointerDown(e: React.PointerEvent<HTMLImageElement>) {
    e.preventDefault();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const imgRect = e.currentTarget.getBoundingClientRect();
    // Le point de départ se mesure depuis le coin de la FEUILLE, alors que la
    // position s'applique à l'intérieur de ses marges : sans cette soustraction,
    // le logo bondissait de 1,6 cm à droite et 1,5 cm en bas à chaque prise.
    const seedX = (imgRect.left - wrapRect.left) / scale / PX_PER_MM - SHEET_PAD_X_MM;
    const seedY = (imgRect.top - wrapRect.top) / scale / PX_PER_MM - SHEET_PAD_Y_MM;
    const startX = e.clientX;
    const startY = e.clientY;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale / PX_PER_MM;
      const dy = (ev.clientY - startY) / scale / PX_PER_MM;
      updateBranding({
        logoX: clamp(seedX + dx, 0, CONTENT_W_MM - q.branding.logoSize),
        logoY: clamp(seedY + dy, 0, headerHeightFor(q) - 4),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // Déplacer un bloc d'en-tête (émetteur / destinataire / bloc DEVIS) dans l'aperçu.
  function updateBlock(id: HeaderBlockId, patch: Partial<{ x: number; y: number; w: number }>) {
    setQ((prev) => {
      const cur = prev.branding.blocks[id] ?? blockBox(prev.branding, id);
      return { ...prev, branding: { ...prev.branding, blocks: { ...prev.branding.blocks, [id]: { ...cur, ...patch } } } };
    });
    setDirty(true);
  }
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v * 10) / 10));
  function onBlockPointerDown(id: HeaderBlockId, e: React.PointerEvent) {
    e.preventDefault();
    const seed = blockBox(q.branding, id);
    const headerH = headerHeightFor(q);
    const startX = e.clientX;
    const startY = e.clientY;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale / PX_PER_MM;
      const dy = (ev.clientY - startY) / scale / PX_PER_MM;
      // Bornage sur la largeur RÉELLE du bloc : un bloc de 95 mm pouvait sortir
      // de la feuille par la droite.
      updateBlock(id, { x: clamp(seed.x + dx, 0, CONTENT_W_MM - seed.w), y: clamp(seed.y + dy, 0, Math.max(0, headerH - 8)) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  function onBlockResizePointerDown(id: HeaderBlockId, e: React.PointerEvent) {
    e.preventDefault();
    const seed = blockBox(q.branding, id);
    const startX = e.clientX;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale / PX_PER_MM;
      updateBlock(id, { w: clamp(seed.w + dx, 25, CONTENT_W_MM - seed.x) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  function resetLayout() {
    updateBranding({ logoX: null, logoY: null, blocks: { emitter: null, client: null, meta: null } });
  }

  // Recherche tolérante aux accents et à la ponctuation : « citroen » retrouve
  // « Citroën », « clio essence » retrouve la Clio. Les véhicules disponibles
  // remontent en tête, les vendus restent accessibles mais en fin de liste.
  const filteredVehicles = useMemo(() => {
    const rank = (s: string) => (s === "disponible" ? 0 : s === "reserve" ? 1 : 2);
    return vehicles
      .filter((v) => matchesSearch(`${v.make} ${v.model} ${v.year} ${v.fuel} ${v.transmission}`, search))
      .sort((a, b) => rank(a.status ?? "disponible") - rank(b.status ?? "disponible"));
  }, [vehicles, search]);

  const pickerRows = filteredVehicles.slice(0, 40);
  const clampedPicker = Math.min(pickerIndex, Math.max(0, pickerRows.length - 1));

  // Fiche du stock rattachée au devis : permet de reprendre l'identité du
  // véhicule après une mise à jour du dossier d'immatriculation.
  const stockVehicle = useMemo(() => vehicles.find((v) => v.id === q.vehicleId) ?? null, [vehicles, q.vehicleId]);

  // Flèches pour parcourir, Entrée pour choisir : le panneau se pilote au clavier.
  function onPickerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setPickerIndex((i) => Math.min(i + 1, pickerRows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPickerIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const v = pickerRows[clampedPicker];
      if (v) addVehicle(v);
    }
  }

  // Entrée enchaîne : ligne suivante, ou nouvelle ligne si on est en bas.
  function onLineKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    const next = q.items[index + 1];
    if (next) desigRefs.current.get(next.id)?.focus();
    else addFreeLine();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(330px,40%)] gap-6 items-start">
      {/* ─────────── Colonne formulaire ─────────── */}
      <div className="space-y-5">
      {/* Le fieldset désactive d'un coup tous les champs d'un document verrouillé.
          La barre de pilotage reste dehors : imprimer et revenir en arrière
          doivent rester possibles sur un document figé. */}
      <fieldset disabled={locked} className="space-y-5 block" style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {locked && (
          <div
            className="flex flex-wrap items-center gap-3 px-4 py-3"
            style={{ backgroundColor: TONE.warning.bg, border: `1px solid ${TONE.warning.bd}` }}
          >
            <Lock size={14} style={{ color: T.warning }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              {isFacture
                ? "Facture émise : son contenu est figé. Une correction passe par un avoir."
                : "Devis accepté : son contenu est figé pour rester fidèle à ce que le client a signé."}
            </span>
            {canUnlock && (
              <button
                type="button"
                onClick={() => setUnlocked(true)}
                className="text-[11px] tracking-widest uppercase ml-auto"
                style={{ color: T.warning }}
              >
                Déverrouiller pour correction
              </button>
            )}
          </div>
        )}

        {/* Suivi de paiement, à la place du statut de devis */}
        {isFacture && (
          <SectionCard title="Paiement">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase px-3 py-1.5"
                style={{
                  backgroundColor: paymentStatus === "payee" ? TONE.success.bg : TONE.warning.bg,
                  border: `1px solid ${paymentStatus === "payee" ? TONE.success.bd : TONE.warning.bd}`,
                  color: paymentStatus === "payee" ? T.success : T.warning,
                }}
              >
                {paymentStatus === "payee" ? <><Check size={12} /> Payée{paidDate ? ` le ${formatDateFr(paidDate)}` : ""}</> : "Impayée"}
              </span>
              {canFinance ? (
                <button type="button" onClick={togglePaid} disabled={paying} className={btnGhostClass} style={btnGhostStyle}>
                  {paying ? <Loader2 size={13} className="animate-spin" /> : paymentStatus === "payee" ? <RotateCcw size={13} /> : <Check size={13} />}
                  {paymentStatus === "payee" ? "Remettre en impayée" : "Marquer payée"}
                </button>
              ) : (
                <span className="text-[12px]" style={{ color: T.muted }}>Le suivi des paiements est tenu par le patron et le gestionnaire.</span>
              )}
              {sourceQuote && (
                <Link href={`/admin/devis/${sourceQuote.id}`} className="text-[11px] tracking-widest uppercase ml-auto" style={{ color: T.accent }}>
                  Voir le devis {sourceQuote.number}
                </Link>
              )}
            </div>
          </SectionCard>
        )}

        {draftFound && (
          <div
            className="flex flex-wrap items-center gap-3 px-4 py-3"
            style={{ backgroundColor: "rgba(107,159,238,0.08)", border: `1px solid ${T.accent}` }}
          >
            <span className="text-sm" style={{ color: T.textDim }}>
              Un brouillon non enregistré a été retrouvé.
            </span>
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={restoreDraft} className="text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
                Restaurer
              </button>
              <button type="button" onClick={clearDraft} className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>
                Ignorer
              </button>
            </div>
          </div>
        )}

        {/* Type de devis — hors facture : bascule la TVA et les conditions */}
        {!isFacture && (
        <SectionCard title="Type de devis">
          <div className="flex gap-2">
            {([
              ["vehicule", "Vente de véhicule", "Prix TTC, TVA sur marge, depuis le stock"],
              ["prestation", "Prestation (site web / IA)", "HT + TVA 20 %, bibliothèque de prestations"],
            ] as [QuoteKind, string, string][]).map(([val, lab, hint]) => {
              const active = q.kind === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setKind(val)}
                  className="flex-1 text-left p-3 border transition-colors"
                  style={{
                    borderColor: active ? T.accent : T.border,
                    backgroundColor: active ? "var(--adm-accent-soft)" : "transparent",
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: active ? T.text : T.textDim }}>{lab}</div>
                  <div className="text-[11px] mt-1" style={{ color: T.muted }}>{hint}</div>
                </button>
              );
            })}
          </div>
        </SectionCard>
        )}

        {/* Client */}
        <SectionCard title="Client">
          {/* Le client se choisit dans le fichier au lieu de se retaper. Le lien
              posé ici fait remonter le devis sur la fiche CRM et fait avancer
              le pipeline commercial à l'envoi puis à l'acceptation. */}
          <div className="relative">
            {q.clientId ? (
              <div className="flex flex-wrap items-center gap-3 px-3 py-2.5" style={{ backgroundColor: "var(--adm-accent-soft)", border: `1px solid ${T.accent}` }}>
                <Users size={14} style={{ color: T.accent }} />
                <span className="text-sm" style={{ color: T.textDim }}>
                  Fiche client liée : {q.clientCompany || q.clientName || "sans nom"}
                </span>
                <Link href={`/admin/clients/${q.clientId}`} className="text-[11px] tracking-widest uppercase ml-auto" style={{ color: T.accent }}>
                  Ouvrir la fiche
                </Link>
                <button type="button" onClick={() => update({ clientId: null })} className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>
                  Détacher
                </button>
              </div>
            ) : (
              <>
                <label className="block">
                  <span className={labelClass} style={{ color: T.muted }}>Rechercher un client</span>
                  <input
                    className={fieldClass}
                    style={fieldStyle}
                    value={clientSearch}
                    onFocus={loadClients}
                    onChange={(e) => { setClientSearch(e.target.value); loadClients(); }}
                    placeholder="Nom, société, email ou téléphone"
                    aria-label="Rechercher un client dans le fichier"
                  />
                </label>
                {clientSearch.trim() !== "" && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-[240px] overflow-auto" style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(4,11,22,0.5)" }}>
                    {clientMatches.length === 0 ? (
                      <div className="px-3 py-3 flex items-center gap-3">
                        <span className="text-[13px]" style={{ color: T.muted }}>
                          {clientsLoaded ? "Aucune fiche à ce nom." : "Lecture du fichier…"}
                        </span>
                        {clientsLoaded && (
                          <Link href="/admin/clients" className="text-[11px] tracking-widest uppercase ml-auto" style={{ color: T.accent }}>
                            Créer une fiche
                          </Link>
                        )}
                      </div>
                    ) : (
                      clientMatches.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickClient(c)}
                          className="w-full text-left px-3 py-2 transition-colors hover:bg-[#112240]"
                        >
                          <span className="block text-sm" style={{ color: T.text }}>{c.company || c.name}</span>
                          <span className="block text-[11px]" style={{ color: T.muted }}>
                            {[c.company ? c.name : "", c.email, c.phone].filter(Boolean).join(" · ")}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Société (optionnel)">
              <input className={fieldClass} style={fieldStyle} value={q.clientCompany} onChange={(e) => update({ clientCompany: e.target.value })} placeholder="TransakAuto Bruxelles" />
            </Field>
            <Field label="Nom du client">
              <input className={fieldClass} style={fieldStyle} value={q.clientName} onChange={(e) => update({ clientName: e.target.value })} placeholder="M. Dupont" />
            </Field>
          </div>
          <Field label="Adresse">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={2} value={q.clientAddress} onChange={(e) => update({ clientAddress: e.target.value })} placeholder="12 rue de la Paix&#10;75002 Paris" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input className={fieldClass} style={fieldStyle} value={q.clientEmail} onChange={(e) => update({ clientEmail: e.target.value })} placeholder="client@email.com" />
            </Field>
            <Field label="Téléphone">
              <input className={fieldClass} style={fieldStyle} value={q.clientPhone} onChange={(e) => update({ clientPhone: e.target.value })} placeholder="+33 6 00 00 00 00" />
            </Field>
          </div>
        </SectionCard>

        {/* Lignes */}
        <SectionCard title="Lignes du devis">
          {/* ── Tableau des lignes ──
              Colonnes alignées sur celles du document : quatre lignes tiennent
              dans un écran là où les anciennes cartes en remplissaient un. */}
          <div className="@container">
            {q.items.length === 0 ? (
              <div className="px-4 py-8 text-center" style={{ border: `1px dashed ${T.border}` }}>
                <p className="text-sm" style={{ color: T.textDim }}>Ce devis attend sa première ligne.</p>
                <p className="text-[12px] mt-1" style={{ color: T.muted }}>
                  Tirez un véhicule du stock, piochez dans les frais courants, ou écrivez une ligne libre.
                </p>
              </div>
            ) : (
              <div style={{ border: `1px solid ${T.border}` }}>
                {/* En-têtes */}
                <div
                  className="hidden @[560px]:grid items-center gap-x-1.5 px-2 py-2
                             grid-cols-[16px_minmax(150px,1fr)_46px_88px_72px_92px]
                             @[720px]:grid-cols-[16px_minmax(180px,1fr)_46px_72px_96px_78px_98px]"
                  style={{ backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}
                >
                  <span />
                  <span className={colHead}>Désignation</span>
                  <span className={`${colHead} text-right`}>Qté</span>
                  <span className={`${colHead} hidden @[720px]:block`}>Unité</span>
                  <span className={`${colHead} text-right`}>{q.tvaMode === "tva20" ? "P.U. HT" : "P.U."}</span>
                  <span className={`${colHead} text-right`}>Remise</span>
                  <span className={`${colHead} text-right`}>Total</span>
                </div>

                {q.items.map((it, i) => {
                  const detailOpen = openDetail.has(it.id) || !!it.detail;
                  const negative = lineTotal(it) < 0;
                  return (
                    <div
                      key={it.id}
                      onDragOver={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) { reorder(dragIndex, i); setDragIndex(i); } }}
                      className="group relative grid items-center gap-x-1.5 gap-y-1 px-2 py-1.5
                                 grid-cols-[16px_1fr]
                                 @[560px]:grid-cols-[16px_minmax(150px,1fr)_46px_88px_72px_92px]
                                 @[720px]:grid-cols-[16px_minmax(180px,1fr)_46px_72px_96px_78px_98px]"
                      style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}`, backgroundColor: dragIndex === i ? "rgba(107,159,238,0.08)" : undefined }}
                    >
                      {/* Poignée de déplacement */}
                      <span
                        draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragEnd={() => setDragIndex(null)}
                        title="Glisser pour déplacer la ligne"
                        className="flex items-center justify-center cursor-grab active:cursor-grabbing"
                        style={{ color: T.muted, height: 30 }}
                      >
                        <GripVertical size={13} />
                      </span>

                      {/* Désignation + détail replié */}
                      <div className="min-w-0">
                        <input
                          ref={(el) => { if (el) desigRefs.current.set(it.id, el); else desigRefs.current.delete(it.id); }}
                          className="w-full px-2 py-1.5 text-sm"
                          style={{ ...fieldStyle, backgroundColor: "transparent", borderColor: "transparent" }}
                          value={it.designation}
                          onChange={(e) => updateItem(it.id, { designation: e.target.value })}
                          onKeyDown={(e) => onLineKeyDown(e, i)}
                          placeholder="Désignation"
                          aria-label={`Désignation de la ligne ${i + 1}`}
                        />
                        {detailOpen && (
                          // Multi-ligne : les retours saisis se retrouvent tels quels sur le document.
                          <textarea
                            className="w-full px-2 py-1 text-[12px] overflow-hidden"
                            style={{ ...fieldStyle, backgroundColor: "transparent", borderColor: "transparent", color: T.muted, resize: "none" }}
                            rows={1}
                            ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }}
                            value={it.detail}
                            onChange={(e) => {
                              // La zone suit son contenu : les retours à la ligne saisis
                              // ici se retrouvent tels quels sur le document.
                              e.target.style.height = "auto";
                              e.target.style.height = `${e.target.scrollHeight}px`;
                              updateItem(it.id, { detail: e.target.value });
                            }}
                            placeholder="Détail (année, km, options…)"
                            aria-label={`Détail de la ligne ${i + 1}`}
                          />
                        )}
                      </div>

                      <input
                        inputMode="decimal"
                        className="px-1.5 py-1.5 text-sm text-right hidden @[560px]:block"
                        style={fieldStyle}
                        value={qtyInputs[it.id] ?? String(it.qty)}
                        onChange={(e) => {
                          setQtyInputs((x) => ({ ...x, [it.id]: e.target.value }));
                          updateItem(it.id, { qty: Math.max(0, parseAmount(e.target.value)) });
                        }}
                        onBlur={() => setQtyInputs((x) => ({ ...x, [it.id]: String(it.qty) }))}
                        onKeyDown={(e) => onLineKeyDown(e, i)}
                        aria-label={`Quantité de la ligne ${i + 1}`}
                      />

                      <select
                        className="px-1 py-1.5 text-[12px] hidden @[720px]:block"
                        style={fieldStyle}
                        value={it.unit ?? ""}
                        onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                        aria-label={`Unité de la ligne ${i + 1}`}
                      >
                        <option value="">—</option>
                        {UNIT_OPTIONS.filter(Boolean).map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>

                      <span className="relative hidden @[560px]:block">
                        <input
                          inputMode="decimal"
                          className="w-full px-2 py-1.5 text-sm text-right pr-5"
                          style={{ ...fieldStyle, color: negative ? T.warning : T.text }}
                          value={priceInputs[it.id] ?? (it.unitPrice ? String(it.unitPrice) : "")}
                          onChange={(e) => {
                            setPriceInputs((p) => ({ ...p, [it.id]: e.target.value }));
                            updateItem(it.id, { unitPrice: parseAmount(e.target.value) });
                          }}
                          // Remise en forme à la sortie du champ : le vendeur voit
                          // que « 15.490,00 » a bien été compris comme 15 490 €.
                          onBlur={() => setPriceInputs((p) => ({ ...p, [it.id]: it.unitPrice ? formatNumber(it.unitPrice) : "" }))}
                          onKeyDown={(e) => onLineKeyDown(e, i)}
                          placeholder="0"
                          aria-label={`Prix unitaire de la ligne ${i + 1}`}
                        />
                        <span className="absolute pointer-events-none" style={{ right: 6, top: 7, color: T.muted, fontSize: "0.72rem" }}>€</span>
                      </span>

                      <span className="hidden @[560px]:flex">
                        <input
                          inputMode="decimal"
                          className="w-full min-w-0 px-1.5 py-1.5 text-sm text-right"
                          style={fieldStyle}
                          value={discountInputs[it.id] ?? (it.discount ? String(it.discount) : "")}
                          onChange={(e) => {
                            setDiscountInputs((d) => ({ ...d, [it.id]: e.target.value }));
                            const v = Math.max(0, parseAmount(e.target.value));
                            updateItem(it.id, { discount: (it.discountKind ?? "percent") === "amount" ? v : Math.min(100, v) });
                          }}
                          placeholder="0"
                          aria-label={`Remise de la ligne ${i + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => updateItem(it.id, { discountKind: (it.discountKind ?? "percent") === "percent" ? "amount" : "percent" })}
                          title="Basculer entre pourcentage et montant"
                          aria-label={`Remise en ${(it.discountKind ?? "percent") === "percent" ? "pourcentage" : "euros"}, basculer`}
                          className="px-1.5 text-[12px] flex-shrink-0"
                          style={{ border: `1px solid ${T.border}`, borderLeft: "none", color: T.accent, backgroundColor: T.float }}
                        >
                          {(it.discountKind ?? "percent") === "percent" ? "%" : "€"}
                        </button>
                      </span>

                      {/* Total de la ligne : lisible sans passer par l'aperçu */}
                      <span
                        className="text-[13px] text-right whitespace-nowrap hidden @[560px]:block"
                        style={{ color: negative ? T.warning : T.text, fontVariantNumeric: "tabular-nums" }}
                      >
                        {lineDiscount(it) > 0 && (
                          <span className="block text-[11px] line-through" style={{ color: T.muted }}>{formatEuro(lineGross(it))}</span>
                        )}
                        {formatEuro(lineTotal(it))}
                      </span>

                      {/* Actions de ligne, révélées au survol */}
                      <div
                        className="adm-row-actions flex items-center justify-end gap-0.5 absolute right-1 top-1/2 -translate-y-1/2 px-1 z-10"
                        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, boxShadow: `-14px 0 14px -8px ${T.surface}` }}
                      >
                        <button type="button" onClick={() => setOpenDetail((s) => { const n = new Set(s); if (n.has(it.id)) n.delete(it.id); else n.add(it.id); return n; })} title={detailOpen ? "Masquer le détail" : "Ajouter un détail"} aria-label="Afficher ou masquer le détail" className={lineBtn} style={{ color: detailOpen ? T.accent : T.muted }} tabIndex={-1}>
                          <ChevronsUpDown size={13} />
                        </button>
                        <button type="button" onClick={() => moveItem(it.id, -1)} disabled={i === 0} title="Monter la ligne" aria-label="Monter la ligne" className={lineBtn + " disabled:opacity-25"} style={{ color: T.muted }} tabIndex={-1}>
                          <ArrowUp size={13} />
                        </button>
                        <button type="button" onClick={() => moveItem(it.id, 1)} disabled={i === q.items.length - 1} title="Descendre la ligne" aria-label="Descendre la ligne" className={lineBtn + " disabled:opacity-25"} style={{ color: T.muted }} tabIndex={-1}>
                          <ArrowDown size={13} />
                        </button>
                        <button type="button" onClick={() => duplicateItem(it.id)} title="Dupliquer la ligne" aria-label="Dupliquer la ligne" className={lineBtn} style={{ color: T.muted }} tabIndex={-1}>
                          <Copy size={13} />
                        </button>
                        <button type="button" onClick={() => removeItem(it.id)} title="Supprimer la ligne" aria-label="Supprimer la ligne" className="adm-act-danger inline-flex items-center justify-center flex-shrink-0 w-7 h-7" style={{ color: T.muted }} tabIndex={-1}>
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Prix et total repliés sous la désignation sur écran étroit */}
                      <div className="flex items-center gap-2 col-span-2 @[560px]:hidden pl-2 pb-1">
                        <input
                          inputMode="decimal"
                          className="w-24 px-2 py-1.5 text-sm"
                          style={{ ...fieldStyle, color: negative ? T.warning : T.text }}
                          value={priceInputs[it.id] ?? (it.unitPrice ? String(it.unitPrice) : "")}
                          onChange={(e) => {
                            setPriceInputs((p) => ({ ...p, [it.id]: e.target.value }));
                            updateItem(it.id, { unitPrice: parseAmount(e.target.value) });
                          }}
                          onBlur={() => setPriceInputs((p) => ({ ...p, [it.id]: it.unitPrice ? formatNumber(it.unitPrice) : "" }))}
                          placeholder="Prix"
                          aria-label={`Prix de la ligne ${i + 1}`}
                        />
                        <span className="text-[13px] ml-auto" style={{ color: negative ? T.warning : T.text, fontVariantNumeric: "tabular-nums" }}>
                          {formatEuro(lineTotal(it))}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Récapitulatif, même grammaire que le document */}
                <div className="px-3 py-2.5 flex flex-col gap-1 items-end" style={{ borderTop: `1px solid ${T.border}`, backgroundColor: T.surfaceAlt }}>
                  {totals.discountTotal > 0 && (
                    <span className="text-[12px]" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
                      Remises accordées −{formatEuro(totals.discountTotal)}
                    </span>
                  )}
                  {totals.showTva && (
                    <>
                      <span className="text-[12px]" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>Total HT {formatEuro(totals.totalHT)}</span>
                      <span className="text-[12px]" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>TVA {q.tvaRate} % {formatEuro(totals.tvaAmount)}</span>
                    </>
                  )}
                  <span className="text-[15px] font-semibold" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
                    {totals.showTva ? "Total TTC" : "Total"} {formatEuro(totals.totalTTC)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'ajout, SOUS la liste : la nouvelle ligne apparaît juste au-dessus */}
          <div className="flex flex-wrap gap-2 relative">
            <button
              type="button"
              className={q.kind === "vehicule" ? btnPrimaryClass : btnGhostClass}
              style={q.kind === "vehicule" ? btnPrimaryStyle : btnGhostStyle}
              onClick={() => { setPickerOpen((o) => !o); setPrestaOpen(false); setPickerIndex(0); }}
              aria-expanded={pickerOpen}
            >
              + Depuis le stock
            </button>
            <button
              type="button"
              className={btnGhostClass}
              style={btnGhostStyle}
              onClick={() => { setPrestaOpen((o) => !o); setPickerOpen(false); }}
              aria-expanded={prestaOpen}
            >
              {q.kind === "prestation" ? "+ Prestation" : "+ Frais & options"}
            </button>
            {q.kind === "vehicule" && (
              <button type="button" className={btnGhostClass} style={btnGhostStyle} onClick={addReprise}>
                + Reprise
              </button>
            )}
            <button type="button" className={btnGhostClass} style={btnGhostStyle} onClick={addFreeLine}>
              + Ligne libre
            </button>

            {pickerOpen && (
              <div ref={pickerRef} className="absolute z-20 bottom-full mb-2 left-0 w-full sm:w-[440px] max-h-[360px] overflow-auto p-3" style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(4,11,22,0.5)" }}>
                <input
                  autoFocus
                  className={fieldClass}
                  style={fieldStyle}
                  placeholder="Rechercher un véhicule · flèches et Entrée"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPickerIndex(0); }}
                  onKeyDown={onPickerKeyDown}
                  aria-label="Rechercher un véhicule du stock"
                />
                <div className="mt-2">
                  {pickerRows.length === 0 ? (
                    <p className="text-sm py-3" style={{ color: T.muted }}>La recherche porte sur la marque, le modèle, l&apos;année, l&apos;énergie et la boîte.</p>
                  ) : (
                    pickerRows.map((v, idx) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => addVehicle(v)}
                        onMouseEnter={() => setPickerIndex(idx)}
                        className="w-full text-left px-3 py-2 transition-colors flex items-center justify-between gap-3"
                        style={{ backgroundColor: idx === clampedPicker ? "rgba(107,159,238,0.12)" : "transparent", opacity: v.status === "vendu" ? 0.55 : 1 }}
                      >
                        <span className="min-w-0">
                          <span className="text-xs uppercase tracking-widest mr-2" style={{ color: T.accent }}>{v.make}</span>
                          <span className="text-sm" style={{ color: T.text }}>{v.model}</span>
                          <span className="text-xs ml-2" style={{ color: T.muted }}>{v.year}</span>
                        </span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                          {v.status && v.status !== "disponible" && <StatusBadge status={v.status} />}
                          <span className="text-sm" style={{ color: T.textDim }}>{formatNumber(v.price)} €</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {prestaOpen && (
              <div ref={prestaRef} className="absolute z-20 bottom-full mb-2 left-0 w-full sm:w-[440px] max-h-[360px] overflow-auto p-2" style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, boxShadow: "0 10px 30px rgba(4,11,22,0.5)" }}>
                {presetsFor(q.kind).map((p) => (
                  <button key={p.designation} type="button" onClick={() => addPreset(p)} className="w-full text-left px-3 py-2 transition-colors hover:bg-[#112240] flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm" style={{ color: T.text }}>{p.designation}</span>
                      {p.detail && <span className="block text-[11px] mt-0.5" style={{ color: T.muted }}>{p.detail}</span>}
                    </span>
                    {p.unitPrice ? (
                      <span className="text-sm flex-shrink-0" style={{ color: T.textDim }}>{formatNumber(p.unitPrice)} €</span>
                    ) : (
                      <span className="text-[11px] flex-shrink-0" style={{ color: T.muted }}>à chiffrer</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bande « Annuler » d'une suppression de ligne */}
          {lineUndo && (
            <div className="flex items-center gap-3 px-3 py-2" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
              <span className="text-[12px]" style={{ color: T.textDim }}>{lineUndo.label}</span>
              <button
                type="button"
                onClick={() => { lineUndo.run(); setLineUndo(null); }}
                className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase ml-auto"
                style={{ color: T.accent }}
              >
                <Undo2 size={12} />
                Annuler
              </button>
            </div>
          )}
        </SectionCard>

        {/* ── Véhicule concerné ──
            Le document annonçait « BMW Série 3 » et un prix, sans rien qui
            désigne LA voiture. Un devis de véhicule identifie sa voiture :
            numéro de série, immatriculation, première mise en circulation. */}
        {q.kind === "vehicule" && (
          <SectionCard title="Véhicule concerné">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: T.textDim }}>
              <input
                type="checkbox"
                checked={q.vehicle.show}
                onChange={(e) => updateVehicle({ show: e.target.checked })}
                style={{ accentColor: T.accent, width: 16, height: 16 }}
              />
              Afficher l&apos;encart véhicule sur le document
            </label>

            {q.vehicle.show && (
              <>
                {stockVehicle && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px]" style={{ color: T.muted }}>
                      Fiche du stock : {stockVehicle.make} {stockVehicle.model}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateVehicle(blockFromVehicle(stockVehicle, emptyVehicleBlock()));
                        setKmInput(stockVehicle.mileage ? formatNumber(stockVehicle.mileage) : "");
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase"
                      style={{ color: T.accent }}
                    >
                      <RefreshCw size={12} />
                      Reprendre depuis la fiche
                    </button>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Désignation">
                    <input className={fieldClass} style={fieldStyle} value={q.vehicle.label} onChange={(e) => updateVehicle({ label: e.target.value })} placeholder="BMW Série 3 320d — 2021" />
                  </Field>
                  <Field label="Immatriculation">
                    <input className={fieldClass} style={fieldStyle} value={q.vehicle.plate} onChange={(e) => updateVehicle({ plate: e.target.value.toUpperCase() })} placeholder="AB-123-CD" />
                  </Field>
                  <Field label="Numéro de série (VIN)">
                    <input
                      className={fieldClass}
                      style={{ ...fieldStyle, fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}
                      value={q.vehicle.vin}
                      onChange={(e) => updateVehicle({ vin: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                      placeholder="WBA8E9109GK000000"
                      maxLength={17}
                    />
                  </Field>
                  <Field label="1re mise en circulation">
                    <input type="date" className={fieldClass} style={fieldStyle} value={q.vehicle.firstRegDate} onChange={(e) => updateVehicle({ firstRegDate: e.target.value })} />
                  </Field>
                  <Field label="Kilométrage">
                    <input
                      className={fieldClass}
                      style={fieldStyle}
                      value={kmInput}
                      onChange={(e) => { setKmInput(e.target.value); updateVehicle({ mileageKm: Math.round(parseAmount(e.target.value)) }); }}
                      onBlur={() => setKmInput(q.vehicle.mileageKm ? formatNumber(q.vehicle.mileageKm) : "")}
                      placeholder="86 400"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Énergie et boîte">
                    <input className={fieldClass} style={fieldStyle} value={q.vehicle.energy} onChange={(e) => updateVehicle({ energy: e.target.value })} placeholder="Diesel · Automatique" />
                  </Field>
                  <Field label="Couleur">
                    <input className={fieldClass} style={fieldStyle} value={q.vehicle.color} onChange={(e) => updateVehicle({ color: e.target.value })} placeholder="Gris Sophisto" />
                  </Field>
                  <Field label="Provenance">
                    <input className={fieldClass} style={fieldStyle} value={q.vehicle.origin} onChange={(e) => updateVehicle({ origin: e.target.value })} placeholder="Allemagne" />
                  </Field>
                </div>

                <div className="flex items-end gap-3">
                  {q.vehicle.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.vehicle.photoUrl} alt="" className="w-24 h-16 object-cover flex-shrink-0" style={{ border: `1px solid ${T.border}` }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <Field label="Photo du document">
                      <input className={fieldClass} style={fieldStyle} value={q.vehicle.photoUrl} onChange={(e) => updateVehicle({ photoUrl: e.target.value })} placeholder="/vehicules/ma-photo.jpg" />
                    </Field>
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: T.muted }}>
                  Le numéro de série et l&apos;immatriculation viennent du dossier d&apos;immatriculation
                  quand il existe. Ce qui figure ici reste figé sur le devis, même si la fiche du stock
                  évolue ensuite.
                </p>
              </>
            )}
          </SectionCard>
        )}

        {/* Fiscalité & acompte */}
        <SectionCard title="Fiscalité & acompte">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Régime de TVA">
              <select className={fieldClass} style={fieldStyle} value={q.tvaMode} onChange={(e) => update({ tvaMode: e.target.value as TvaMode })}>
                <option value="marge">TVA sur marge (occasion)</option>
                <option value="tva20">TVA 20 % (HT + TVA)</option>
                <option value="exonere">Exonéré de TVA</option>
              </select>
            </Field>
            {q.tvaMode === "tva20" && (
              <Field label="Taux de TVA (%)">
                <input type="number" min={0} step={1} className={fieldClass} style={fieldStyle} value={q.tvaRate} onChange={(e) => update({ tvaRate: parseInt(e.target.value) || 0 })} />
              </Field>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Acompte">
              <select
                className={fieldClass}
                style={fieldStyle}
                value={q.depositMode}
                onChange={(e) => {
                  // Changer de mode remet une valeur cohérente : la valeur 30 gardée
                  // telle quelle affichait « Acompte 30,00 € » sur une voiture à 50 000 €.
                  const mode = e.target.value as DepositMode;
                  const v = mode === "percent" ? 30 : 0;
                  setDepositInput(mode === "percent" ? "30" : "");
                  update({ depositMode: mode, depositValue: v });
                }}
              >
                <option value="none">Aucun</option>
                <option value="percent">Pourcentage</option>
                <option value="amount">Montant fixe (€)</option>
              </select>
            </Field>
            {q.depositMode !== "none" && (
              <Field label={q.depositMode === "percent" ? "Pourcentage (%)" : "Montant (€)"}>
                <input
                  inputMode="decimal"
                  className={fieldClass}
                  style={fieldStyle}
                  value={depositInput}
                  onChange={(e) => {
                    setDepositInput(e.target.value);
                    const v = Math.max(0, parseAmount(e.target.value));
                    update({ depositValue: q.depositMode === "percent" ? Math.min(100, v) : v });
                  }}
                  onBlur={() => setDepositInput(q.depositValue ? formatNumber(q.depositValue) : "")}
                  placeholder={q.depositMode === "percent" ? "30" : "0"}
                />
                <span className="block text-[11px] mt-1.5" style={{ color: T.muted }}>
                  soit {formatEuro(totals.deposit)} sur {formatEuro(totals.totalTTC)}
                </span>
              </Field>
            )}
          </div>
        </SectionCard>

        {/* Conditions */}
        <SectionCard title={isFacture ? "Facture & conditions" : "Devis & conditions"}>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Numéro">
              <input className={fieldClass} style={fieldStyle} value={q.number} onChange={(e) => update({ number: e.target.value })} />
            </Field>
            <Field label="Date d'émission">
              <input type="date" className={fieldClass} style={{ ...fieldStyle, colorScheme: "dark" }} value={q.issueDate} onChange={(e) => update({ issueDate: e.target.value })} />
            </Field>
            <Field label={isFacture ? "Délai de règlement (jours)" : "Validité (jours)"}>
              <input type="number" min={0} className={fieldClass} style={fieldStyle} value={q.validityDays} onChange={(e) => update({ validityDays: parseInt(e.target.value) || 0 })} />
            </Field>
          </div>
          <Field label="Conditions de règlement">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={2} value={q.paymentTerms} onChange={(e) => update({ paymentTerms: e.target.value })} />
          </Field>
          <Field label="Notes (optionnel)">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={2} value={q.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Mentions complémentaires, garantie, reprise…" />
          </Field>
          {/* Le cycle Brouillon / Envoyé / Accepté / Refusé ne concerne que le devis. */}
          {!isFacture && (
            <Field label="Statut">
              <select className={fieldClass} style={fieldStyle} value={q.status} onChange={(e) => update({ status: e.target.value as QuoteStatus })}>
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                <option value="accepte">Accepté</option>
                <option value="refuse">Refusé</option>
              </select>
            </Field>
          )}
        </SectionCard>

        {/* Émetteur, logo & mise en page */}
        <fieldset disabled={!canBranding} className="space-y-5 block" style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {!canBranding && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
            <span className="text-[13px]" style={{ color: T.muted }}>
              L&apos;identité du document vient des réglages de la marque.
            </span>
          </div>
        )}
        <SectionCard title="Émetteur, logo & mise en page">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: T.textDim }}>
            <input type="checkbox" checked={q.branding.logoVisible} onChange={(e) => updateBranding({ logoVisible: e.target.checked })} style={{ accentColor: T.accent, width: 16, height: 16 }} />
            Afficher le logo sur le devis
          </label>
          {q.branding.logoVisible && (
            <>
              {/* Le logo du document se règle ici : c'est ce qui permet d'imprimer
                  les devis sous la marque du concessionnaire. */}
              <div className="flex items-end gap-3">
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 72, height: 48, backgroundColor: "#FFFFFF", border: `1px solid ${T.border}` }}
                >
                  {q.branding.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.branding.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span style={{ color: T.border, fontSize: 18 }}>—</span>
                  )}
                </span>
                <Field label="Adresse du logo">
                  <input className={fieldClass} style={fieldStyle} value={q.branding.logoUrl} onChange={(e) => updateBranding({ logoUrl: e.target.value })} placeholder="/Logo/mon-logo.png" />
                </Field>
              </div>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: T.textDim }}>
                <input type="checkbox" checked={q.branding.logoWhite} onChange={(e) => updateBranding({ logoWhite: e.target.checked })} style={{ accentColor: T.accent, width: 16, height: 16 }} />
                Passer le logo en blanc (thème à bandeau coloré)
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Placement rapide">
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as LogoAlign[]).map((val) => {
                      const lab = val === "left" ? "Gauche" : val === "center" ? "Centre" : "Droite";
                      const active = q.branding.logoX == null && q.branding.logoAlign === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateBranding({ logoAlign: val, logoX: null, logoY: null })}
                          className="flex-1 px-2 py-2.5 text-[11px] uppercase tracking-widest border transition-colors"
                          style={{
                            borderColor: active ? T.accent : T.border,
                            color: active ? T.text : T.muted,
                            backgroundColor: active ? "var(--adm-accent-soft)" : "transparent",
                          }}
                        >
                          {lab}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label={`Taille du logo — ${q.branding.logoSize} mm`}>
                  <input type="range" min={8} max={32} step={1} value={q.branding.logoSize} onChange={(e) => updateBranding({ logoSize: parseInt(e.target.value) })} className="w-full" style={{ accentColor: T.accent }} />
                </Field>
              </div>
              {layoutMode && (
                <p className="text-[12px] -mt-1" style={{ color: T.muted }}>
                  ↔ Glissez le logo directement dans l&apos;aperçu pour le placer où vous voulez.
                </p>
              )}
            </>
          )}

          {/* Mise en page de l'en-tête */}
          <div className="pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between gap-3 flex-wrap pt-4">
              <span className="text-[12px]" style={{ color: T.muted }}>
                {layoutMode
                  ? "↔ Glissez les blocs (émetteur, client, DEVIS) dans l'aperçu. La poignée ajuste la largeur."
                  : "Le bouton « Mise en page », au-dessus de l'aperçu, débloque le déplacement des blocs."}
              </span>
              <button type="button" onClick={resetLayout} className="text-[11px] tracking-widest uppercase underline" style={{ color: T.accent }}>
                Réinitialiser la mise en page
              </button>
            </div>
            <label className="block mt-3">
              <span className={labelClass} style={{ color: T.muted }}>Hauteur de l&apos;en-tête — {q.branding.headerHeight} mm</span>
              <input type="range" min={40} max={120} step={1} value={q.branding.headerHeight} onChange={(e) => updateBranding({ headerHeight: parseInt(e.target.value) })} className="w-full" style={{ accentColor: T.accent }} />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom de l'émetteur">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterName} onChange={(e) => updateBranding({ emitterName: e.target.value })} placeholder="SASU Intelligence Automobile" />
            </Field>
            <Field label="Représentant">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterRepresentative} onChange={(e) => updateBranding({ emitterRepresentative: e.target.value })} placeholder="César Vachon" />
            </Field>
          </div>
          <Field label="Adresse de l'émetteur">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={3} value={q.branding.emitterAddress} onChange={(e) => updateBranding({ emitterAddress: e.target.value })} placeholder="30 rue Pouchet&#10;75017 Paris&#10;France" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterEmail} onChange={(e) => updateBranding({ emitterEmail: e.target.value })} placeholder="contact@…" />
            </Field>
            <Field label="Téléphone">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterPhone} onChange={(e) => updateBranding({ emitterPhone: e.target.value })} placeholder="+33 …" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="SIRET">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterSiret} onChange={(e) => updateBranding({ emitterSiret: e.target.value })} placeholder="(à compléter)" />
            </Field>
            <Field label="N° TVA intracom.">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterTva} onChange={(e) => updateBranding({ emitterTva: e.target.value })} placeholder="(à compléter)" />
            </Field>
          </div>

          {/* Coordonnées bancaires : imprimées au pied du document */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Banque">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterBank} onChange={(e) => updateBranding({ emitterBank: e.target.value })} placeholder="Qonto, Crédit Agricole…" />
            </Field>
            <Field label="BIC">
              <input className={fieldClass} style={fieldStyle} value={q.branding.emitterBic} onChange={(e) => updateBranding({ emitterBic: e.target.value })} placeholder="QNTOFRP1XXX" />
            </Field>
          </div>
          <Field label="IBAN">
            <input className={fieldClass} style={fieldStyle} value={q.branding.emitterIban} onChange={(e) => updateBranding({ emitterIban: e.target.value })} placeholder="FR76 3000 4000 0100 0000 0000 000" />
            <span className="block text-[11px] mt-1.5" style={{ color: T.muted }}>
              Imprimé au pied de chaque facture, pour que le client sache où payer.
            </span>
          </Field>

          <Field label="Mention légale de pied de page">
            <textarea className={fieldClass} style={{ ...fieldStyle, resize: "vertical" }} rows={3} value={q.branding.legalFootnote} onChange={(e) => updateBranding({ legalFootnote: e.target.value })} />
          </Field>
        </SectionCard>

        {/* Apparence du document */}
        <SectionCard title="Apparence du document">
          <Field label="Couleur d'accent">
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => updateBranding({ accentColor: c.value })}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c.value, outline: q.branding.accentColor.toLowerCase() === c.value.toLowerCase() ? `2px solid ${T.text}` : `1px solid ${T.border}`, outlineOffset: 2 }}
                />
              ))}
              <input
                type="color"
                value={q.branding.accentColor}
                onChange={(e) => updateBranding({ accentColor: e.target.value })}
                className="w-9 h-7 p-0 border-0 bg-transparent cursor-pointer"
                title="Couleur personnalisée"
              />
            </div>
          </Field>
          <Field label="Thème">
            <div className="flex gap-1">
              {([
                ["classic", "Classique"],
                ["colored", "Coloré"],
                ["minimal", "Épuré"],
              ] as [DocTheme, string][]).map(([val, lab]) => {
                const active = q.branding.theme === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateBranding({ theme: val })}
                    className="flex-1 px-2 py-2.5 text-[11px] uppercase tracking-widest border transition-colors"
                    style={{
                      borderColor: active ? T.accent : T.border,
                      color: active ? T.text : T.muted,
                      backgroundColor: active ? "var(--adm-accent-soft)" : "transparent",
                    }}
                  >
                    {lab}
                  </button>
                );
              })}
            </div>
          </Field>
        </SectionCard>
        </fieldset>

      </fieldset>

        {error && <p className="text-sm" style={{ color: T.danger }}>{error}</p>}

        {/* ── Barre de pilotage ──
            Le total, l'acompte et l'état d'enregistrement restent sous les yeux
            à toutes les largeurs d'écran, et les actions cessent d'obliger à
            redescendre trois hauteurs de page. */}
        <div
          className="sticky bottom-0 z-20 flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3"
          style={{
            border: `1px solid ${T.border}`,
            borderTop: `2px solid ${T.accent}`,
            backgroundColor: "rgba(7,15,30,0.94)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 text-[11px] whitespace-nowrap"
            style={{ color: saving ? T.muted : dirty ? T.warning : savedAt ? T.success : T.muted }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : !dirty && savedAt ? <Check size={12} /> : null}
            {saving ? "Enregistrement…" : dirty ? "Modifications en attente" : savedAt ? `Enregistré à ${savedAt}` : "Tout est enregistré"}
          </span>

          <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.16em] uppercase" style={{ color: T.muted }}>
              {totals.showTva ? "Total TTC" : "Total"}
            </span>
            <span className="text-[22px] leading-tight" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }} aria-live="polite">
              {formatEuro(totals.totalTTC)}
            </span>
            <span className="text-[11px]" style={{ color: totals.totalTTC < 0 ? T.warning : T.muted, fontVariantNumeric: "tabular-nums" }}>
              {totals.totalTTC < 0
                ? "La reprise dépasse le montant du devis."
                : (
                  <>
                    {totals.lineCount} ligne{totals.lineCount > 1 ? "s" : ""}
                    {totals.deposit > 0 && ` · Acompte ${formatEuro(totals.deposit)} · Solde ${formatEuro(totals.balance)}`}
                  </>
                )}
            </span>
          </div>

          {/* Marge : visible du vendeur seul, jamais imprimée */}
          {canFinance && vehicleCostEuros > 0 && (
            <div className="flex flex-col pl-5" style={{ borderLeft: `1px solid ${T.border}` }}>
              <span className="text-[9.5px] tracking-[0.16em] uppercase" style={{ color: T.muted }}>
                Marge estimée · visible par vous seul
              </span>
              <span
                className="text-[16px]"
                style={{ color: margin > 0 ? T.success : margin === 0 ? T.muted : T.danger, fontVariantNumeric: "tabular-nums" }}
                title={`Total ${formatEuro(totals.totalTTC)} moins le coût de revient des véhicules ${formatEuro(vehicleCostEuros)}`}
              >
                {margin >= 0 ? "+" : "−"}{formatEuro(Math.abs(margin))}
                {totals.totalTTC > 0 && ` · ${Math.round((margin / totals.totalTTC) * 100)} %`}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 ml-auto">
            {!locked && (
              <button type="button" onClick={() => void save()} disabled={saving} className={btnPrimaryClass} style={btnPrimaryStyle}>
                {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le devis"}
                <span className="text-[9px] font-normal opacity-70">Ctrl S</span>
              </button>
            )}
            <button type="button" onClick={saveAndPrint} disabled={saving} className={btnGhostClass} style={btnGhostStyle}>
              Enregistrer &amp; PDF
            </button>
            <button type="button" onClick={leave} className={btnGhostClass} style={btnGhostStyle}>
              Retour
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={leaveOpen}
          title="Des modifications restent à enregistrer."
          description="Quitter cet écran maintenant laisse ces modifications de côté. Elles restent retrouvables au prochain retour sur ce devis."
          confirmLabel="Quitter sans enregistrer"
          onConfirm={() => { setLeaveOpen(false); router.push(isFacture ? "/admin/factures" : "/admin/devis"); }}
          onCancel={() => setLeaveOpen(false)}
        />

        {/* Confirmation de création : le devis est enregistré, on le dit et on
            ramène à la liste plutôt que de laisser le formulaire encore rempli. */}
        {created && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Devis créé"
          >
            <div
              className="w-full max-w-sm p-8 text-center"
              style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${T.success}`, boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }}
            >
              <div className="flex justify-center mb-4">
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 48, height: 48, border: `1px solid ${TONE.success.bd}`, backgroundColor: TONE.success.bg, color: T.success }}
                >
                  <Check size={22} />
                </span>
              </div>
              <p className="text-lg mb-1.5" style={{ color: T.text }}>
                {created.nouveau ? "Votre devis a été créé." : "Votre devis a été enregistré."}
              </p>
              <p className="text-[13px] mb-2" style={{ color: T.muted }}>
                Devis {created.number} · {formatEuro(totals.totalTTC)}
              </p>
              <p className="text-[13px] mb-7" style={{ color: T.textDim }}>
                {q.clientEmail
                  ? `Vous pouvez l'envoyer tout de suite à ${q.clientEmail}.`
                  : "Renseignez l'email du client pour pouvoir le lui envoyer."}
              </p>

              <button
                type="button"
                autoFocus
                onClick={() => setEnvoiOpen(true)}
                className={btnPrimaryClass + " w-full py-3.5"}
                style={btnPrimaryStyle}
              >
                <Send size={14} />
                Envoyer au client
              </button>
              <button
                type="button"
                onClick={() => { setCreated(null); router.push("/admin/devis"); }}
                className={btnGhostClass + " w-full py-3 mt-2"}
                style={btnGhostStyle}
              >
                Plus tard
              </button>
              <button
                type="button"
                onClick={() => { const id = created.id; setCreated(null); router.push(`/admin/devis/${id}`); }}
                className="block w-full mt-3 text-[11px] tracking-widest uppercase"
                style={{ color: T.muted }}
              >
                Rester sur ce devis
              </button>
            </div>
          </div>
        )}

        {/* Envoi proposé dans la foulée de l'enregistrement */}
        {created && (
          <EnvoiDialog
            open={envoiOpen}
            quoteId={created.id}
            number={created.number}
            clientEmail={q.clientEmail}
            clientName={q.clientName || q.clientCompany}
            publicToken={publicToken}
            onClose={() => setEnvoiOpen(false)}
            onSent={() => { setEnvoye(true); setCreated(null); router.push("/admin/devis"); }}
          />
        )}
      </div>

      {/* ─────────── Colonne aperçu live ─────────── */}
      <div className="hidden lg:block sticky top-6">
        {/* Barre de l'aperçu : zoom, mise en page, plein écran */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>Aperçu en direct</span>
          <div className="flex ml-auto" style={{ border: `1px solid ${T.border}` }}>
            {([["fit", "Ajuster"], [0.75, "75 %"], [1, "100 %"]] as const).map(([v, lab]) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setZoom(v)}
                aria-pressed={zoom === v}
                className="adm-chip text-[10px] tracking-widest uppercase px-2.5 py-1.5 transition-colors"
                style={{ backgroundColor: zoom === v ? T.accent : "transparent", color: zoom === v ? T.bg : T.textDim }}
              >
                {lab}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLayoutMode((m) => !m)}
            aria-pressed={layoutMode}
            title="Déplacer le logo et les blocs de l'en-tête"
            className="adm-chip inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-2.5 py-1.5 border transition-colors"
            style={{ borderColor: layoutMode ? T.accent : T.border, color: layoutMode ? T.accent : T.textDim }}
          >
            <Move size={12} />
            {layoutMode ? "Terminé" : "Mise en page"}
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            title="Voir le document en grand"
            aria-label="Voir le document en grand"
            className="adm-act inline-flex items-center justify-center w-7 h-7"
            style={{ color: T.muted }}
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Cadre : hauteur bornée avec défilement interne. Sans borne, le bas du
            document (totaux, conditions, signatures) devenait inatteignable. */}
        <div
          ref={wrapRef}
          className="devis-preview"
          style={{
            position: "relative",
            width: "100%",
            maxHeight: "calc(100vh - 140px)",
            overflow: "auto",
            border: `1px solid ${T.border}`,
            backgroundColor: "#04080F",
            padding: 14,
          }}
        >
          <div style={{ position: "relative", width: A4_W * scale, height: docH * scale, margin: "0 auto", boxShadow: "0 18px 50px rgba(0,0,0,0.55)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <div ref={docRef} style={{ width: A4_W }}>
                <DevisDocument
                  quote={q}
                  editable={layoutMode}
                  onLogoPointerDown={layoutMode ? onLogoPointerDown : undefined}
                  onBlockPointerDown={layoutMode ? onBlockPointerDown : undefined}
                  onBlockResizePointerDown={layoutMode ? onBlockResizePointerDown : undefined}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="text-[11px] mt-2 text-right" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
          {totals.lineCount} ligne{totals.lineCount > 1 ? "s" : ""} · {formatEuro(totals.totalTTC)}
        </div>
      </div>

      {/* Sous 1024 px la colonne disparaît : ce bouton rend le document accessible */}
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className="lg:hidden fixed bottom-24 right-5 z-30 inline-flex items-center gap-2 px-4 py-3 text-[11px] font-semibold tracking-widest uppercase"
        style={{ backgroundColor: T.accent, color: T.bg, boxShadow: "0 10px 30px rgba(4,11,22,0.6)" }}
      >
        <FileText size={14} />
        Voir le document
      </button>

      {/* Plein écran */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[70] overflow-auto p-4 sm:p-8"
          style={{ backgroundColor: "rgba(4,8,15,0.94)", backdropFilter: "blur(6px)" }}
          onClick={() => setFullscreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu du document"
        >
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label="Fermer l'aperçu"
            className="fixed top-4 right-4 z-[71] inline-flex items-center justify-center w-9 h-9"
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}
          >
            <X size={16} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: A4_W, maxWidth: "100%", margin: "0 auto", boxShadow: "0 24px 70px rgba(0,0,0,0.6)" }}
          >
            <DevisDocument quote={q} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass} style={{ color: T.muted }}>{label}</span>
      {children}
    </label>
  );
}
