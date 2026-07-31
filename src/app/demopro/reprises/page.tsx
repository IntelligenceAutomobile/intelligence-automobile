// Reprises / estimations de la démonstration /demopro (lecture seule).
// Reproduit la liste du back-office (src/app/admin/reprises), alimentée par des
// données d'exemple figées (src/lib/demo-data.ts). Aucun accès base, aucune
// action réelle : le garde-fou du contrôle qualité interdit d'importer ici la
// base, l'authentification ou le client Prisma.
//
// L'écran suit le vrai module colonne pour colonne : c'est la page qui sert à
// démarcher, et une démonstration en retard sur l'outil se voit tout de suite.
import Link from "next/link";
import { Plus, HandCoins, Search, Check, X } from "lucide-react";
import { formatEuroCents } from "@/lib/comptes";
import { formatNumber } from "@/lib/format";
import { REPRISE_FILTERS, REPRISE_STATUS_LABEL, REPRISE_STATUS_TONE, type RepriseStatus } from "@/lib/reprises";
import { T, TONE, Tag, AdminPage, PageHeader, fieldStyle, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { getDemoReprises } from "@/lib/demo-data";
import DemoActionButton from "@/app/demopro/DemoActionButton";
import { DEMO_BASE } from "../demo";

// Même définition que le vrai module : l'en-tête et les lignes doivent porter
// exactement la même grille, sinon les colonnes se décalent.
const GRILLE =
  "@[640px]:grid-cols-[92px_minmax(140px,1fr)_112px_128px_92px] " +
  "@[980px]:grid-cols-[96px_minmax(160px,1fr)_116px_112px_136px_88px_92px]";

function ancienneteDe(jour: string): string {
  const j = Math.round((Date.now() - Date.parse(`${jour}T12:00:00Z`)) / 86_400_000);
  if (j <= 0) return "aujourd'hui";
  if (j === 1) return "hier";
  if (j < 30) return `il y a ${j} j`;
  return new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function DemoReprisesPage() {
  const reprises = getDemoReprises();
  const comptes: Record<string, number> = { all: reprises.length };
  for (const r of reprises) comptes[r.status] = (comptes[r.status] ?? 0) + 1;
  const enAttente = reprises.filter((r) => r.status === "proposee").length;

  return (
    <AdminPage>
      <PageHeader
        title="Reprises"
        subtitle={`${reprises.length} estimations · ${enAttente} offre${enAttente > 1 ? "s attendent" : " attend"} une réponse.`}
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle estimation
          </DemoActionButton>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <div className="relative sm:max-w-xs w-full">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.muted }} />
          <input
            readOnly
            placeholder="Rechercher · touche /"
            aria-label="Rechercher une estimation"
            className="pl-11 pr-10 py-3 text-sm outline-none w-full"
            style={fieldStyle}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {REPRISE_FILTERS.map((f) => {
            const n = comptes[f.value] ?? 0;
            if (f.value !== "all" && n === 0) return null;
            const actif = f.value === "all";
            return (
              <span
                key={f.value}
                className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2.5 border"
                style={{
                  borderColor: actif ? T.accent : T.border,
                  color: actif ? T.bg : T.textDim,
                  backgroundColor: actif ? T.accent : "transparent",
                }}
              >
                {f.label}
                <span style={{ opacity: 0.75 }}>{n}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="@container" style={{ border: `1px solid ${T.border}` }}>
        <div
          className={`hidden @[640px]:grid items-center px-4 py-2 gap-x-3 ${GRILLE}`}
          style={{ backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}
        >
          <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Réf.</span>
          <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Véhicule</span>
          <span className="text-[10px] tracking-[0.14em] uppercase hidden @[980px]:block" style={{ color: T.muted }}>Plaque</span>
          <span className="text-[10px] tracking-[0.14em] uppercase text-right" style={{ color: T.muted }}>Offre</span>
          <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Statut</span>
          <span className="text-[10px] tracking-[0.14em] uppercase text-right hidden @[980px]:block" style={{ color: T.muted }}>Estimée</span>
          <span className="text-[10px] tracking-[0.14em] uppercase text-right" style={{ color: T.muted }}>Issue</span>
        </div>

        {reprises.map((r, i) => {
          const statut = r.status as RepriseStatus;
          const ouverte = statut === "brouillon" || statut === "proposee";
          return (
            <div
              key={r.id}
              className={`group relative grid items-center px-4 py-3 gap-x-3 gap-y-2 grid-cols-[1fr_auto] ${GRILLE}`}
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <Link
                href={`${DEMO_BASE}/reprises`}
                className="absolute inset-0"
                aria-label={`Ouvrir l'estimation ${r.reference}`}
                style={{ zIndex: 0 }}
              />

              <span className="text-xs tracking-widest uppercase whitespace-nowrap hidden @[640px]:block" style={{ color: T.accent }}>
                {r.reference}
              </span>

              <span className="min-w-0 col-span-2 @[640px]:col-span-1">
                <span className="flex items-center gap-2 min-w-0">
                  <HandCoins size={15} className="@[640px]:hidden" style={{ color: T.accent, flexShrink: 0 }} />
                  <span className="text-sm truncate" style={{ color: T.text }}>{r.vehicule}</span>
                </span>
                <span className="text-[11px] truncate block mt-0.5" style={{ color: T.muted }}>
                  {[r.vendeur, `${formatNumber(r.mileageKm)} km`, r.fuel].join(" · ")}
                  <span className="@[640px]:hidden"> · {r.plate} · {r.reference}</span>
                </span>
              </span>

              <span className="text-[12px] hidden @[980px]:block truncate" style={{ color: T.textDim }}>{r.plate}</span>

              <span
                className="text-sm font-semibold text-right whitespace-nowrap"
                style={{ color: r.offerCents > 0 ? T.text : T.border, fontVariantNumeric: "tabular-nums" }}
              >
                {r.offerCents > 0 ? formatEuroCents(r.offerCents) : "—"}
              </span>

              <span className="flex">
                <Tag tone={REPRISE_STATUS_TONE[statut]}>{REPRISE_STATUS_LABEL[statut]}</Tag>
              </span>

              <span className="text-[11px] text-right hidden @[980px]:block whitespace-nowrap" style={{ color: T.muted }}>
                {ancienneteDe(r.offerDate)}
              </span>

              {ouverte ? (
                <div
                  className="adm-row-actions flex items-center gap-1 col-span-2 @[640px]:col-span-1 justify-start @[640px]:justify-end
                             border-t @[640px]:border-t-0 pt-1.5 @[640px]:pt-0"
                  style={{ borderColor: T.border }}
                >
                  <DemoActionButton
                    className="adm-act inline-flex items-center justify-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors flex-shrink-0 relative z-10 px-2.5 py-1.5"
                    style={{ color: TONE.success.fg }}
                  >
                    <Check size={13} />
                    <span className="@[640px]:hidden @[980px]:inline">Acceptée</span>
                  </DemoActionButton>
                  <DemoActionButton
                    className="adm-act inline-flex items-center justify-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors flex-shrink-0 relative z-10 px-2.5 py-1.5"
                    style={{ color: T.muted }}
                  >
                    <X size={13} />
                    <span className="@[640px]:hidden @[980px]:inline">Refusée</span>
                  </DemoActionButton>
                </div>
              ) : (
                <span className="hidden @[640px]:block" />
              )}
            </div>
          );
        })}
      </div>
    </AdminPage>
  );
}
