// Avis clients de la démonstration /demoprooo (lecture seule).
// Reproduit fidèlement le module « Avis clients » du back-office : on liste les
// acheteurs à inviter à laisser un avis Google, puis ceux déjà sollicités.
// Alimenté par des données d'exemple figées (src/lib/demo-data.ts). Aucun accès
// base, aucun fetch : le bouton d'action affiche un simple toast de démo.
import { Star, Send, Check, Link2 } from "lucide-react";
import { formatDateFr } from "@/lib/devis";
import { T, Tag, AdminPage, PageHeader } from "@/app/admin/ui";
import { getDemoReviewClients } from "@/lib/demo-data";
import { DEMO_REVIEW_LINK } from "@/app/demoprooo/demo";
import DemoActionButton from "@/app/demoprooo/DemoActionButton";

export default function DemoAvisPage() {
  const clients = getDemoReviewClients();
  const toSolicit = clients.filter((c) => c.requestedAt === null);
  const done = clients.filter((c) => c.requestedAt !== null);

  return (
    <AdminPage>
      <PageHeader
        title="Avis clients"
        subtitle="Invitez vos acheteurs à vous noter sur Google, après la livraison."
      />

      {/* Bandeau : lien Google configuré pour les invitations */}
      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3 mb-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
      >
        <Link2 size={16} style={{ color: T.accent }} />
        <span className="text-sm" style={{ color: T.textDim }}>
          <span className="font-semibold" style={{ color: T.text }}>Lien Google configuré.</span>
          {" Les invitations renvoient vos acheteurs vers votre fiche Google."}
        </span>
        <span className="text-xs truncate max-w-full sm:ml-auto" style={{ color: T.accent }}>{DEMO_REVIEW_LINK}</span>
      </div>

      {/* À solliciter */}
      <div className="flex items-center gap-2 mb-3">
        <Star size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>À solliciter</h2>
        <span className="text-xs" style={{ color: T.muted }}>· {toSolicit.length}</span>
      </div>
      {toSolicit.length === 0 ? (
        <div className="p-6 mb-8 text-sm inline-flex items-center gap-2" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
          <Check size={15} style={{ color: T.success }} />
          Tous les acheteurs récents ont été sollicités.
        </div>
      ) : (
        <div className="mb-8" style={{ border: `1px solid ${T.border}` }}>
          {toSolicit.map((r, i) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate" style={{ color: T.text }}>{r.name}</span>
                <span className="block text-xs truncate" style={{ color: T.muted }}>{r.reason}</span>
              </span>
              <span className="text-xs truncate hidden sm:inline" style={{ color: T.muted, minWidth: 180 }}>{r.email || "—"}</span>
              <DemoActionButton
                className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2 transition-opacity hover:opacity-90"
                style={{ backgroundColor: T.accent, color: T.bg }}
              >
                <Send size={13} />
                Demander un avis
              </DemoActionButton>
            </div>
          ))}
        </div>
      )}

      {/* Déjà sollicités */}
      {done.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Check size={15} style={{ color: T.success }} />
            <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Déjà sollicités</h2>
            <span className="text-xs" style={{ color: T.muted }}>· {done.length}</span>
          </div>
          <div style={{ border: `1px solid ${T.border}` }}>
            {done.map((r, i) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm truncate" style={{ color: T.textDim }}>{r.name}</span>
                  <span className="block text-xs truncate" style={{ color: T.muted }}>{r.reason}</span>
                </span>
                <span className="text-xs truncate hidden sm:inline" style={{ color: T.muted, minWidth: 180 }}>{r.email || "—"}</span>
                <Tag tone="success">Invité le {formatDateFr(r.requestedAt!)}</Tag>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminPage>
  );
}
