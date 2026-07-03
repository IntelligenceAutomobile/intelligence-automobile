"use client";

// Éditeur marque blanche : nom, sous-titre et couleur d'accent de l'instance.
// L'aperçu applique la couleur localement ; l'enregistrement rebrande tout l'admin.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Palette, RotateCcw, BadgeCheck, ChevronRight } from "lucide-react";
import { T, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";

const DEFAULTS = { name: "Intelligence Automobile", tagline: "Back-office", accent: "#6B9FEE" };

const PRESETS = [
  { accent: "#6B9FEE", label: "Bleu" },
  { accent: "#E8734A", label: "Orange" },
  { accent: "#4ED1A1", label: "Vert" },
  { accent: "#C89B3C", label: "Or" },
  { accent: "#A78BFA", label: "Violet" },
  { accent: "#EC5E7B", label: "Rose" },
];

type Theme = { name: string; tagline: string; accent: string };

export default function MarqueClient({ initial }: { initial: Theme }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [form, setForm] = useState<Theme>(initial);
  const [busy, setBusy] = useState(false);

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
              setForm(DEFAULTS);
              save(DEFAULTS);
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
