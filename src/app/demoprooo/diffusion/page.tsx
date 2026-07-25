// Diffusion multi-portails de la démonstration /demoprooo (lecture seule).
// Reproduit fidèlement le module de diffusion du back-office : états de
// publication par portail, vues simulées et statistiques en tête. Les données
// viennent des fixtures figées (src/lib/demo-data.ts). Aucun accès base, aucun
// appel réseau : chaque action affiche un toast via DemoActionButton.
import { Radio, Car, Eye, FileCode2, Check, CircleOff } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { PORTALS, PORTAL_LABEL, simulatedViews } from "@/lib/diffusion";
import { T, TONE, AdminPage, PageHeader, Thumb, firstImage, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { getDemoVehicles, getDemoListings } from "@/lib/demo-data";
import DemoActionButton from "../DemoActionButton";

export default function DemoDiffusionPage() {
  // On diffuse le stock encore en vente (comme le back-office).
  const vehicles = getDemoVehicles().filter((v) => v.status === "disponible" || v.status === "reserve");
  const listings = getDemoListings();

  // Index des annonces par clé « véhicule:portail ».
  const byKey = new Map<string, (typeof listings)[number]>();
  listings.forEach((l) => byKey.set(`${l.vehicleId}:${l.portal}`, l));

  // Statistiques d'en-tête : annonces diffusées et vues cumulées.
  let published = 0;
  let totalViews = 0;
  for (const v of vehicles) {
    let anyPortal = false;
    for (const p of PORTALS) {
      const l = byKey.get(`${v.id}:${p}`);
      if (l?.status === "publie") {
        anyPortal = true;
        totalViews += simulatedViews(v.id, p, l.publishedAt);
      }
    }
    if (anyPortal) published++;
  }

  return (
    <AdminPage>
      <PageHeader
        title="Diffusion des annonces"
        subtitle="Publication multi-portails de votre stock disponible."
        action={
          <DemoActionButton
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase px-5 py-3 border transition-colors duration-200 hover:border-[#6B9FEE] hover:text-[#F0F5FF]"
            style={{ borderColor: T.border, color: T.textDim }}
          >
            <FileCode2 size={14} />
            Flux XML
          </DemoActionButton>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="adm-card adm-enter p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "60ms" }}>
          <div className="adm-hairline" />
          <div className="flex items-start justify-between">
            <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.muted }}>Annonces diffusées</span>
            <Radio size={16} style={{ color: "#C7D3E8", opacity: 0.75 }} />
          </div>
          <div className="text-[28px] font-light mt-3" style={{ color: T.text }}>
            {published}
            <span className="text-sm ml-1" style={{ color: T.muted }}>/ {vehicles.length}</span>
          </div>
        </div>
        <div className="adm-card adm-enter p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "140ms" }}>
          <div className="adm-hairline" />
          <div className="flex items-start justify-between">
            <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.muted }}>Portails actifs</span>
            <Car size={16} style={{ color: "#C7D3E8", opacity: 0.75 }} />
          </div>
          <div className="text-[28px] font-light mt-3" style={{ color: T.text }}>{PORTALS.length}</div>
        </div>
        <div className="adm-card adm-enter p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "220ms" }}>
          <div className="adm-hairline" />
          <div className="flex items-start justify-between">
            <span className="text-[11px] tracking-[0.16em] uppercase" style={{ color: T.muted }}>Vues cumulées</span>
            <Eye size={16} style={{ color: "#C7D3E8", opacity: 0.75 }} />
          </div>
          <div className="text-[28px] font-light mt-3" style={{ color: T.text }}>{formatNumber(totalViews)}</div>
        </div>
      </div>

      {/* Annonces */}
      <div style={{ border: `1px solid ${T.border}` }}>
        {vehicles.map((v, i) => {
          const allPublished = PORTALS.every((p) => byKey.get(`${v.id}:${p}`)?.status === "publie");
          return (
            <div
              key={v.id}
              className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <div className="flex items-center gap-4 min-w-0 lg:w-72 flex-shrink-0">
                <Thumb src={firstImage(v.images)} alt={`${v.make} ${v.model}`} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-xs tracking-widest uppercase flex-shrink-0" style={{ color: T.accent }}>{v.make}</span>
                    <span className="text-sm font-medium truncate" style={{ color: T.text }}>{v.model}</span>
                  </div>
                  <span className="text-xs" style={{ color: T.muted }}>
                    {v.year} · {formatNumber(v.price)} €
                  </span>
                </div>
              </div>

              {/* Portails */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                {PORTALS.map((portal) => {
                  const l = byKey.get(`${v.id}:${portal}`);
                  const isPub = l?.status === "publie";
                  const views = isPub ? simulatedViews(v.id, portal, l.publishedAt) : 0;
                  const tone = isPub ? TONE.success : TONE.muted;
                  return (
                    <DemoActionButton
                      key={portal}
                      title={isPub ? "Retirer l'annonce" : "Publier l'annonce"}
                      className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase px-2.5 py-1.5 whitespace-nowrap transition-all hover:opacity-90"
                      style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}
                    >
                      {isPub ? <Check size={11} /> : <CircleOff size={11} style={{ opacity: 0.6 }} />}
                      {PORTAL_LABEL[portal]}
                      {isPub && views > 0 && (
                        <span className="normal-case tracking-normal" style={{ color: T.muted }}>
                          · {formatNumber(views)} vues
                        </span>
                      )}
                    </DemoActionButton>
                  );
                })}
              </div>

              <div className="flex-shrink-0">
                {allPublished ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase" style={{ color: T.success }}>
                    <Check size={13} />
                    Diffusé partout
                  </span>
                ) : (
                  <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
                    <Radio size={13} />
                    Diffuser
                  </DemoActionButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] mt-4" style={{ color: T.muted }}>
        Démonstration : les statuts et les vues sont des exemples figés. En conditions réelles, la publication
        s&apos;appuie sur un compte agrégateur (Ubiflow, Spider VO…) ou des comptes professionnels sur chaque portail,
        alimentés par un flux XML d&apos;export prêt à l&apos;emploi.
      </p>
    </AdminPage>
  );
}
