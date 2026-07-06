"use client";

// Demande d'avis Google : le système liste les clients ayant acheté ; on les
// invite d'un clic à laisser un avis (email avec le lien Google de l'enseigne).
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Send, Check, MailWarning, Settings2 } from "lucide-react";
import { T, Tag, AdminPage, PageHeader } from "../ui";
import { useToast } from "../toast";

export type AvisRow = { id: string; name: string; email: string; requestedAt: string };

export default function AvisClient({
  toSolicit,
  done,
  reviewLinkSet,
}: {
  toSolicit: AvisRow[];
  done: AvisRow[];
  reviewLinkSet: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  async function ask(r: AvisRow) {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/avis/${r.id}`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(j.sent ? "Invitation envoyée par email." : "Invitation enregistrée (email non configuré).");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'envoi a échoué.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminPage>
      <PageHeader
        title="Avis clients"
        subtitle="Invitez vos acheteurs à vous noter sur Google, après la livraison."
      />

      {!reviewLinkSet && (
        <Link
          href="/admin/marque"
          className="flex items-center gap-3 px-5 py-3 mb-6"
          style={{ backgroundColor: T.surface, border: "1px solid rgba(240,180,90,0.4)" }}
        >
          <Settings2 size={16} style={{ color: T.warning }} />
          <span className="text-sm" style={{ color: T.textDim }}>
            <span className="font-semibold" style={{ color: T.warning }}>Lien Google non configuré.</span>
            {" Renseignez-le dans Réglages → Marque blanche pour activer les invitations."}
          </span>
          <span className="ml-auto text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>Configurer →</span>
        </Link>
      )}

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
              <Link href={`/admin/clients/${r.id}`} className="text-sm font-medium truncate min-w-0 flex-1 transition-colors hover:text-[#F0F5FF]" style={{ color: T.text }}>
                {r.name}
              </Link>
              <span className="text-xs truncate hidden sm:inline" style={{ color: T.muted, minWidth: 180 }}>{r.email || "—"}</span>
              {r.email ? (
                <button
                  type="button"
                  onClick={() => ask(r)}
                  disabled={busy === r.id || !reviewLinkSet}
                  className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2 transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: T.accent, color: T.bg }}
                >
                  <Send size={13} />
                  Demander un avis
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase" style={{ color: T.muted }}>
                  <MailWarning size={13} />
                  Pas d&apos;email
                </span>
              )}
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
                <Link href={`/admin/clients/${r.id}`} className="text-sm truncate min-w-0 flex-1 transition-colors hover:text-[#F0F5FF]" style={{ color: T.textDim }}>
                  {r.name}
                </Link>
                <Tag tone="success">Invité le {r.requestedAt}</Tag>
              </div>
            ))}
          </div>
        </>
      )}

      {toSolicit.length === 0 && done.length === 0 && (
        <p className="text-[12px] mt-4" style={{ color: T.muted }}>
          Les clients apparaissent ici dès qu&apos;un lead est gagné ou qu&apos;une facture est payée.
        </p>
      )}
    </AdminPage>
  );
}
