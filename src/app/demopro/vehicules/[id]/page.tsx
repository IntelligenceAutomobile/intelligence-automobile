// Fiche véhicule de la démonstration publique /demopro (lecture seule).
// Reproduit la fiche du back-office alimentée par les données d'exemple figées
// (src/lib/demo-data.ts) : galerie, caractéristiques, présentation, état,
// équipements, documents et historique d'entretien. Aucun accès base.
// Les boutons Modifier / Publier / Supprimer affichent un toast au lieu d'agir.
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Pencil, Send, Trash2, Car, FileText, Wrench } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { T, AdminPage, SectionCard, StatusBadge, Tag, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { DemoPageHeader } from "@/app/demopro/DemoPageHeader";
import { getDemoVehicle } from "@/lib/demo-data";
import { DEMO_BASE } from "../../demo";
import DemoActionButton from "../../DemoActionButton";

type Highlight = { icon: string; label: string; text: string };
type MaintEntry = { date: string; km: string; operation: string; amount?: string; linkedDoc?: string };
type DocItem = { url: string; label: string };

function parseJson<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

const FUEL_LABEL: Record<string, string> = {
  Diesel: "Diesel",
  Essence: "Essence",
  Hybride: "Hybride",
  Électrique: "Électrique",
};

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col px-4 py-3.5" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1.5" style={{ color: T.muted }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: T.text }}>{value}</span>
    </div>
  );
}

