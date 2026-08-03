"use client";

// Fiche d'estimation de reprise : le véhicule d'un client, évalué et chiffré.
//
// Cette page remplace la fenêtre flottante d'avant, où un clic à côté vidait
// trois minutes de saisie. Une estimation se remplit à son rythme, se rouvre le
// lendemain pour corriger un chiffre, se passe à un collègue par son adresse.
//
// L'ordre des blocs suit la carte grise que le commercial a sous les yeux :
// immatriculation, mise en circulation, identité du véhicule, puis le vendeur.
import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, User, AlertTriangle, History, CalendarClock, Car, ArrowRightLeft, Printer, ImagePlus, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { lireMontantEuros, lireEntier } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import { formatDateFr } from "@/lib/devis";
import {
  REPRISE_STATUSES, REPRISE_STATUS_LABEL, REPRISE_STATUS_TONE,
  REFUSAL_REASONS, REFUSAL_REASON_LABEL,
  REPRISE_FUELS, REPRISE_TRANSMISSIONS, CT_STATUSES, CT_STATUS_LABEL,
  SERVICE_BOOKS, SERVICE_BOOK_LABEL, repriseLabel, assessMarge, validite, repriseIssues,
  type RepriseStatus, type RefusalReason,
} from "@/lib/reprises";
import { KM_MAX } from "@/lib/reprise-serialize";
import type { RepriseForm } from "@/lib/reprise-form";
import {
  T, TONE, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass,
  btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle,
} from "../../ui";
import { useToast } from "../../toast";
import { ConfirmDialog } from "../../confirm";

export type RepriseEventRow = { id: string; type: string; content: string; author: string; createdAt: string };

// La forme du formulaire vit dans un module partagé : la page de saisie la
// prépare côté serveur, ce composant la rend côté client.
export type Reprise = RepriseForm;

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

/* ── Case à cocher qui porte une conséquence métier ── */
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

