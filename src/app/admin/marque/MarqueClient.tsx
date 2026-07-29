"use client";

// Éditeur marque blanche : nom, sous-titre et couleur d'accent de l'instance.
// L'aperçu applique la couleur localement ; l'enregistrement rebrande tout l'admin.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Palette, RotateCcw, BadgeCheck, ChevronRight, Star } from "lucide-react";
import { T, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";
import DevisDocument from "../devis/DevisDocument";
import { brandingFromTheme, emptyQuote, type DocTheme } from "@/lib/devis";

const DEFAULTS = { name: "Intelligence Automobile", tagline: "Back-office", accent: "#6B9FEE", reviewLink: "" };

// Devis d'exemple servant d'aperçu : le réglage se juge sur le document réel,
// pas sur une description.
const APERCU_LIGNES = [
  { id: "a1", designation: "Volkswagen Golf 8 GTI", detail: "2022 · 41 600 km · Essence · DSG7", qty: 1, unitPrice: 32900 },
  { id: "a2", designation: "Carte grise et frais de dossier", detail: "", qty: 1, unitPrice: 480 },
];

const PRESETS = [
  { accent: "#6B9FEE", label: "Bleu" },
  { accent: "#E8734A", label: "Orange" },
  { accent: "#4ED1A1", label: "Vert" },
  { accent: "#C89B3C", label: "Or" },
  { accent: "#A78BFA", label: "Violet" },
  { accent: "#EC5E7B", label: "Rose" },
];

type Theme = {
  name: string; tagline: string; accent: string; reviewLink: string;
  logoUrl: string; docAccent: string; docTheme: string;
  emitterName: string; emitterAddress: string; emitterRepresentative: string;
  emitterEmail: string; emitterPhone: string; emitterSiret: string; emitterTva: string;
  emitterIban: string; emitterBic: string; emitterBank: string; legalFootnote: string;
};

const DOC_THEMES: [DocTheme, string][] = [["classic", "Classique"], ["colored", "Coloré"], ["minimal", "Épuré"]];

export default function MarqueClient({ initial }: { initial: Theme }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [form, setForm] = useState<Theme>(initial);
  const [busy, setBusy] = useState(false);

  // Devis d'exemple recomposé à chaque frappe, avec l'identité en cours de saisie.
  const apercu = useMemo(() => {
    const q = emptyQuote("2026-014", new Date().toISOString().slice(0, 10), brandingFromTheme(form));
    q.clientCompany = "SARL Motors 47";
    q.clientName = "M. Fabre";
    q.clientAddress = "8 rue des Lilas\n33000 Bordeaux";
    q.items = APERCU_LIGNES;
    return q;
  }, [form]);

  async function save(theme: Theme) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error);
      }
      toast.success("Thème appliqué à tout le back-office.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'enregistrement a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage width="narrow">
      <PageHeader
        title="Marque blanche"
        subtitle="Le back-office aux couleurs de votre enseigne : idéal avant une démonstration."
      />

      <div className="space-y-4">
        <SectionCard title="Identité">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Nom de l&apos;enseigne</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="px-4 py-3 text-sm outline-none w-full"
                style={fieldStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Sous-titre</label>
              <input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="Back-office, Gestion, DMS…"
                className="px-4 py-3 text-sm outline-none w-full"
                style={fieldStyle}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Couleur d&apos;accent</label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.accent}
                  type="button"
                  title={p.label}
                  onClick={() => setForm((f) => ({ ...f, accent: p.accent }))}
                  className="w-9 h-9 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: p.accent,
                    border: form.accent.toLowerCase() === p.accent.toLowerCase() ? "2px solid #F0F5FF" : `1px solid ${T.border}`,
                  }}
                />
              ))}
              <input
                type="color"
                value={form.accent}
                onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value }))}
                aria-label="Couleur personnalisée"
                className="w-9 h-9 cursor-pointer bg-transparent"
                style={{ border: `1px solid ${T.border}`, padding: 2 }}
              />
              <span className="text-xs ml-1" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>{form.accent.toUpperCase()}</span>
            </div>
          </div>
        </SectionCard>

        {/* ── Identité des documents ──
            C'est ce réglage qui fait sortir les devis au nom du revendeur.
            Chaque champ laissé vide reprend l'identité d'Intelligence Automobile. */}
        <SectionCard title="Vos devis et factures">
          <p className="text-[12px] -mt-1" style={{ color: T.muted }}>
            Ces informations s&apos;impriment sur chaque devis et chaque facture. Un champ laissé vide reprend la valeur d&apos;origine.
          </p>

          <div className="flex items-end gap-3">
            <span
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 84, height: 56, backgroundColor: "#FFFFFF", border: `1px solid ${T.border}` }}
            >
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
              ) : (
                <span style={{ color: "#B9C0CC", fontSize: 18 }}>—</span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <label className={labelClass} style={{ color: T.textDim }}>Adresse du logo</label>
              <input
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="/Logo/mon-logo.png ou https://…"
                className="px-4 py-3 text-sm outline-none w-full"
                style={fieldStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Raison sociale</label>
              <input value={form.emitterName} onChange={(e) => setForm((f) => ({ ...f, emitterName: e.target.value }))} placeholder="SARL Garage Lantier" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Représentant</label>
              <input value={form.emitterRepresentative} onChange={(e) => setForm((f) => ({ ...f, emitterRepresentative: e.target.value }))} placeholder="Prénom et nom" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Adresse</label>
            <textarea value={form.emitterAddress} onChange={(e) => setForm((f) => ({ ...f, emitterAddress: e.target.value }))} rows={3} placeholder={"14 avenue de la République\n69003 Lyon\nFrance"} className="px-4 py-3 text-sm outline-none w-full" style={{ ...fieldStyle, resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Email</label>
              <input value={form.emitterEmail} onChange={(e) => setForm((f) => ({ ...f, emitterEmail: e.target.value }))} placeholder="contact@…" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Téléphone</label>
              <input value={form.emitterPhone} onChange={(e) => setForm((f) => ({ ...f, emitterPhone: e.target.value }))} placeholder="+33 …" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>SIRET</label>
              <input value={form.emitterSiret} onChange={(e) => setForm((f) => ({ ...f, emitterSiret: e.target.value }))} placeholder="912 345 678 00019" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>N° TVA intracom.</label>
              <input value={form.emitterTva} onChange={(e) => setForm((f) => ({ ...f, emitterTva: e.target.value }))} placeholder="FR62912345678" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Banque</label>
              <input value={form.emitterBank} onChange={(e) => setForm((f) => ({ ...f, emitterBank: e.target.value }))} placeholder="Qonto" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} style={{ color: T.textDim }}>IBAN</label>
              <input value={form.emitterIban} onChange={(e) => setForm((f) => ({ ...f, emitterIban: e.target.value }))} placeholder="FR76 3000 4000 0100 0000 0000 000" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>BIC</label>
              <input value={form.emitterBic} onChange={(e) => setForm((f) => ({ ...f, emitterBic: e.target.value }))} placeholder="QNTOFRP1XXX" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Mention légale de pied de page</label>
            <textarea value={form.legalFootnote} onChange={(e) => setForm((f) => ({ ...f, legalFootnote: e.target.value }))} rows={3} placeholder="SARL au capital de 50 000 €, RCS Lyon 912 345 678…" className="px-4 py-3 text-sm outline-none w-full" style={{ ...fieldStyle, resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Couleur du document</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.docAccent || form.accent}
                  onChange={(e) => setForm((f) => ({ ...f, docAccent: e.target.value }))}
                  aria-label="Couleur du document"
                  className="w-9 h-9 cursor-pointer bg-transparent"
                  style={{ border: `1px solid ${T.border}`, padding: 2 }}
                />
                <span className="text-xs" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
                  {(form.docAccent || form.accent).toUpperCase()}
                </span>
                {form.docAccent && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, docAccent: "" }))} className="text-[11px] tracking-widest uppercase ml-auto" style={{ color: T.accent }}>
                    Suivre l&apos;écran
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: T.textDim }}>Mise en forme</label>
              <div className="flex gap-1">
                {DOC_THEMES.map(([val, lab]) => {
                  const active = form.docTheme === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, docTheme: val }))}
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
            </div>
          </div>
        </SectionCard>

        {/* Aperçu du document : le réglage se juge sur le papier */}
        <SectionCard title="Votre devis, en direct">
          <div
            style={{ backgroundColor: "#04080F", border: `1px solid ${T.border}`, padding: 14, maxHeight: 460, overflow: "auto" }}
          >
            <div style={{ position: "relative", width: 420, height: 594, margin: "0 auto", boxShadow: "0 18px 50px rgba(0,0,0,0.5)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 793.7, transform: "scale(0.529)", transformOrigin: "top left" }}>
                <DevisDocument quote={apercu} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Avis clients">
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Lien Google « laisser un avis »</label>
            <input
              value={form.reviewLink}
              onChange={(e) => setForm((f) => ({ ...f, reviewLink: e.target.value }))}
              placeholder="https://g.page/r/…/review"
              className="px-4 py-3 text-sm outline-none w-full"
              style={fieldStyle}
            />
          </div>
          <p className="text-[12px] flex items-start gap-2" style={{ color: T.muted }}>
            <Star size={14} style={{ color: T.warning, flexShrink: 0, marginTop: 1 }} />
            Ce lien est utilisé par la page « Avis clients » pour inviter vos acheteurs à vous noter sur Google. Récupérez-le dans votre fiche d&apos;établissement Google (bouton « Demander des avis »).
          </p>
        </SectionCard>

        {/* Aperçu : la variable est surchargée localement sur ce bloc */}
        <div style={{ ["--adm-accent" as never]: form.accent }}>
          <SectionCard title="Aperçu en direct">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="p-4 sm:w-56 flex-shrink-0" style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <span className="block text-[12px] tracking-[0.24em] uppercase font-semibold" style={{ color: T.text }}>
                  {form.name || "Votre enseigne"}
                </span>
                <span className="block text-[8px] tracking-[0.38em] uppercase mt-1" style={{ color: "#C7D3E8" }}>
                  {form.tagline || "Back-office"}
                </span>
                <div className="mt-4 space-y-1">
                  <span
                    className="relative flex items-center gap-2 px-2 py-1.5 text-[11px]"
                    style={{ color: T.text, backgroundColor: "var(--adm-accent-soft)", fontWeight: 600 }}
                  >
                    <span className="absolute left-0 top-1 bottom-1 w-[2px]" style={{ background: "linear-gradient(to bottom, transparent, var(--adm-accent), transparent)" }} />
                    <Palette size={12} style={{ color: "var(--adm-accent)" }} />
                    Section active
                  </span>
                  <span className="flex items-center gap-2 px-2 py-1.5 text-[11px]" style={{ color: T.muted }}>
                    <ChevronRight size={12} />
                    Autre section
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <div className="p-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
                  <div style={{ width: 24, height: 2, backgroundColor: "var(--adm-accent)" }} className="mb-3" />
                  <div className="text-2xl font-light" style={{ color: "var(--adm-accent)" }}>128 500 €</div>
                  <div className="text-[10px] tracking-widest uppercase mt-1" style={{ color: T.textDim }}>Valeur du stock</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={btnPrimaryClass} style={btnPrimaryStyle}>
                    <BadgeCheck size={13} />
                    Bouton principal
                  </span>
                  <span
                    className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1"
                    style={{ backgroundColor: "var(--adm-accent-soft)", border: "1px solid var(--adm-accent-border)", color: "var(--adm-accent)" }}
                  >
                    Disponible
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => save(form)} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
            {busy ? "…" : "Appliquer le thème"}
          </button>
          <button
            type="button"
            onClick={() => {
              const reset = { ...form, ...DEFAULTS, reviewLink: form.reviewLink };
              setForm(reset);
              save(reset);
            }}
            disabled={busy}
            className={btnGhostClass}
            style={btnGhostStyle}
          >
            <RotateCcw size={13} />
            Thème Intelligence Automobile
          </button>
        </div>
      </div>
    </AdminPage>
  );
}
