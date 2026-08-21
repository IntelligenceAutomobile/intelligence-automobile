"use client";

// Fiche d'un mandat : le contrat d'une mission, de sa préparation à sa clôture.
//
// La saisie suit le document imprimé : le mandant, le véhicule et ses
// déclarations, puis les conditions (prix, honoraires, durée, garde,
// signature). Ce qui se remplit ici se retrouve mot pour mot sur le mandat en
// 16 articles ; l'écran dit d'ailleurs quel article chaque bloc alimente.
import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Trash2, User, AlertTriangle, History, CalendarClock, Printer, Paperclip, X, Car,
  Send, Copy, CheckCircle2, Eye, ReceiptText, CalendarPlus,
} from "lucide-react";
import { upload } from "@vercel/blob/client";
import { lireMontantEuros, lireEntier } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import { formatDateFr } from "@/lib/devis";
import { KM_MAX } from "@/lib/reprise-serialize";
import { REPRISE_FUELS, CT_STATUSES, CT_STATUS_LABEL } from "@/lib/reprises";
import {
  MANDAT_STATUSES, MANDAT_STATUS_TONE, MANDAT_TYPE_DE, mandatStatusLabel,
  FEE_FORMULAS, FEE_FORMULA_LABEL, SIGN_MODES, SIGN_MODE_LABEL, CUSTODIES, CUSTODY_LABEL,
  COMMISSION_TAUX_POURCENT, COMMISSION_MIN_CENTS, COMMISSION_PLAFOND_CENTS,
  INDEMNITE_FORFAITAIRE_CENTS, commissionEstimee, echeanceMandat, mandatVehiculeLabel,
  GRILLE_RECHERCHE, GRILLE_IMPORT, IMPORT_PLAFOND_FEE_CENTS,
  honorairesRecherche, honorairesImport,
  type MandatStatus, type MandatDoc,
} from "@/lib/mandats";
import type { MandatForm } from "@/lib/mandat-form";
import {
  T, TONE, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass,
  btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle,
} from "../../ui";
import { useToast } from "../../toast";
import { ConfirmDialog } from "../../confirm";

export type MandatEventRow = { id: string; type: string; content: string; author: string; createdAt: string };

/** État de la signature en ligne, écrit côté serveur (dates relatives comprises). */
export type SignatureInfo = {
  sentAt: string;
  sentAgo: string;
  firstViewedAgo: string;
  viewCount: number;
  token: string | null;
  signerName: string;
  signedAtFr: string;
  signedIp: string;
};

export type Mandat = MandatForm;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={labelClass} style={{ color: T.textDim }}>{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1.5" style={{ color: T.muted }}>{hint}</p>}
    </div>
  );
}

const inputClass = "px-4 py-3 text-sm outline-none w-full focus:border-[#6B9FEE]";
const selectClass = "px-4 py-3 text-sm outline-none w-full cursor-pointer focus:border-[#6B9FEE]";

/* ── Case à cocher qui porte une conséquence contractuelle ── */
function Coche({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex items-start gap-3 w-full text-left px-4 py-3 transition-colors hover:bg-[rgba(107,159,238,0.05)]"
      style={{ border: `1px solid ${T.border}`, backgroundColor: T.float }}
    >
      <span
        className="flex items-center justify-center w-4 h-4 flex-shrink-0 mt-0.5"
        style={{ border: `1px solid ${checked ? T.accent : T.border}`, backgroundColor: checked ? T.accent : "transparent" }}
      >
        {checked && <span style={{ color: T.bg, fontSize: 11, lineHeight: 1 }}>✓</span>}
      </span>
      <span className="text-sm" style={{ color: checked ? T.text : T.textDim }}>{label}</span>
    </button>
  );
}

/* ── Avertissement métier, teinte ambre ── */
function Avertissement({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3" style={{ backgroundColor: TONE.warning.bg, border: `1px solid ${TONE.warning.bd}` }}>
      <AlertTriangle size={14} style={{ color: TONE.warning.fg, flexShrink: 0, marginTop: 2 }} />
      <p className="text-[12px] leading-relaxed" style={{ color: T.textDim }}>{children}</p>
    </div>
  );
}