export default async function DemoVehiculeFiche({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = getDemoVehicle(id);
  if (!v) notFound();

  const images = parseJson<string[]>(v.images, []);
  const features = parseJson<string[]>(v.features, []);
  const conditionFacts = parseJson<string[]>(v.conditionFacts, []);
  const highlights = parseJson<Highlight[]>(v.maintenanceHighlights, []);
  const maintenance = parseJson<MaintEntry[]>(v.maintenanceHistory, []);
  const documents = parseJson<DocItem[]>(v.documents, []);

  const descParagraphs = (v.description ?? "").split("\n\n").map((p) => p.trim()).filter(Boolean);
  const pointsForts = features.slice(0, 6);
  const fuelLabel = FUEL_LABEL[v.fuel] ?? v.fuel;
  const mainImage = images[0] ?? null;

  const specs = [
    { label: "Année", value: String(v.year) },
    { label: "Kilométrage", value: `${formatNumber(v.mileage)} km` },
    v.power ? { label: "Puissance", value: `${v.power} ch` } : null,
    { label: "Carburant", value: fuelLabel },
    { label: "Boîte de vitesses", value: v.transmission },
    { label: "Couleur", value: v.color },
    { label: "Origine", value: v.origin },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <AdminPage width="wide">
      <Link
        href={`${DEMO_BASE}/vehicules`}
        className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        ← Stock
      </Link>

      <DemoPageHeader
        title={`${v.make} ${v.model}`}
        subtitle="Aperçu complet de la fiche en lecture seule."
        action={
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <Link href={`${DEMO_BASE}/vehicules/${v.id}/suivi`} className={btnGhostClass} style={btnGhostStyle}>
              <ClipboardList size={14} />
              Suivi du véhicule
            </Link>
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <Pencil size={14} />
              Modifier
            </DemoActionButton>
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <Send size={14} />
              Publier
            </DemoActionButton>
            <DemoActionButton className={btnGhostClass} style={{ ...btnGhostStyle, borderColor: "rgba(255,107,53,0.35)", color: T.danger }}>
              <Trash2 size={14} />
              Supprimer
            </DemoActionButton>
          </div>
        }
      />

      {/* En-tête : galerie + carte caractéristiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Galerie */}
        <div style={{ border: `1px solid ${T.border}`, backgroundColor: T.surface }} className="p-3">
          <div className="overflow-hidden" style={{ aspectRatio: "4 / 3", backgroundColor: T.float }}>
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Car size={28} style={{ color: T.muted }} /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
              {images.slice(1).map((url, i) => (
                <div key={i} className="overflow-hidden" style={{ aspectRatio: "4 / 3", backgroundColor: T.float, border: `1px solid ${T.border}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${v.make} ${v.model} — photo ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <p className="text-[11px] mt-2" style={{ color: T.muted }}>
              {images.length} photo{images.length > 1 ? "s" : ""} · la première sert d&apos;image principale
            </p>
          )}
        </div>

        {/* Caractéristiques */}
        <div style={{ border: `1px solid ${T.border}`, backgroundColor: T.surface }} className="p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4">
            <StatusBadge status={v.status} />
            <Tag tone={v.isPublished ? "success" : "muted"}>{v.isPublished ? "Visible publiquement" : "Masqué du public"}</Tag>
          </div>
          <div>
            <span className="text-[10px] font-medium tracking-[0.3em] uppercase" style={{ color: T.muted }}>Prix de vente</span>
            <div className="text-[34px] font-light leading-none mt-1.5" style={{ color: T.text }}>{formatNumber(v.price)} €</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-5">
            {specs.map((s) => (
              <Spec key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </div>
      </div>

      {/* Présentation */}
      {descParagraphs.length > 0 && (
        <div className="mb-4">
          <SectionCard title="Présentation">
            <div className="space-y-3">
              {descParagraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: T.textDim }}>{p}</p>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* État du véhicule */}
      {conditionFacts.length > 0 && (
        <div className="mb-4">
          <SectionCard title={`État du véhicule (${conditionFacts.length})`}>
            <div className="flex flex-wrap gap-2">
              {conditionFacts.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-2 text-[13px] px-3 py-2"
                  style={{ backgroundColor: "rgba(91,216,154,0.1)", border: "1px solid rgba(91,216,154,0.3)", color: T.text, borderRadius: "6px" }}
                >
                  <span style={{ color: "#5BD89A" }}>✓</span>
                  {f}
                </span>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Équipements & points forts */}
      {features.length > 0 && (
        <div className="mb-4">
          <SectionCard title={`Équipements & points forts (${features.length})`}>
            <p className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>
              Les 6 premiers (★) s&apos;affichent en points forts sur l&apos;annonce.
            </p>
            <div className="flex flex-wrap gap-2">
              {features.map((f, i) => {
                const strong = i < pointsForts.length && i < 6;
                return (
                  <span
                    key={f}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 border"
                    style={{ borderColor: strong ? T.accent : T.border, color: strong ? T.text : T.textDim }}
                  >
                    {strong && <span title="Point fort" style={{ color: T.accent }}>★</span>}
                    {f}
                  </span>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div className="mb-4">
          <SectionCard title={`Documents (${documents.length})`}>
            <p className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>
              Pièces du dossier, protégées par mot de passe côté client.
            </p>
            <div className="space-y-2">
              {documents.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-2 border" style={{ borderColor: T.border }}>
                  <span
                    className="w-11 h-11 flex items-center justify-center flex-shrink-0"
                    style={{ border: `1px solid ${T.border}`, backgroundColor: T.float, color: T.accent }}
                  >
                    <FileText size={16} />
                  </span>
                  <span className="text-sm truncate" style={{ color: T.textDim }}>{d.label || "Document"}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Historique d'entretien */}
      {(highlights.length > 0 || maintenance.length > 0) && (
        <div className="mb-4">
          <SectionCard title="Historique d'entretien">
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {highlights.map((h, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-2 text-[13px] px-3 py-2"
                    style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${T.border}`, color: T.text, borderRadius: "6px" }}
                  >
                    <span aria-hidden>{h.icon}</span>
                    <span className="font-medium">{h.label}</span>
                    {h.text && <span style={{ color: T.muted }}>· {h.text}</span>}
                  </span>
                ))}
              </div>
            )}
            {maintenance.length > 0 && (
              <div style={{ border: `1px solid ${T.border}` }}>
                {maintenance.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
                    <span className="flex items-center justify-center w-7 h-7 flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${T.border}`, color: T.accent }}>
                      <Wrench size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px]" style={{ color: T.textDim }}>{m.operation || "Intervention"}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>
                        {[m.date, m.km ? `${m.km} km` : "", m.amount].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </AdminPage>
  );
}
