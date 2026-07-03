"use client";

// Diffusion multi-portails (module de démonstration) : états de publication
// par portail, cascade de diffusion animée, vues simulées, flux XML réel.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radio, Car, Eye, FileCode2, Check, CircleOff, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { PORTALS, PORTAL_LABEL, simulatedViews, type Portal } from "@/lib/diffusion";
import { T, TONE, AdminPage, PageHeader, Thumb, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import { useToast } from "../toast";

export type DiffVehicle = { id: string; make: string; model: string; year: number; price: number; image: string | null };
export type ListingRow = { vehicleId: string; portal: string; status: string; publishedAt: string | null };

type LiveState = "idle" | "publishing" | "published";

export default function DiffusionClient({ vehicles, listings }: { vehicles: DiffVehicle[]; listings: ListingRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  // État transitoire de la cascade : { [vehicleId:portal]: LiveState }
  const [live, setLive] = useState<Record<string, LiveState>>({});
  const [busyRow, setBusyRow] = useState<string | null>(null);

  const byKey = useMemo(() => {
    const m = new Map<string, ListingRow>();
    listings.forEach((l) => m.set(`${l.vehicleId}:${l.portal}`, l));
    return m;
  }, [listings]);

  const stats = useMemo(() => {
    let published = 0;
    let views = 0;
    for (const v of vehicles) {
      let anyPortal = false;
      for (const p of PORTALS) {
        const l = byKey.get(`${v.id}:${p}`);
        if (l?.status === "publie") {
          anyPortal = true;
          views += simulatedViews(v.id, p, l.publishedAt ? new Date(l.publishedAt) : null);
        }
      }
      if (anyPortal) published++;
    }
    return { published, views };
  }, [vehicles, byKey]);

  async function publishAll(v: DiffVehicle) {
    setBusyRow(v.id);
    try {
      // Cascade visuelle : chaque portail passe par « publication… » puis « ✓ ».
      for (const portal of PORTALS) {
        const k = `${v.id}:${portal}`;
        setLive((s) => ({ ...s, [k]: "publishing" }));
        const res = await fetch("/api/admin/diffusion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId: v.id, portal, action: "publish" }),
        });
        if (!res.ok) throw new Error();
        await new Promise((r) => setTimeout(r, 550));
        setLive((s) => ({ ...s, [k]: "published" }));
        toast.success(`${v.make} ${v.model} — publié sur ${PORTAL_LABEL[portal]}`);
      }
      startTransition(() => router.refresh());
    } catch {
      toast.error("La diffusion a échoué.");
    } finally {
      setBusyRow(null);
    }
  }

  async function togglePortal(v: DiffVehicle, portal: Portal, isPublished: boolean) {
    setBusyRow(v.id);
    try {
      const res = await fetch("/api/admin/diffusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: v.id, portal, action: isPublished ? "unpublish" : "publish" }),
      });
      if (!res.ok) throw new Error();
      if (isPublished) {
        setLive((s) => ({ ...s, [`${v.id}:${portal}`]: "idle" }));
        toast.info(`Annonce retirée de ${PORTAL_LABEL[portal]}.`);
      } else {
        setLive((s) => ({ ...s, [`${v.id}:${portal}`]: "published" }));
        toast.success(`Publié sur ${PORTAL_LABEL[portal]}.`);
      }
      startTransition(() => router.refresh());
    } catch {
      toast.error("La mise à jour a échoué.");
    } finally {
      setBusyRow(null);
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Diffusion des annonces"
        subtitle="Publication multi-portails de votre stock disponible."
        action={
          <a
            href="/api/admin/diffusion/flux"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase px-5 py-3 border transition-colors duration-200 hover:border-[#6B9FEE] hover:text-[#F0F5FF]"
            style={{ borderColor: T.border, color: T.textDim }}
          >
            <FileCode2 size={14} />
            Flux XML
          </a>
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
            {stats.published}
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
          <div className="text-[28px] font-light mt-3" style={{ color: T.text }}>{formatNumber(stats.views)}</div>
        </div>
      </div>

      {/* Annonces */}
      {vehicles.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          Aucune annonce publiée sur le site : rendez un véhicule visible pour le diffuser.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {vehicles.map((v, i) => {
            const rowBusy = busyRow === v.id;
            const allPublished = PORTALS.every((p) => {
              const l = byKey.get(`${v.id}:${p}`);
              const lv = live[`${v.id}:${p}`];
              return lv === "published" || (lv !== "idle" && l?.status === "publie");
            });
            return (
              <div
                key={v.id}
                className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
              >
                <div className="flex items-center gap-4 min-w-0 lg:w-72 flex-shrink-0">
                  <Thumb src={v.image} alt={`${v.make} ${v.model}`} />
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
                    const lv = live[`${v.id}:${portal}`];
                    const isPub = lv === "published" || (lv !== "idle" && l?.status === "publie");
                    const isLoading = lv === "publishing";
                    const views = l?.status === "publie" ? simulatedViews(v.id, portal, l.publishedAt ? new Date(l.publishedAt) : null) : 0;
                    const tone = isPub ? TONE.success : TONE.muted;
                    return (
                      <button
                        key={portal}
                        type="button"
                        disabled={rowBusy}
                        onClick={() => togglePortal(v, portal, isPub)}
                        title={isPub ? "Cliquer pour retirer l'annonce" : "Cliquer pour publier"}
                        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase px-2.5 py-1.5 whitespace-nowrap transition-all disabled:opacity-60"
                        style={{ backgroundColor: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg }}
                      >
                        {isLoading ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : isPub ? (
                          <Check size={11} />
                        ) : (
                          <CircleOff size={11} style={{ opacity: 0.6 }} />
                        )}
                        {PORTAL_LABEL[portal]}
                        {isPub && views > 0 && (
                          <span className="normal-case tracking-normal" style={{ color: T.muted }}>
                            · {formatNumber(views)} vues
                          </span>
                        )}
                      </button>
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
                    <button
                      type="button"
                      disabled={rowBusy}
                      onClick={() => publishAll(v)}
                      className={btnPrimaryClass}
                      style={btnPrimaryStyle}
                    >
                      {rowBusy ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} />}
                      Diffuser
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] mt-4" style={{ color: T.muted }}>
        Module de démonstration : la publication effective nécessite un compte agrégateur (Ubiflow, Spider VO…) ou des
        comptes pro portails. Le flux XML d&apos;export, lui, est réel et prêt à être consommé.
      </p>
    </AdminPage>
  );
}