export default function MandatFiche({
  mandat, mode, canDelete, today, evenements = [], vehiculeExiste = false, signature, regInfo, factureInfo,
}: {
  mandat: Mandat;
  mode: "creation" | "fiche";
  canDelete: boolean;
  today: string;
  evenements?: MandatEventRow[];
  /** La fiche de stock existe encore : le rattachement est une colonne nue,
      qu'aucune contrainte protège d'une suppression du véhicule. */
  vehiculeExiste?: boolean;
  /** État de l'envoi et de la signature en ligne, absent en création. */
  signature?: SignatureInfo;
  /** Dossier d'immatriculation ouvert depuis un mandat d'import. */
  regInfo?: { id: string; reference: string; statusLabel: string } | null;
  /** Facture d'honoraires créée en un clic depuis ce mandat. */
  factureInfo?: { id: string; number: string; payee: boolean } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(mandat);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [doublon, setDoublon] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);
  const [docs, setDocs] = useState<MandatDoc[]>(mandat.documents);
  const [envois, setEnvois] = useState(0);
  const [confirmEnvoi, setConfirmEnvoi] = useState(false);
  const [confirmProlonger, setConfirmProlonger] = useState(false);
  // À l'écran, le chemin suffit et reste identique côté serveur et côté
  // navigateur ; l'adresse complète se compose au moment de la copie.
  const cheminPublic = signature?.token ? `/mandat/${signature.token}` : "";
  // `busy` ne devient vrai qu'au rendu suivant : deux clics rapprochés
  // passaient tous les deux et créaient deux mandats identiques. Ce verrou-ci
  // se ferme dans le même tour d'exécution.
  const envoiEnCours = useRef(false);

  const set = <K extends keyof Mandat>(key: K, value: Mandat[K]) => setF((x) => ({ ...x, [key]: value }));

  const titre = useMemo(
    () => mandatVehiculeLabel({ make: f.make, model: f.model, version: f.version }),
    [f.make, f.model, f.version],
  );

  const estVente = f.type === "vente";
  const estImport = f.type === "import";
  const clientMot = estVente ? "vendeur" : "client";

  const enCentimes = (v: string) => {
    const lu = lireMontantEuros(v);
    return typeof lu === "number" ? lu * 100 : 0;
  };
  const prixCents = enCentimes(f.priceEuros);
  const packCents = enCentimes(f.packEuros);
  const budgetCents = enCentimes(f.budgetEuros);
  const honorairesCents = enCentimes(f.feeEuros);

  // La commission de la formule B se recalcule à chaque frappe : elle
  // s'annonce au vendeur avant de signer, jamais après. Pour la recherche et
  // l'import, la grille propose son montant selon le budget.
  const commissionCents = useMemo(() => commissionEstimee(prixCents), [prixCents]);
  const grilleCents = useMemo(
    () => (estVente ? 0 : estImport ? honorairesImport(budgetCents) : honorairesRecherche(budgetCents)),
    [estVente, estImport, budgetCents],
  );

  const echeanceLue = useMemo(
    () => echeanceMandat(f.startDate, Number(f.durationDays) || 0, today),
    [f.startDate, f.durationDays, today],
  );

  const honorairesPhrase = estVente
    ? f.feeFormula === "vendeur"
      ? commissionCents > 0 ? `commission estimée ${formatEuroCents(commissionCents)}` : ""
      : packCents > 0 ? `pack acquéreur ${formatEuroCents(packCents)}` : "frais à la charge de l'acquéreur"
    : honorairesCents > 0
      ? `honoraires ${formatEuroCents(honorairesCents)} au succès`
      : grilleCents > 0 ? `grille : ${formatEuroCents(grilleCents)}` : "";

  /** Corps de requête, après contrôle de chaque saisie chiffrée. */
  function corps(forcerRattachement = false): Record<string, unknown> | null {
    const km = lireEntier(f.mileageKm, KM_MAX);
    if (km === "invalide") {
      toast.error("Le kilométrage se saisit en chiffres, par exemple 118 000.");
      return null;
    }
    const prix = lireMontantEuros(f.priceEuros);
    if (prix === "invalide") {
      toast.error("Le prix affiché se saisit en chiffres, par exemple 15 490.");
      return null;
    }
    const plancher = lireMontantEuros(f.floorEuros);
    if (plancher === "invalide") {
      toast.error("Le prix plancher se saisit en chiffres, par exemple 14 000.");
      return null;
    }
    const pack = lireMontantEuros(f.packEuros);
    if (pack === "invalide") {
      toast.error("Le pack de livraison se saisit en chiffres, par exemple 990.");
      return null;
    }
    const budget = lireMontantEuros(f.budgetEuros);
    if (budget === "invalide") {
      toast.error("Le budget se saisit en chiffres, par exemple 35 000.");
      return null;
    }
    const honoraires0 = lireMontantEuros(f.feeEuros);
    if (honoraires0 === "invalide") {
      toast.error("Les honoraires se saisissent en chiffres, par exemple 1 490.");
      return null;
    }
    const kmMax = lireEntier(f.mileageMaxKm, KM_MAX);
    if (kmMax === "invalide") {
      toast.error("Le kilométrage plafond se saisit en chiffres.");
      return null;
    }
    const anneeMin = lireEntier(f.regMinYear, 2100);
    if (anneeMin === "invalide") {
      toast.error("L'année minimale se saisit en quatre chiffres, par exemple 2019.");
      return null;
    }
    const prixVente = lireMontantEuros(f.soldPriceEuros);
    if (prixVente === "invalide") {
      toast.error("Le prix conclu se saisit en chiffres.");
      return null;
    }
    const honoraires = lireMontantEuros(f.feeFinalEuros);
    if (honoraires === "invalide") {
      toast.error("Les honoraires facturés se saisissent en chiffres.");
      return null;
    }
    const cles = lireEntier(f.keys, 10);
    const duree = lireEntier(f.durationDays, 365);
    if (duree === "invalide") {
      toast.error("La durée se saisit en jours, par exemple 60.");
      return null;
    }

    return {
      type: f.type,
      ownerName: f.ownerName,
      ownerBirthDate: f.ownerBirthDate,
      ownerAddress: f.ownerAddress,
      ownerEmail: f.ownerEmail,
      ownerPhone: f.ownerPhone,
      ownerIdNumber: f.ownerIdNumber,
      rcPolicy: f.rcPolicy,
      rcInsurer: f.rcInsurer,
      make: f.make,
      model: f.model,
      version: f.version,
      power: f.power,
      plate: f.plate,
      vin: f.vin,
      firstRegDate: f.firstRegDate,
      mileageKm: km ?? 0,
      fuel: f.fuel,
      color: f.color,
      keys: cles === "invalide" ? 0 : cles ?? 0,
      ctDate: f.ctDate,
      ctStatus: f.ctStatus,
      lastServiceKm: f.lastServiceKm,
      disclosures: f.disclosures,
      priceCents: (prix ?? 0) * 100,
      floorCents: (plancher ?? 0) * 100,
      feeFormula: f.feeFormula,
      packCents: (pack ?? 0) * 100,
      searchSpec: f.searchSpec,
      budgetCents: (budget ?? 0) * 100,
      mileageMaxKm: kmMax ?? 0,
      regMinYear: anneeMin ?? 0,
      listingUrl: f.listingUrl,
      countryOrigin: f.countryOrigin,
      feeCents: (honoraires0 ?? 0) * 100,
      startDate: f.startDate,
      durationDays: duree ?? 60,
      custody: f.custody,
      custodyDate: f.custodyDate,
      signMode: f.signMode,
      immediateExecution: f.immediateExecution,
      signPlace: f.signPlace,
      signedOn: f.signedOn,
      soldOn: f.soldOn,
      soldPriceCents: (prixVente ?? 0) * 100,
      feeFinalCents: (honoraires ?? 0) * 100,
      outcomeNote: f.outcomeNote,
      notes: f.notes,
      status: f.status,
      vehicleId: f.vehicleId ?? "",
      forcerRattachement,
    };
  }

  async function enregistrer(forcerRattachement = false) {
    if (envoiEnCours.current) return;
    const body = corps(forcerRattachement);
    if (!body) return;

    envoiEnCours.current = true;
    setBusy(true);
    try {
      const creation = mode === "creation";
      const res = await fetch(creation ? "/api/admin/mandats" : `/api/admin/mandats/${mandat.id}`, {
        method: creation ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));

      // Une fiche client proche existe : le vendeur tranche avant que quoi que
      // ce soit s'écrive.
      if (res.status === 409 && j.doublon) {
        setDoublon(j.doublon);
        return;
      }
      if (!res.ok) throw new Error(j.error);

      if (creation) {
        toast.success(`Mandat ${j.reference} enregistré.`);
        router.push(`/admin/mandats/${j.id}`);
      } else {
        toast.success("Mandat enregistré.");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'enregistrement a échoué, votre saisie est conservée.");
    } finally {
      envoiEnCours.current = false;
      setBusy(false);
    }
  }

  /** Verse des pièces au dossier : mandat signé scanné, carte grise, contrôle
      technique. Chaque envoi part seul : une pièce qui échoue laisse les
      autres arriver. */
  async function ajouterPieces(fichiers: FileList | null) {
    const liste = Array.from(fichiers ?? []);
    if (liste.length === 0) return;
    setEnvois((n) => n + liste.length);
    const ajoutees: MandatDoc[] = [];
    await Promise.all(
      liste.map(async (file) => {
        try {
          // Le préfixe documents/ accepte les PDF ; le suffixe horodaté évite
          // que deux « mandat.pdf » se recouvrent.
          const blob = await upload(`documents/mandat-${mandat.id || "nouveau"}-${Date.now()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          ajoutees.push({ label: file.name, url: blob.url, uploadedAt: today });
        } catch (e) {
          toast.error(`Envoi impossible${e instanceof Error ? ` : ${e.message}` : ""}.`);
        } finally {
          setEnvois((n) => n - 1);
        }
      }),
    );
    if (ajoutees.length > 0) {
      const suite = [...docs, ...ajoutees];
      setDocs(suite);
      await enregistrerPieces(suite);
    }
  }

  async function retirerPiece(url: string) {
    const suite = docs.filter((d) => d.url !== url);
    setDocs(suite);
    await enregistrerPieces(suite);
  }

  /** Les pièces s'enregistrent seules, sans attendre le bouton : un mandat
      signé déposé puis perdu au rechargement serait pire que rien. */
  async function enregistrerPieces(suite: MandatDoc[]) {
    if (mode === "creation") return;
    try {
      const res = await fetch(`/api/admin/mandats/${mandat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: suite }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("L'enregistrement des pièces a échoué.");
    }
  }

  /** Envoie le mandat au vendeur : lien public de lecture et de signature. */
  async function envoyerPourSignature() {
    if (envoiEnCours.current) return;
    envoiEnCours.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/mandats/${mandat.id}/envoi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: f.ownerEmail }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      // L'envoi de loin fait du contrat un contrat à distance : l'écran suit
      // tout de suite, sans attendre le rechargement.
      set("signMode", "distance");
      setConfirmEnvoi(false);
      toast.success(
        j.sent
          ? `Mandat envoyé à ${f.ownerEmail}.`
          : "Mandat prêt : le message a été retenu (mode atelier), le lien reste utilisable.",
      );
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'envoi a échoué.");
    } finally {
      envoiEnCours.current = false;
      setBusy(false);
    }
  }

  /** Crée la facture d'honoraires depuis le mandat conclu : la conversion
      commune du module Devis s'applique, même numérotation FAC-. */
  async function creerFacture() {
    if (envoiEnCours.current) return;
    envoiEnCours.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/mandats/${mandat.id}/facture`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      if (j.manque) {
        toast.error(`Le devis ${j.number} est prêt, il attend encore : ${j.manque}`);
      } else {
        toast.success(`Facture ${j.number} créée.`);
      }
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La création de la facture a échoué.");
    } finally {
      envoiEnCours.current = false;
      setBusy(false);
    }
  }

  /** Prolonge le mandat de 60 jours, après accord écrit du client. */
  async function prolonger() {
    if (envoiEnCours.current) return;
    envoiEnCours.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/mandats/${mandat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prolongerJours: 60 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      set("durationDays", String((Number(f.durationDays) || 0) + 60));
      setConfirmProlonger(false);
      toast.success("Mandat prolongé de 60 jours.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La prolongation a échoué.");
    } finally {
      envoiEnCours.current = false;
      setBusy(false);
    }
  }

  /** Ouvre le dossier d'immatriculation d'un import : quitus, plaques, carte
      grise se pilotent ensuite depuis le module Immatriculations. */
  async function creerDossier() {
    if (envoiEnCours.current) return;
    envoiEnCours.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/mandats/${mandat.id}/dossier`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`Dossier ${j.reference} créé.`);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La création du dossier a échoué.");
    } finally {
      envoiEnCours.current = false;
      setBusy(false);
    }
  }

  async function copierLien() {
    if (!cheminPublic) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${cheminPublic}`);
      toast.success("Lien copié.");
    } catch {
      toast.error("La copie a échoué : sélectionnez le lien à la main.");
    }
  }

  async function supprimer() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/mandats/${mandat.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Brouillon supprimé.");
      setConfirmDelete(false);
      router.push("/admin/mandats");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La suppression a échoué.");
      setBusy(false);
    }
  }

  const tonalite = TONE[MANDAT_STATUS_TONE[f.status]];

  return (
    <AdminPage>
      <PageHeader
        title={mode === "creation" ? `Nouveau mandat ${MANDAT_TYPE_DE[f.type]}` : titre}
        subtitle={
          mode === "creation"
            ? estVente
              ? "Le contrat de la revente sur mesure : rempli ici, imprimé en 16 articles, signé avec le vendeur."
              : estImport
                ? "Le contrat de l'import sécurisé : annonce repérée ou recherche en Europe, forfait fixe, formalités incluses."
                : "Le contrat de la recherche personnalisée : cahier des charges, honoraires dus uniquement au succès."
            : `${mandat.reference} · ${mandatStatusLabel(f.type, f.status)}${f.ownerName ? ` · ${f.ownerName}` : ""}`
        }
        action={
          <span className="flex flex-wrap items-center gap-3">
            <Link href="/admin/mandats" className={btnGhostClass} style={btnGhostStyle}>
              <ArrowLeft size={14} />
              Retour
            </Link>
            {mode === "fiche" && (
              <Link href={`/admin/mandats/${mandat.id}/imprimer`} className={btnGhostClass} style={btnGhostStyle}>
                <Printer size={14} />
                Imprimer le mandat
              </Link>
            )}
            {mode === "fiche" && canDelete && f.status === "brouillon" && (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-28">
        <div className="lg:col-span-2 space-y-5">

          <SectionCard title="Le mandant — article 1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nom et prénom *">
                <input value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} autoFocus={mode === "creation"} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Né(e) le">
                <input type="date" value={f.ownerBirthDate} onChange={(e) => set("ownerBirthDate", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            <Field label="Adresse complète">
              <input value={f.ownerAddress} onChange={(e) => set("ownerAddress", e.target.value)} placeholder="12 rue des Lilas, 92100 Boulogne-Billancourt" className={inputClass} style={fieldStyle} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Téléphone">
                <input value={f.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} placeholder="06 12 34 56 78" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Email">
                <input type="email" value={f.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Pièce d'identité n°">
                <input value={f.ownerIdNumber} onChange={(e) => set("ownerIdNumber", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            {mode === "fiche" && f.clientId && (
              <Link href={`/admin/clients/${f.clientId}`} className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.accent }}>
                <User size={12} />
                Ouvrir la fiche client
              </Link>
            )}
          </SectionCard>

          {estVente && (
          <SectionCard title="Le véhicule — article 3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Immatriculation (repère A)">
                <input value={f.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} placeholder="AB-123-CD" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="1re mise en circulation (repère B)">
                <input type="date" value={f.firstRegDate} onChange={(e) => set("firstRegDate", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Marque *">
                <input value={f.make} onChange={(e) => set("make", e.target.value)} placeholder="Audi, BMW…" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Modèle *">
                <input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="TT" className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Version">
                <input value={f.version} onChange={(e) => set("version", e.target.value)} placeholder="2.0 TFSI 200 S-Line" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Puissance">
                <input value={f.power} onChange={(e) => set("power", e.target.value)} placeholder="200 ch" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Numéro de série (repère E)">
                <input value={f.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} placeholder="TRUZZZ8J9B1234567" className={`${inputClass} font-mono`} style={fieldStyle} />
              </Field>
              <Field label="Kilométrage relevé ce jour">
                <input inputMode="numeric" value={f.mileageKm} onChange={(e) => set("mileageKm", e.target.value)} placeholder="118 000" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Énergie">
                <select value={f.fuel} onChange={(e) => set("fuel", e.target.value)} className={selectClass} style={fieldStyle}>
                  {REPRISE_FUELS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Couleur">
                <input value={f.color} onChange={(e) => set("color", e.target.value)} placeholder="Gris Daytona" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Clés remises ou présentées">
                <input inputMode="numeric" value={f.keys} onChange={(e) => set("keys", e.target.value)} placeholder="2" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Dernier entretien à (km)">
                <input value={f.lastServiceKm} onChange={(e) => set("lastServiceKm", e.target.value)} placeholder="110 000 km" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Contrôle technique du">
                <input type="date" value={f.ctDate} onChange={(e) => set("ctDate", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Résultat">
                <select value={f.ctStatus} onChange={(e) => set("ctStatus", e.target.value)} className={selectClass} style={fieldStyle}>
                  <option value="">À préciser</option>
                  {CT_STATUSES.map((x) => <option key={x} value={x}>{CT_STATUS_LABEL[x]}</option>)}
                </select>
              </Field>
            </div>
            <Field
              label="Sinistres, réparations ou particularités déclarés"
              hint="Imprimé à l'article 3 : toute inexactitude engage la seule responsabilité du vendeur, autant l'écrire avec lui."
            >
              <textarea
                value={f.disclosures}
                onChange={(e) => set("disclosures", e.target.value)}
                rows={3}
                placeholder="Pare-chocs arrière repeint en 2024. Rayure aile avant droite."
                className="px-4 py-3 text-sm outline-none w-full resize-y focus:border-[#6B9FEE]"
                style={fieldStyle}
              />
            </Field>
            {mode === "fiche" && f.vehicleId && vehiculeExiste && (
              <Link href={`/admin/vehicules/${f.vehicleId}/suivi`} className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.accent }}>
                <Car size={13} />
                Voir la fiche véhicule
              </Link>
            )}
          </SectionCard>
          )}

          {!estVente && (
            <SectionCard title="Le cahier des charges — article 3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Marque souhaitée">
                  <input value={f.make} onChange={(e) => set("make", e.target.value)} placeholder="Audi, Porsche…" className={inputClass} style={fieldStyle} />
                </Field>
                <Field label="Modèle">
                  <input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Macan" className={inputClass} style={fieldStyle} />
                </Field>
                <Field label="Version, finition">
                  <input value={f.version} onChange={(e) => set("version", e.target.value)} placeholder="S 3.0 V6, toit pano…" className={inputClass} style={fieldStyle} />
                </Field>
                <Field label="Énergie">
                  <select value={f.fuel} onChange={(e) => set("fuel", e.target.value)} className={selectClass} style={fieldStyle}>
                    {REPRISE_FUELS.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="Budget d'achat maximal (€ TTC)">
                  <input inputMode="numeric" value={f.budgetEuros} onChange={(e) => set("budgetEuros", e.target.value)} placeholder="45 000" className={`${inputClass} text-lg`} style={fieldStyle} />
                </Field>
                <Field label="Kilométrage plafond">
                  <input inputMode="numeric" value={f.mileageMaxKm} onChange={(e) => set("mileageMaxKm", e.target.value)} placeholder="80 000" className={inputClass} style={fieldStyle} />
                </Field>
                <Field label="1re mise en circulation à partir de">
                  <input inputMode="numeric" value={f.regMinYear} onChange={(e) => set("regMinYear", e.target.value)} placeholder="2020" className={inputClass} style={fieldStyle} />
                </Field>
                {estImport && (
                  <Field label="Pays d'achat visé">
                    <input value={f.countryOrigin} onChange={(e) => set("countryOrigin", e.target.value)} placeholder="Allemagne" className={inputClass} style={fieldStyle} />
                  </Field>
                )}
              </div>
              {estImport && (
                <Field label="Annonce repérée par le client" hint="Le lien collé sur le site arrive ici : le mandat sécurise cette annonce, et les équivalents du marché restent proposés.">
                  <input value={f.listingUrl} onChange={(e) => set("listingUrl", e.target.value)} placeholder="https://suchen.mobile.de/…" className={`${inputClass} font-mono`} style={fieldStyle} />
                </Field>
              )}
              <Field
                label="Critères libres"
                hint="Imprimés au contrat tels quels : couleurs acceptées, options exigées, historique, tout ce qui décide."
              >
                <textarea
                  value={f.searchSpec}
                  onChange={(e) => set("searchSpec", e.target.value)}
                  rows={4}
                  placeholder="Carnet complet exigé. Couleurs sombres. Attelage refusé. Première main appréciée."
                  className="px-4 py-3 text-sm outline-none w-full resize-y focus:border-[#6B9FEE]"
                  style={fieldStyle}
                />
              </Field>
            </SectionCard>
          )}

          {!estVente && (
            <SectionCard title="Le véhicule retenu">
              <p className="text-[12px]" style={{ color: T.muted }}>
                Se complète le jour où la perle est trouvée : ces repères passent sur le compte rendu
                {estImport ? " et alimentent le dossier d'immatriculation" : ""}.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Immatriculation d'origine">
                  <input value={f.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} className={inputClass} style={fieldStyle} />
                </Field>
                <Field label="Numéro de série (VIN)">
                  <input value={f.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} className={`${inputClass} font-mono`} style={fieldStyle} />
                </Field>
                <Field label="1re mise en circulation">
                  <input type="date" value={f.firstRegDate} onChange={(e) => set("firstRegDate", e.target.value)} className={inputClass} style={fieldStyle} />
                </Field>
                <Field label="Kilométrage relevé">
                  <input inputMode="numeric" value={f.mileageKm} onChange={(e) => set("mileageKm", e.target.value)} className={inputClass} style={fieldStyle} />
                </Field>
                <Field label="Couleur">
                  <input value={f.color} onChange={(e) => set("color", e.target.value)} className={inputClass} style={fieldStyle} />
                </Field>
                <Field label="Puissance">
                  <input value={f.power} onChange={(e) => set("power", e.target.value)} placeholder="354 ch" className={inputClass} style={fieldStyle} />
                </Field>
              </div>
            </SectionCard>
          )}

          {mode === "fiche" && (
            <SectionCard title="Les pièces du dossier">
              {docs.length > 0 && (
                <ul className="space-y-2">
                  {docs.map((d) => (
                    <li key={d.url} className="flex items-center gap-3 px-4 py-2.5" style={{ border: `1px solid ${T.border}`, backgroundColor: T.float }}>
                      <Paperclip size={13} style={{ color: T.accent, flexShrink: 0 }} />
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-[13px] truncate min-w-0 flex-1 hover:underline" style={{ color: T.textDim }}>
                        {d.label}
                      </a>
                      {d.uploadedAt && <span className="text-[11px] whitespace-nowrap" style={{ color: T.muted }}>{formatDateFr(d.uploadedAt)}</span>}
                      <button
                        type="button"
                        onClick={() => retirerPiece(d.url)}
                        aria-label={`Retirer ${d.label}`}
                        className="p-1 transition-colors"
                        style={{ color: T.muted }}
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <label
                className="flex items-center justify-center gap-2 px-4 py-3 cursor-pointer transition-colors hover:bg-[rgba(107,159,238,0.05)]"
                style={{ border: `1px dashed ${T.border}`, color: T.textDim }}
              >
                <Paperclip size={15} style={{ color: T.accent }} />
                <span className="text-sm">
                  {envois > 0 ? `Envoi de ${envois} pièce${envois > 1 ? "s" : ""}…` : "Déposer des pièces (PDF, scans, photos)"}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => { ajouterPieces(e.target.files); e.target.value = ""; }}
                />
              </label>
              <p className="text-[11px]" style={{ color: T.muted }}>
                Le mandat signé scanné, la carte grise, le contrôle technique, la pièce d&apos;identité.
                Chaque dépôt s&apos;inscrit au journal : c&apos;est le dossier qui se relit des années plus tard.
              </p>
            </SectionCard>
          )}

          {mode === "fiche" && evenements.length > 0 && (
            <SectionCard title="Le journal du mandat">
              <ul className="space-y-3">
                {evenements.map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5">
                    <History size={13} style={{ color: T.muted, flexShrink: 0, marginTop: 3 }} />
                    <span className="min-w-0">
                      <span className="text-[13px] block" style={{ color: T.textDim }}>{e.content}</span>
                      <span className="text-[11px]" style={{ color: T.muted }}>
                        {e.createdAt}
                        {e.author ? ` · ${e.author}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          {estVente && (
          <SectionCard title="Prix et honoraires — articles 4 et 5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prix affiché (€ TTC)">
                <input inputMode="numeric" value={f.priceEuros} onChange={(e) => set("priceEuros", e.target.value)} placeholder="15 490" className={`${inputClass} text-lg`} style={fieldStyle} />
              </Field>
              <Field label="Prix plancher net vendeur (€)">
                <input inputMode="numeric" value={f.floorEuros} onChange={(e) => set("floorEuros", e.target.value)} placeholder="14 000" className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            <Field label="Formule de rémunération">
              <select value={f.feeFormula} onChange={(e) => set("feeFormula", e.target.value)} className={selectClass} style={fieldStyle}>
                {FEE_FORMULAS.map((x) => <option key={x} value={x}>{FEE_FORMULA_LABEL[x]}</option>)}
              </select>
            </Field>
            {f.feeFormula === "acquereur" ? (
              <Field
                label="Pack de livraison (€ TTC)"
                hint="Réglé par l'acquéreur au mandataire, en plus du prix net vendeur. Laissez vide si le pack se choisit au moment de la vente."
              >
                <input inputMode="numeric" value={f.packEuros} onChange={(e) => set("packEuros", e.target.value)} placeholder="990" className={inputClass} style={fieldStyle} />
              </Field>
            ) : (
              <p className="text-[12px] px-4 py-3" style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.muted }}>
                Commission de {COMMISSION_TAUX_POURCENT} % du prix de vente réalisé, entre {formatEuroCents(COMMISSION_MIN_CENTS)} et {formatEuroCents(COMMISSION_PLAFOND_CENTS)} TTC.
                {commissionCents > 0 && (
                  <>
                    {" "}Sur le prix affiché : <strong style={{ color: T.text }}>{formatEuroCents(commissionCents)}</strong>.
                  </>
                )}
              </p>
            )}
            <p className="text-[11px]" style={{ color: T.muted }}>
              Hors indemnités des articles 7 et 8 ({formatEuroCents(INDEMNITE_FORFAITAIRE_CENTS)}), le vendeur doit
              zéro euro tant que le véhicule reste invendu.
            </p>
          </SectionCard>
          )}

          {!estVente && (
            <SectionCard title={estImport ? "Le forfait d'import — article 4" : "Les honoraires — article 4"}>
              <Field
                label="Honoraires convenus (€ TTC)"
                hint={estImport
                  ? "Dus au jour où le client conclut l'achat. Le forfait vaut aussi quand le client apporte l'annonce."
                  : "Dus uniquement au succès : zéro euro sans véhicule trouvé et acheté."}
              >
                <input inputMode="numeric" value={f.feeEuros} onChange={(e) => set("feeEuros", e.target.value)} placeholder={grilleCents > 0 ? String(Math.round(grilleCents / 100)) : "1 490"} className={`${inputClass} text-lg`} style={fieldStyle} />
              </Field>
              {grilleCents > 0 && honorairesCents !== grilleCents && (
                <button
                  type="button"
                  onClick={() => set("feeEuros", String(Math.round(grilleCents / 100)))}
                  className={btnGhostClass}
                  style={btnGhostStyle}
                >
                  Appliquer la grille : {formatEuroCents(grilleCents)}
                </button>
              )}
              <p className="text-[12px] px-4 py-3" style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.muted }}>
                {estImport ? (
                  <>
                    Grille : {GRILLE_IMPORT.map((p) => `${formatEuroCents(p.feeCents)} jusqu'à ${formatEuroCents(p.jusquaCents)}`).join(" · ")} · {formatEuroCents(IMPORT_PLAFOND_FEE_CENTS)} au-delà.
                    {" "}Quitus fiscal et carte grise inclus, transport refacturé à prix coûtant sur justificatifs.
                  </>
                ) : (
                  <>
                    Grille selon le budget : {GRILLE_RECHERCHE.map((p) => `${formatEuroCents(p.feeCents)} jusqu'à ${formatEuroCents(p.jusquaCents)}`).join(" · ")} · au-delà, montant convenu au mandat.
                  </>
                )}
              </p>
            </SectionCard>
          )}

          <SectionCard title={estVente ? "Durée, garde et signature — articles 6, 12 et 14" : "Durée et signature"}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prend effet le">
                <input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Durée (jours)">
                <input inputMode="numeric" value={f.durationDays} onChange={(e) => set("durationDays", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            {echeanceLue && (
              <p
                className="inline-flex items-center gap-2 text-[12px]"
                style={{ color: echeanceLue.tone === "muted" ? T.muted : TONE[echeanceLue.tone].fg }}
              >
                <CalendarClock size={13} style={{ flexShrink: 0 }} />
                Jusqu&apos;au {formatDateFr(echeanceLue.echeance)} · {echeanceLue.phrase} · renouvelable par écrit
              </p>
            )}
            {mode === "fiche" && f.status === "signe" && echeanceLue && (echeanceLue.proche || echeanceLue.expiree) && (
              <button type="button" onClick={() => setConfirmProlonger(true)} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
                <CalendarPlus size={13} />
                Prolonger de 60 jours
              </button>
            )}
            {estVente && (
              <>
                <Field label="Garde du véhicule">
                  <select value={f.custody} onChange={(e) => set("custody", e.target.value)} className={selectClass} style={fieldStyle}>
                    {CUSTODIES.map((x) => <option key={x} value={x}>{CUSTODY_LABEL[x]}</option>)}
                  </select>
                </Field>
                {f.custody === "mandataire" && (
                  <Field label="Confié au mandataire le" hint="Un état des lieux photographique contradictoire s'établit à la remise et à la restitution.">
                    <input type="date" value={f.custodyDate} onChange={(e) => set("custodyDate", e.target.value)} className={inputClass} style={fieldStyle} />
                  </Field>
                )}
              </>
            )}
            <Field label="Mode de signature" hint="Pilote l'article 14 imprimé : la qualification légale du contrat change avec le lieu de signature.">
              <select value={f.signMode} onChange={(e) => set("signMode", e.target.value)} className={selectClass} style={fieldStyle}>
                {SIGN_MODES.map((x) => <option key={x} value={x}>{SIGN_MODE_LABEL[x]}</option>)}
              </select>
            </Field>
            <Coche
              checked={f.immediateExecution}
              onChange={(v) => set("immediateExecution", v)}
              label={`Le ${clientMot} demande l'exécution immédiate, avant la fin du délai de rétractation`}
            />
            {!f.immediateExecution && (
              <Avertissement>
                Sans cette demande expresse, le démarrage de la mission attend la fin du délai de
                rétractation de 14 jours. Pour démarrer tout de suite, cochez la case et faites-la
                parapher.
              </Avertissement>
            )}
            {f.signMode === "domicile" && f.feeFormula === "vendeur" && (
              <Avertissement>
                Signé au domicile, le contrat interdit d&apos;encaisser quoi que ce soit du vendeur
                pendant 7 jours, commission comprise. La formule A (frais à la charge de
                l&apos;acquéreur) lève cette contrainte.
              </Avertissement>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fait à">
                <input value={f.signPlace} onChange={(e) => set("signPlace", e.target.value)} placeholder="Paris" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Signé le">
                <input type="date" value={f.signedOn} onChange={(e) => set("signedOn", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="RC pro — police n°">
                <input value={f.rcPolicy} onChange={(e) => set("rcPolicy", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="RC pro — assureur">
                <input value={f.rcInsurer} onChange={(e) => set("rcInsurer", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            {f.rcPolicy.trim() === "" && (
              <Avertissement>
                L&apos;article 1 imprime l&apos;assurance RC professionnelle, et l&apos;article 12 y adosse
                les essais. Complétez le numéro de police avant de faire signer.
              </Avertissement>
            )}
          </SectionCard>

          {mode === "fiche" && signature && (
            <SectionCard title="Signature en ligne">
              {signature.signedAtFr && signature.signerName ? (
                <div className="px-4 py-3.5 space-y-1.5" style={{ backgroundColor: TONE.success.bg, border: `1px solid ${TONE.success.bd}` }}>
                  <p className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: TONE.success.fg }}>
                    <CheckCircle2 size={15} />
                    Signé en ligne par {signature.signerName}
                  </p>
                  <p className="text-[12px]" style={{ color: T.textDim }}>
                    Le {signature.signedAtFr}
                    {signature.signedIp ? ` · adresse IP ${signature.signedIp}` : ""}. Le cachet figure
                    sur la dernière page du document.
                  </p>
                </div>
              ) : f.status !== "brouillon" && f.signedOn ? (
                <p className="text-[12.5px]" style={{ color: T.textDim }}>
                  Mandat signé au rendez-vous, sur papier. Versez le scan signé aux pièces du dossier
                  pour que l&apos;archive soit complète.
                </p>
              ) : f.status !== "brouillon" ? (
                <p className="text-[12.5px]" style={{ color: T.muted }}>
                  Ce mandat est sorti du statut brouillon : le lien de signature est fermé.
                </p>
              ) : signature.sentAt ? (
                <>
                  <p className="text-[12.5px]" style={{ color: T.textDim }}>
                    Envoyé {signature.sentAgo} à {f.ownerEmail || `l'adresse du ${clientMot}`}.
                  </p>
                  <p className="inline-flex items-center gap-2 text-[12px]" style={{ color: signature.viewCount > 0 ? TONE.accent.fg : T.muted }}>
                    <Eye size={13} />
                    {signature.viewCount > 0
                      ? `Ouvert ${signature.viewCount} fois, la première ${signature.firstViewedAgo}`
                      : "En attente d'une première ouverture"}
                  </p>
                  {cheminPublic && (
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={cheminPublic}
                        onFocus={(e) => e.target.select()}
                        className="px-3 py-2.5 text-[12px] outline-none w-full font-mono"
                        style={fieldStyle}
                        aria-label="Lien public du mandat"
                      />
                      <button type="button" onClick={copierLien} className={btnGhostClass} style={{ ...btnGhostStyle, padding: "10px 14px" }} title="Copier le lien">
                        <Copy size={13} />
                      </button>
                    </div>
                  )}
                  <button type="button" onClick={() => setConfirmEnvoi(true)} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
                    <Send size={13} />
                    Renvoyer au {clientMot}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[12.5px]" style={{ color: T.textDim }}>
                    Le {clientMot} reçoit un lien, lit le contrat tel qu&apos;il s&apos;imprime,
                    tape son nom et signe depuis son téléphone. Nom, date et adresse de connexion
                    s&apos;enregistrent, le cachet s&apos;appose sur le document.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmEnvoi(true)}
                    disabled={busy || f.ownerEmail.trim() === ""}
                    className={btnPrimaryClass}
                    style={btnPrimaryStyle}
                  >
                    <Send size={14} />
                    Envoyer pour signature
                  </button>
                  {f.ownerEmail.trim() === "" && (
                    <p className="text-[11px]" style={{ color: T.muted }}>
                      Renseignez l&apos;email du {clientMot}, puis enregistrez, pour ouvrir l&apos;envoi.
                    </p>
                  )}
                </>
              )}
            </SectionCard>
          )}

          {mode === "fiche" && (
            <SectionCard title="L'issue">
              <Field label="Statut">
                <select value={f.status} onChange={(e) => set("status", e.target.value as MandatStatus)} className={selectClass} style={fieldStyle}>
                  {MANDAT_STATUSES.map((s) => <option key={s} value={s}>{mandatStatusLabel(f.type, s)}</option>)}
                </select>
              </Field>
              <span
                className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1"
                style={{ backgroundColor: tonalite.bg, border: `1px solid ${tonalite.bd}`, color: tonalite.fg }}
              >
                {mandatStatusLabel(f.type, f.status)}
              </span>
              {f.status === "vendu" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={estVente ? "Vendu le" : "Achat conclu le"}>
                      <input type="date" value={f.soldOn} onChange={(e) => set("soldOn", e.target.value)} className={inputClass} style={fieldStyle} />
                    </Field>
                    <Field label={estVente ? "Prix de vente réalisé (€)" : "Prix d'achat conclu (€)"}>
                      <input inputMode="numeric" value={f.soldPriceEuros} onChange={(e) => set("soldPriceEuros", e.target.value)} className={inputClass} style={fieldStyle} />
                    </Field>
                  </div>
                  <Field
                    label="Honoraires facturés (€ TTC)"
                    hint={
                      estVente
                        ? f.feeFormula === "vendeur"
                          ? "Formule B : 5 % du prix réalisé, entre 890 € et 2 990 €. La facture se fait depuis le module Devis."
                          : "Formule A : le pack de livraison se facture à l'acquéreur, depuis le module Devis."
                        : `Le montant convenu au mandat${honorairesCents > 0 ? ` (${formatEuroCents(honorairesCents)})` : ""} se facture au client depuis le module Devis, TVA 20 %.`
                    }
                  >
                    <input inputMode="numeric" value={f.feeFinalEuros} onChange={(e) => set("feeFinalEuros", e.target.value)} className={inputClass} style={fieldStyle} />
                  </Field>
                  {factureInfo ? (
                    <Link
                      href={`/admin/devis/${factureInfo.id}`}
                      className="inline-flex items-center gap-2 text-[12px]"
                      style={{ color: factureInfo.payee ? TONE.success.fg : T.accent }}
                    >
                      <ReceiptText size={13} />
                      Facture {factureInfo.number} · {factureInfo.payee ? "payée" : "impayée"}
                    </Link>
                  ) : estVente && f.feeFormula === "acquereur" ? (
                    <p className="text-[12px]" style={{ color: T.muted }}>
                      Formule A : le pack de livraison se facture à l&apos;acquéreur, depuis le module
                      Devis.
                    </p>
                  ) : (
                    <button type="button" onClick={creerFacture} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
                      <ReceiptText size={14} />
                      Créer la facture d&apos;honoraires
                    </button>
                  )}
                </>
              )}
              {f.status === "retire" && (
                <p className="text-[12px]" style={{ color: T.muted }}>
                  {estVente
                    ? `Retrait en cours de mandat : l'indemnité forfaitaire de ${formatEuroCents(INDEMNITE_FORFAITAIRE_CENTS)} est due (article 8), sauf force majeure ou rétractation.`
                    : `Révocation par le client : rien à facturer, hors prorata des diligences si l'exécution immédiate avait été demandée (plafond ${formatEuroCents(INDEMNITE_FORFAITAIRE_CENTS)}).`}
                </p>
              )}
              {f.status === "retracte" && (
                <p className="text-[12px]" style={{ color: T.muted }}>
                  Rétractation sous 14 jours : rien à facturer, hors prorata des prestations si
                  l&apos;exécution immédiate avait été demandée (plafond {formatEuroCents(INDEMNITE_FORFAITAIRE_CENTS)}).
                </p>
              )}
              <Field label="Note d'issue">
                <input value={f.outcomeNote} onChange={(e) => set("outcomeNote", e.target.value)} placeholder={estVente ? "Vendu à un acquéreur présenté le 12/09" : "Trouvé chez un marchand de Stuttgart, livré le 12/09"} className={inputClass} style={fieldStyle} />
              </Field>
            </SectionCard>
          )}

          {mode === "fiche" && estImport && (
            <SectionCard title="Le dossier d'immatriculation">
              {regInfo ? (
                <>
                  <p className="text-[12.5px]" style={{ color: T.textDim }}>
                    Dossier <strong>{regInfo.reference}</strong> · {regInfo.statusLabel}. Quitus fiscal,
                    plaques et carte grise se suivent depuis le module Immatriculations.
                  </p>
                  <Link href={`/admin/immatriculations/${regInfo.id}`} className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.accent }}>
                    Ouvrir le dossier
                  </Link>
                </>
              ) : f.status === "signe" || f.status === "vendu" ? (
                <>
                  <p className="text-[12.5px]" style={{ color: T.textDim }}>
                    Le véhicule trouvé, le dossier d&apos;immatriculation prend le relais : quitus fiscal,
                    plaques provisoires, carte grise. Il naît prérempli avec le client et le véhicule retenu.
                  </p>
                  <button type="button" onClick={creerDossier} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
                    Créer le dossier d&apos;immatriculation
                  </button>
                </>
              ) : (
                <p className="text-[12.5px]" style={{ color: T.muted }}>
                  Le dossier s&apos;ouvre une fois le mandat signé, dès que le véhicule est trouvé.
                </p>
              )}
            </SectionCard>
          )}

          <SectionCard title="Notes internes">
            <Field label="Pour l'équipe" hint="Reste dans le back-office, jamais sur le contrat.">
              <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="px-4 py-3 text-sm outline-none w-full resize-y focus:border-[#6B9FEE]" style={fieldStyle} />
            </Field>
          </SectionCard>
        </div>
      </div>

      {/* Barre d'enregistrement collée en bas : le bouton reste sous la main à
          toutes les hauteurs de page. Elle porte les deux chiffres qui
          engagent : le prix affiché et les honoraires annoncés. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:left-[232px]"
        style={{ backgroundColor: T.float, borderTop: `1px solid ${T.border}` }}
      >
        <div className="mx-auto max-w-6xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm min-w-0 truncate" style={{ color: T.muted }}>
            {(estVente ? prixCents : budgetCents) > 0 ? (
              <>
                {estVente ? "Prix affiché" : "Budget"}{" "}
                <strong style={{ color: T.text }}>{formatEuroCents(estVente ? prixCents : budgetCents)}</strong>
                {honorairesPhrase && <> · {honorairesPhrase}</>}
                {echeanceLue && <span className="hidden sm:inline"> · {echeanceLue.phrase}</span>}
              </>
            ) : (
              titre
            )}
          </span>
          <span className="flex items-center gap-3">
            <Link href="/admin/mandats" className={btnGhostClass} style={btnGhostStyle}>Annuler</Link>
            <button type="button" onClick={() => enregistrer()} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {busy ? "…" : mode === "creation" ? "Enregistrer le mandat" : "Enregistrer"}
            </button>
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce brouillon ?"
        description={`${mandat.reference} · ${titre}. La fiche client et son affaire commerciale restent en place.`}
        busy={busy}
        onConfirm={supprimer}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmEnvoi}
        title="Envoyer le mandat pour signature ?"
        confirmLabel="Envoyer"
        description={
          <>
            <span className="block" style={{ color: T.text }}>{mandat.reference} · {titre}</span>
            <span className="block mt-2">
              Le lien de lecture et de signature part à {f.ownerEmail || `l'adresse du ${clientMot}`}.
              Le contrat devient un contrat à distance : l&apos;article rétractation imprimé suit, et
              le délai de quatorze jours court à partir de la signature.
            </span>
            <span className="block mt-2">
              Les modifications enregistrées sont celles qui partent : enregistrez la fiche avant
              l&apos;envoi si vous venez de la retoucher.
            </span>
          </>
        }
        busy={busy}
        onConfirm={envoyerPourSignature}
        onCancel={() => setConfirmEnvoi(false)}
      />

      <ConfirmDialog
        open={confirmProlonger}
        title="Prolonger le mandat de 60 jours ?"
        confirmLabel="Prolonger"
        description={
          <>
            <span className="block" style={{ color: T.text }}>{mandat.reference} · {titre}</span>
            <span className="block mt-2">
              Le contrat se renouvelle par accord écrit des parties : obtenez l&apos;accord du
              {" "}{clientMot} (un email suffit) et versez-le aux pièces du dossier. La prolongation
              s&apos;inscrit au journal avec la nouvelle échéance.
            </span>
          </>
        }
        busy={busy}
        onConfirm={prolonger}
        onCancel={() => setConfirmProlonger(false)}
      />

      <ConfirmDialog
        open={doublon !== null}
        title="Une fiche client proche existe déjà"
        confirmLabel="Rattacher à cette fiche"
        description={
          doublon && (
            <>
              <span className="block" style={{ color: T.text }}>{doublon.name}</span>
              <span className="block">{[doublon.email, doublon.phone].filter(Boolean).join(" · ")}</span>
              <span className="block mt-2">
                Le mandat lui sera rattaché et ses champs vides complétés. Modifiez l&apos;email ou le téléphone pour créer une fiche distincte.
              </span>
            </>
          )
        }
        busy={busy}
        onConfirm={() => { setDoublon(null); enregistrer(true); }}
        onCancel={() => setDoublon(null)}
      />
    </AdminPage>
  );
}