export default function RepriseFiche({
  reprise, mode, canDelete, today, evenements = [], vehiculeExiste = false,
}: {
  reprise: Reprise;
  mode: "creation" | "fiche";
  canDelete: boolean;
  today: string;
  evenements?: RepriseEventRow[];
  /** La fiche de parc existe encore : le rattachement est une colonne nue,
      qu'aucune contrainte protège d'une suppression du véhicule. */
  vehiculeExiste?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(reprise);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [doublon, setDoublon] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);
  const [confirmStock, setConfirmStock] = useState(false);
  const [photos, setPhotos] = useState<string[]>(reprise.photos);
  const [envois, setEnvois] = useState(0);
  // `busy` ne devient vrai qu'au rendu suivant : deux clics rapprochés
  // passaient tous les deux et créaient deux estimations identiques. Ce
  // verrou-ci se ferme dans le même tour d'exécution.
  const envoiEnCours = useRef(false);

  const set = <K extends keyof Reprise>(key: K, value: Reprise[K]) => setF((x) => ({ ...x, [key]: value }));

  const titre = useMemo(
    () => repriseLabel({ make: f.make, model: f.model, version: f.version, year: Number(f.year) || 0 }),
    [f.make, f.model, f.version, f.year],
  );

  const enCentimes = (v: string) => {
    const lu = lireMontantEuros(v);
    return typeof lu === "number" ? lu * 100 : 0;
  };
  const offreCents = enCentimes(f.offerEuros);
  const reventeCents = enCentimes(f.resaleEuros);
  const remiseEnEtatCents = enCentimes(f.reconditionEuros);

  // Le chiffrage se refait à chaque frappe : la question « à ce prix-là,
  // qu'est-ce qu'il me reste » se pose devant le client, avant d'enregistrer.
  const marge = useMemo(
    () => assessMarge({ resaleCents: reventeCents, reconditionCents: remiseEnEtatCents, offerCents: offreCents }),
    [reventeCents, remiseEnEtatCents, offreCents],
  );

  // Ce qui empêche encore le passage au stock, calculé sur la saisie en cours :
  // le message change à mesure que les champs se remplissent.
  const manquesStock = useMemo(
    () => repriseIssues({
      status: f.status,
      make: f.make,
      model: f.model,
      year: Number(f.year) || 0,
      mileageKm: Number(f.mileageKm.replace(/[^0-9]/g, "")) || 0,
      color: f.color,
      offerCents: offreCents,
      vehicleId: f.vehicleId,
    }).filter((m) => m !== "cette estimation a déjà sa fiche véhicule"),
    [f.status, f.make, f.model, f.year, f.mileageKm, f.color, f.vehicleId, offreCents],
  );
  const reconditionAffichee = remiseEnEtatCents > 0;

  const echeanceLue = useMemo(
    () => validite(f.offerDate, Number(f.validityDays) || 0, today),
    [f.offerDate, f.validityDays, today],
  );

  /** Corps de requête, après contrôle de chaque saisie chiffrée. */
  function corps(forcerRattachement = false): Record<string, unknown> | null {
    const km = lireEntier(f.mileageKm, KM_MAX);
    if (km === "invalide") {
      toast.error("Le kilométrage se saisit en chiffres, par exemple 118 000.");
      return null;
    }
    const offre = lireMontantEuros(f.offerEuros);
    if (offre === "invalide") {
      toast.error("L'offre se saisit en chiffres, par exemple 15 490.");
      return null;
    }
    const credit = lireMontantEuros(f.creditEuros);
    if (credit === "invalide") {
      toast.error("Le solde du crédit se saisit en chiffres, par exemple 4 200.");
      return null;
    }
    const revente = lireMontantEuros(f.resaleEuros);
    if (revente === "invalide") {
      toast.error("La revente visée se saisit en chiffres, par exemple 21 900.");
      return null;
    }
    const remise = lireMontantEuros(f.reconditionEuros);
    if (remise === "invalide") {
      toast.error("La remise en état se saisit en chiffres, par exemple 1 400.");
      return null;
    }
    const annee = lireEntier(f.year, 9999);
    if (annee === "invalide") {
      toast.error("L'année se saisit en quatre chiffres, par exemple 2019.");
      return null;
    }
    const proprios = lireEntier(f.owners, 20);
    const cles = lireEntier(f.keys, 10);

    return {
      ownerName: f.ownerName,
      ownerCompany: f.ownerCompany,
      ownerEmail: f.ownerEmail,
      ownerPhone: f.ownerPhone,
      make: f.make,
      model: f.model,
      version: f.version,
      year: annee ?? 0,
      mileageKm: km ?? 0,
      fuel: f.fuel,
      transmission: f.transmission,
      color: f.color,
      plate: f.plate,
      vin: f.vin,
      firstRegDate: f.firstRegDate,
      ctDate: f.ctDate,
      ctStatus: f.ctStatus,
      owners: proprios === "invalide" ? 0 : proprios ?? 0,
      serviceBook: f.serviceBook,
      keys: cles === "invalide" ? 0 : cles ?? 0,
      creditPending: f.creditPending,
      creditCents: (credit ?? 0) * 100,
      titleInName: f.titleInName,
      condition: f.condition,
      resaleCents: (revente ?? 0) * 100,
      reconditionCents: (remise ?? 0) * 100,
      offerCents: (offre ?? 0) * 100,
      offerDate: f.offerDate,
      validityDays: Number(f.validityDays) || 15,
      status: f.status,
      refusalReason: f.refusalReason,
      nextActionAt: f.nextActionAt,
      nextActionLabel: f.nextActionLabel,
      notes: f.notes,
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
      const res = await fetch(creation ? "/api/admin/reprises" : `/api/admin/reprises/${reprise.id}`, {
        method: creation ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));

      // Une fiche client proche existe : le vendeur tranche avant que quoi que
      // ce soit s'écrive, au lieu de le découvrir sur la page suivante.
      if (res.status === 409 && j.doublon) {
        setDoublon(j.doublon);
        return;
      }
      if (!res.ok) throw new Error(j.error);

      if (creation) {
        toast.success(`Estimation ${j.reference} enregistrée.`);
        router.push(`/admin/reprises/${j.id}`);
      } else {
        toast.success("Estimation enregistrée.");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'enregistrement a échoué, votre saisie est conservée.");
    } finally {
      envoiEnCours.current = false;
      setBusy(false);
    }
  }

  /** Dépose des clichés du véhicule évalué. Chaque envoi part seul : une photo
      qui échoue laisse les autres arriver. */
  async function ajouterPhotos(fichiers: FileList | null) {
    const liste = Array.from(fichiers ?? []);
    if (liste.length === 0) return;
    setEnvois((n) => n + liste.length);
    const ajoutees: string[] = [];
    await Promise.all(
      liste.map(async (file) => {
        try {
          // Le suffixe horodaté est indispensable : le back-office garde le
          // suffixe aléatoire fermé, et deux « photo.jpg » se recouvriraient.
          const blob = await upload(`reprises/${reprise.id || "nouvelle"}-${Date.now()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          ajoutees.push(blob.url);
        } catch (e) {
          toast.error(`Envoi impossible${e instanceof Error ? ` : ${e.message}` : ""}.`);
        } finally {
          setEnvois((n) => n - 1);
        }
      }),
    );
    if (ajoutees.length > 0) {
      const suite = [...photos, ...ajoutees];
      setPhotos(suite);
      await enregistrerPhotos(suite);
    }
  }

  async function retirerPhoto(url: string) {
    const suite = photos.filter((u) => u !== url);
    setPhotos(suite);
    await enregistrerPhotos(suite);
  }

  /** Les photos s'enregistrent seules, sans attendre le bouton : une image
      déposée puis perdue au rechargement serait pire que pas d'image du tout. */
  async function enregistrerPhotos(suite: string[]) {
    if (mode === "creation") return;
    try {
      const res = await fetch(`/api/admin/reprises/${reprise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: suite }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("L'enregistrement des photos a échoué.");
    }
  }

  async function passerAuStock() {
    if (envoiEnCours.current) return;
    envoiEnCours.current = true;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reprises/${reprise.id}/stock`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Fiche véhicule créée, hors ligne pour l'instant.");
      setConfirmStock(false);
      router.push(`/admin/vehicules/${j.vehicleId}/suivi`);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Le passage au stock a échoué.");
      setBusy(false);
    } finally {
      envoiEnCours.current = false;
    }
  }

  async function supprimer() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reprises/${reprise.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Estimation supprimée.");
      setConfirmDelete(false);
      router.push("/admin/reprises");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La suppression a échoué.");
      setBusy(false);
    }
  }

  const tonalite = TONE[REPRISE_STATUS_TONE[f.status]];

  return (
    <AdminPage>
      <PageHeader
        title={mode === "creation" ? "Nouvelle estimation" : titre}
        subtitle={
          mode === "creation"
            ? "Le véhicule d'un client, évalué et chiffré, avec l'offre remise sur place."
            : `${reprise.reference} · ${REPRISE_STATUS_LABEL[f.status]}${f.ownerName ? ` · ${f.ownerCompany || f.ownerName}` : ""}`
        }
        action={
          <span className="flex flex-wrap items-center gap-3">
            <Link href="/admin/reprises" className={btnGhostClass} style={btnGhostStyle}>
              <ArrowLeft size={14} />
              Retour
            </Link>
            {mode === "fiche" && (
              <Link href={`/admin/reprises/${reprise.id}/imprimer`} className={btnGhostClass} style={btnGhostStyle}>
                <Printer size={14} />
                Imprimer l&apos;offre
              </Link>
            )}
            {mode === "fiche" && canDelete && (
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

          <SectionCard title="Le véhicule">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Immatriculation (repère A)">
                <input value={f.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} placeholder="AB-123-CD" autoFocus={mode === "creation"} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="1re mise en circulation (repère B)">
                <input type="date" value={f.firstRegDate} onChange={(e) => set("firstRegDate", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Marque *">
                <input value={f.make} onChange={(e) => set("make", e.target.value)} placeholder="Audi, BMW…" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Modèle *">
                <input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="A4 Avant" className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            <Field label="Version">
              <input value={f.version} onChange={(e) => set("version", e.target.value)} placeholder="2.0 TDI 190 S line" className={inputClass} style={fieldStyle} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Année">
                <input inputMode="numeric" value={f.year} onChange={(e) => set("year", e.target.value)} placeholder="2019" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Kilométrage au compteur">
                <input inputMode="numeric" value={f.mileageKm} onChange={(e) => set("mileageKm", e.target.value)} placeholder="118 000" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Énergie">
                <select value={f.fuel} onChange={(e) => set("fuel", e.target.value)} className={selectClass} style={fieldStyle}>
                  {REPRISE_FUELS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Boîte">
                <select value={f.transmission} onChange={(e) => set("transmission", e.target.value)} className={selectClass} style={fieldStyle}>
                  {REPRISE_TRANSMISSIONS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Couleur">
                <input value={f.color} onChange={(e) => set("color", e.target.value)} placeholder="Gris Daytona" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Numéro de série (repère E)">
                <input value={f.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} placeholder="WAUZZZ8K9BA123456" className={`${inputClass} font-mono`} style={fieldStyle} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Les points de contrôle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contrôle technique du">
                <input type="date" value={f.ctDate} onChange={(e) => set("ctDate", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Résultat">
                <select value={f.ctStatus} onChange={(e) => set("ctStatus", e.target.value)} className={selectClass} style={fieldStyle}>
                  <option value="">À préciser</option>
                  {CT_STATUSES.map((x) => <option key={x} value={x}>{CT_STATUS_LABEL[x]}</option>)}
                </select>
              </Field>
              <Field label="Carnet d'entretien">
                <select value={f.serviceBook} onChange={(e) => set("serviceBook", e.target.value)} className={selectClass} style={fieldStyle}>
                  <option value="">À préciser</option>
                  {SERVICE_BOOKS.map((x) => <option key={x} value={x}>{SERVICE_BOOK_LABEL[x]}</option>)}
                </select>
              </Field>
              <Field label="Propriétaires">
                <input inputMode="numeric" value={f.owners} onChange={(e) => set("owners", e.target.value)} placeholder="2" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Clés remises">
                <input inputMode="numeric" value={f.keys} onChange={(e) => set("keys", e.target.value)} placeholder="2" className={inputClass} style={fieldStyle} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Coche checked={f.titleInName} onChange={(v) => set("titleInName", v)} label="Carte grise au nom du vendeur" />
              <Coche checked={f.creditPending} onChange={(v) => set("creditPending", v)} label="Crédit en cours sur le véhicule" />
            </div>

            {f.creditPending && (
              <>
                <Field label="Solde restant dû (€)">
                  <input inputMode="numeric" value={f.creditEuros} onChange={(e) => set("creditEuros", e.target.value)} placeholder="4 200" className={inputClass} style={fieldStyle} />
                </Field>
                <Avertissement>
                  Le solde du crédit se règle à l&apos;organisme prêteur le jour de l&apos;achat. Demandez le décompte de remboursement au vendeur.
                </Avertissement>
              </>
            )}
            {!f.titleInName && (
              <Avertissement>
                La cession demande la signature du titulaire porté sur la carte grise. Prévoyez son accord avant de conclure.
              </Avertissement>
            )}
          </SectionCard>

          <SectionCard title="L'état constaté">
            <Field label="Ce qui a été relevé" hint="Carrosserie, pneus, historique d'entretien, points de vigilance.">
              <textarea
                value={f.condition}
                onChange={(e) => set("condition", e.target.value)}
                rows={5}
                placeholder="Pare-chocs arrière rayé sur 20 cm. Pneus avant à 3 mm. Distribution faite à 96 000 km, facture fournie."
                className="px-4 py-3 text-sm outline-none w-full resize-y focus:border-[#6B9FEE]"
                style={fieldStyle}
              />
            </Field>
          </SectionCard>

          {mode === "fiche" && (
            <SectionCard title="Les photos du véhicule">
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((url) => (
                    <div key={url} className="relative group" style={{ border: `1px solid ${T.border}`, backgroundColor: T.float }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full object-cover" style={{ aspectRatio: "4 / 3" }} />
                      <button
                        type="button"
                        onClick={() => retirerPhoto(url)}
                        aria-label="Retirer cette photo"
                        className="absolute top-1.5 right-1.5 p-1 transition-opacity"
                        style={{ backgroundColor: "rgba(4,11,22,0.72)", color: T.textDim }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label
                className="flex items-center justify-center gap-2 px-4 py-3 cursor-pointer transition-colors hover:bg-[rgba(107,159,238,0.05)]"
                style={{ border: `1px dashed ${T.border}`, color: T.textDim }}
              >
                <ImagePlus size={15} style={{ color: T.accent }} />
                <span className="text-sm">
                  {envois > 0 ? `Envoi de ${envois} photo${envois > 1 ? "s" : ""}…` : "Déposer des photos"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { ajouterPhotos(e.target.files); e.target.value = ""; }}
                />
              </label>
              <p className="text-[11px]" style={{ color: T.muted }}>
                Les quatre angles, le compteur, la carte grise et le défaut principal. Une photo du
                compteur tranche un désaccord de 500 € trois semaines plus tard. Retirer une photo la
                retire de la fiche, le fichier restant sur le stockage.
              </p>
            </SectionCard>
          )}

          {mode === "fiche" && evenements.length > 0 && (
            <SectionCard title="Le journal de l'estimation">
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
          <SectionCard title="Le vendeur">
            <Field label="Nom *">
              <input value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} className={inputClass} style={fieldStyle} />
            </Field>
            <Field label="Société">
              <input value={f.ownerCompany} onChange={(e) => set("ownerCompany", e.target.value)} className={inputClass} style={fieldStyle} />
            </Field>
            <Field label="Email">
              <input type="email" value={f.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} className={inputClass} style={fieldStyle} />
            </Field>
            <Field label="Téléphone" hint="Un email ou un téléphone déjà connu rattache l'estimation à la fiche existante.">
              <input value={f.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} placeholder="06 12 34 56 78" className={inputClass} style={fieldStyle} />
            </Field>
            {mode === "fiche" && f.clientId && (
              <Link href={`/admin/clients/${f.clientId}`} className="inline-flex items-center gap-2 text-[12px]" style={{ color: T.accent }}>
                <User size={12} />
                Ouvrir la fiche client
              </Link>
            )}
          </SectionCard>

          <SectionCard title="Le chiffrage">
            <Field label="Revente visée (€)" hint="Le prix auquel le véhicule partira, une fois remis en état.">
              <input inputMode="numeric" value={f.resaleEuros} onChange={(e) => set("resaleEuros", e.target.value)} placeholder="21 900" className={inputClass} style={fieldStyle} />
            </Field>
            <Field label="Remise en état à prévoir (€)">
              <input inputMode="numeric" value={f.reconditionEuros} onChange={(e) => set("reconditionEuros", e.target.value)} placeholder="1 400" className={inputClass} style={fieldStyle} />
            </Field>
            <Field label="Offre remise au client (€)">
              <input inputMode="numeric" value={f.offerEuros} onChange={(e) => set("offerEuros", e.target.value)} placeholder="15 490" className={`${inputClass} text-lg`} style={fieldStyle} />
            </Field>

            {/* Le calcul se refait à la frappe. La TVA sur marge est ce qui fait
                passer une marge annoncée de 5 010 € à 3 942 € réels : c'est la
                ligne qui manquait pour annoncer un prix en connaissance. */}
            {marge ? (
              <div className="px-4 py-3.5 space-y-2" style={{ backgroundColor: T.float, border: `1px solid ${TONE[marge.tone].bd}` }}>
                <div className="flex items-center justify-between text-[12px]" style={{ color: T.muted }}>
                  <span>Marge brute</span>
                  <span style={{ color: T.textDim, fontVariantNumeric: "tabular-nums" }}>{formatEuroCents(marge.brutCents)}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]" style={{ color: T.muted }}>
                  <span>TVA sur marge</span>
                  <span style={{ color: T.textDim, fontVariantNumeric: "tabular-nums" }}>− {formatEuroCents(marge.tvaCents)}</span>
                </div>
                {remiseEnEtatCents > 0 && (
                  <div className="flex items-center justify-between text-[12px]" style={{ color: T.muted }}>
                    <span>Remise en état</span>
                    <span style={{ color: T.textDim, fontVariantNumeric: "tabular-nums" }}>− {formatEuroCents(remiseEnEtatCents)}</span>
                  </div>
                )}
                <div
                  className="flex items-center justify-between pt-2.5"
                  style={{ borderTop: `1px solid ${T.border}` }}
                >
                  <span className="text-[10px] tracking-[0.16em] uppercase" style={{ color: T.muted }}>Marge nette</span>
                  <span className="text-lg font-semibold" style={{ color: TONE[marge.tone].fg, fontVariantNumeric: "tabular-nums" }}>
                    {formatEuroCents(marge.netCents)}
                    {marge.tauxPourcent !== null && (
                      <span className="text-[12px] font-normal ml-2" style={{ color: T.muted }}>{marge.tauxPourcent} %</span>
                    )}
                  </span>
                </div>
                <p className="text-[11.5px] leading-relaxed" style={{ color: marge.tone === "danger" ? TONE.danger.fg : T.muted }}>
                  {marge.netCents < 0
                    ? `Ce prix laisse une perte de ${formatEuroCents(-marge.netCents)} une fois la TVA et les frais réglés.`
                    : `Sur une revente à ${formatEuroCents(reventeCents)}, l'offre de ${formatEuroCents(offreCents)} laisse ${formatEuroCents(marge.netCents)} une fois la TVA sur marge${remiseEnEtatCents > 0 ? " et la remise en état" : ""} déduites.`}
                </p>
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: T.muted }}>
                Renseignez la revente visée et l&apos;offre pour obtenir la marge nette.
              </p>
            )}
          </SectionCard>

          <SectionCard title="La validité de l'offre">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Offre remise le">
                <input type="date" value={f.offerDate} onChange={(e) => set("offerDate", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Valable (jours)">
                <input inputMode="numeric" value={f.validityDays} onChange={(e) => set("validityDays", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
            </div>
            {echeanceLue && (
              <p
                className="inline-flex items-center gap-2 text-[12px]"
                style={{ color: echeanceLue.tone === "muted" ? T.muted : TONE[echeanceLue.tone].fg }}
              >
                <CalendarClock size={13} style={{ flexShrink: 0 }} />
                Jusqu&apos;au {formatDateFr(echeanceLue.echeance)} · {echeanceLue.phrase}
              </p>
            )}
          </SectionCard>

          {mode === "fiche" && (
            <SectionCard title="L'issue">
              <Field label="Statut">
                <select value={f.status} onChange={(e) => set("status", e.target.value as RepriseStatus)} className={selectClass} style={fieldStyle}>
                  {REPRISE_STATUSES.map((s) => <option key={s} value={s}>{REPRISE_STATUS_LABEL[s]}</option>)}
                </select>
              </Field>
              <span
                className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1"
                style={{ backgroundColor: tonalite.bg, border: `1px solid ${tonalite.bd}`, color: tonalite.fg }}
              >
                {REPRISE_STATUS_LABEL[f.status]}
              </span>
              {f.status === "refusee" && (
                <Field label="Motif du refus">
                  <select value={f.refusalReason} onChange={(e) => set("refusalReason", e.target.value as RefusalReason)} className={selectClass} style={fieldStyle}>
                    <option value="">À préciser</option>
                    {REFUSAL_REASONS.map((r) => <option key={r} value={r}>{REFUSAL_REASON_LABEL[r]}</option>)}
                  </select>
                </Field>
              )}
            </SectionCard>
          )}

          {mode === "fiche" && (
            <SectionCard title="Le passage au stock">
              {f.vehicleId ? (
                <>
                  <p className="text-[12.5px]" style={{ color: T.textDim }}>
                    Cette estimation est entrée au parc. Son prix d&apos;achat et sa remise en état sont
                    déjà portés au suivi du véhicule.
                  </p>
                  {vehiculeExiste ? (
                    <Link
                      href={`/admin/vehicules/${f.vehicleId}/suivi`}
                      className="inline-flex items-center gap-2 text-[12px]"
                      style={{ color: T.accent }}
                    >
                      <Car size={13} />
                      Voir la fiche véhicule
                    </Link>
                  ) : (
                    <p className="text-[12px]" style={{ color: T.muted }}>
                      La fiche véhicule a depuis été retirée du parc. L&apos;estimation, elle, reste consultable.
                    </p>
                  )}
                </>
              ) : manquesStock.length > 0 ? (
                <p className="text-[12.5px]" style={{ color: T.muted }}>
                  Complétez {manquesStock.join(", ")} pour faire entrer ce véhicule au parc.
                </p>
              ) : (
                <>
                  <p className="text-[12.5px]" style={{ color: T.textDim }}>
                    La fiche véhicule naît préremplie et hors ligne, avec le prix d&apos;achat
                    {reconditionAffichee ? " et la remise en état" : ""} déjà portés à son suivi.
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmStock(true)}
                    disabled={busy}
                    className={btnPrimaryClass}
                    style={btnPrimaryStyle}
                  >
                    <ArrowRightLeft size={14} />
                    Passer au stock
                  </button>
                </>
              )}
            </SectionCard>
          )}

          <SectionCard title="La suite à donner">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Recontacter le">
                <input type="date" value={f.nextActionAt} min={today} onChange={(e) => set("nextActionAt", e.target.value)} className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Intitulé du rappel">
                <input value={f.nextActionLabel} onChange={(e) => set("nextActionLabel", e.target.value)} placeholder="Relancer l'offre de reprise" className={inputClass} style={fieldStyle} />
              </Field>
              <Field label="Notes internes">
                <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="px-4 py-3 text-sm outline-none w-full resize-y focus:border-[#6B9FEE]" style={fieldStyle} />
              </Field>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Barre d'enregistrement collée en bas : le bouton reste sous la main à
          toutes les hauteurs de page, là où il fallait descendre le chercher. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:left-[232px]"
        style={{ backgroundColor: T.float, borderTop: `1px solid ${T.border}` }}
      >
        <div className="mx-auto max-w-6xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* La barre porte les deux chiffres qui décident : ce qu'on annonce
              au client, et ce qu'il en reste une fois la TVA et les frais
              réglés. Ils restent sous les yeux à toutes les hauteurs de page. */}
          <span className="text-sm min-w-0 truncate" style={{ color: T.muted }}>
            {offreCents > 0 ? (
              <>
                Offre <strong style={{ color: T.text }}>{formatEuroCents(offreCents)}</strong>
                {marge && (
                  <>
                    {" · marge nette "}
                    <strong style={{ color: TONE[marge.tone].fg }}>{formatEuroCents(marge.netCents)}</strong>
                  </>
                )}
                {echeanceLue && <span className="hidden sm:inline"> · {echeanceLue.phrase}</span>}
              </>
            ) : (
              titre
            )}
          </span>
          <span className="flex items-center gap-3">
            <Link href="/admin/reprises" className={btnGhostClass} style={btnGhostStyle}>Annuler</Link>
            <button type="button" onClick={() => enregistrer()} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {busy ? "…" : mode === "creation" ? "Enregistrer l'estimation" : "Enregistrer"}
            </button>
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette estimation ?"
        description={`${reprise.reference} · ${titre}. La fiche client et son affaire commerciale restent en place.`}
        busy={busy}
        onConfirm={supprimer}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmStock}
        title="Créer la fiche véhicule à partir de cette estimation ?"
        confirmLabel="Créer la fiche"
        description={
          <>
            <span className="block">{titre} · {formatEuroCents(offreCents)}</span>
            <span className="block mt-2">
              La fiche naît hors ligne, retirée du site public. Son suivi porte déjà le prix d&apos;achat
              {reconditionAffichee ? ` et la remise en état de ${formatEuroCents(remiseEnEtatCents)}` : ""}.
            </span>
          </>
        }
        busy={busy}
        onConfirm={passerAuStock}
        onCancel={() => setConfirmStock(false)}
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
                L&apos;estimation lui sera rattachée et ses champs vides complétés. Modifiez l&apos;email ou le téléphone pour créer une fiche distincte.
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
