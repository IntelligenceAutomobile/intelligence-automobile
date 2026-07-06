"use client";

// Centre de relances : le système liste ce qui doit être relancé (devis sans
// réponse, factures impayées) ; l'utilisateur envoie d'un clic ou reporte.
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Clock, FileText, ReceiptText, CheckCircle2, MailWarning } from "lucide-react";
import { formatEuro } from "@/lib/devis";
import { T, Tag, AdminPage, PageHeader } from "../ui";
import { useToast } from "../toast";

export type RelanceItem = {
  id: string;
  number: string;
  client: string;
  hasEmail: boolean;
  amount: number;
  sinceDays: number;
  relanceCount: number;
};

function Section({
  title,
  hint,
  icon: Icon,
  items,
  onRelance,
  onSnooze,
  busy,
}: {
  title: string;
  hint: string;
  icon: typeof FileText;
  items: RelanceItem[];
  onRelance: (id: string) => void;
  onSnooze: (id: string) => void;
  busy: string | null;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>{title}</h2>
        <span className="text-xs" style={{ color: T.muted }}>· {items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-sm inline-flex items-center gap-2" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
          <CheckCircle2 size={15} style={{ color: T.success }} />
          {hint}
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {items.map((it, i) => (
            <div key={it.id} className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
              <Link href={`/admin/devis/${it.id}`} className="flex items-center gap-3 min-w-0 flex-1 transition-colors hover:text-[#F0F5FF]">
                <span className="text-xs tracking-widest uppercase flex-shrink-0" style={{ color: T.accent, width: 108 }}>{it.number}</span>
                <span className="text-sm truncate min-w-0" style={{ color: T.text }}>{it.client || <span style={{ color: T.muted }}>Sans client</span>}</span>
              </Link>
              <span className="text-sm font-semibold hidden sm:inline flex-shrink-0" style={{ color: T.text }}>{formatEuro(it.amount)}</span>
              <Tag tone="warning">{it.sinceDays} j</Tag>
              {it.relanceCount > 0 && <Tag tone="muted">{it.relanceCount}ᵉ relance</Tag>}
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {it.hasEmail ? (
                  <button
                    type="button"
                    onClick={() => onRelance(it.id)}
                    disabled={busy === it.id}
                    className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: T.accent, color: T.bg }}
                  >
                    <Send size={13} />
                    Relancer
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase" style={{ color: T.muted }} title="Pas d'email client">
                    <MailWarning size={13} />
                    Pas d&apos;email
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onSnooze(it.id)}
                  disabled={busy === it.id}
                  title="Reporter d'une semaine"
                  className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2 border transition-colors hover:border-[#6B9FEE] disabled:opacity-50"
                  style={{ borderColor: T.border, color: T.textDim }}
                >
                  <Clock size={13} />
                  Reporter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RelancesClient({ devis, factures }: { devis: RelanceItem[]; factures: RelanceItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "relance" | "snooze") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/relances/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      if (action === "snooze") toast.info("Reporté d'une semaine.");
      else toast.success(j.sent ? "Relance envoyée par email." : "Relance enregistrée (email non configuré).");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'action a échoué.");
    } finally {
      setBusy(null);
    }
  }

  const total = devis.length + factures.length;

  return (
    <AdminPage>
      <PageHeader
        title="Relances"
        subtitle={total === 0 ? "Tout est à jour." : `${total} relance${total > 1 ? "s" : ""} à faire · devis sans réponse et factures impayées.`}
      />

      {total === 0 ? (
        <div className="p-10 text-center text-sm inline-flex items-center gap-2 w-full justify-center" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <CheckCircle2 size={16} style={{ color: T.success }} />
          Rien à relancer pour le moment. Le centre se remplit tout seul dès qu&apos;un devis reste sans réponse ou qu&apos;une facture dépasse son échéance.
        </div>
      ) : (
        <>
          <Section
            title="Devis sans réponse"
            hint="Aucun devis en attente."
            icon={FileText}
            items={devis}
            onRelance={(id) => act(id, "relance")}
            onSnooze={(id) => act(id, "snooze")}
            busy={busy}
          />
          <Section
            title="Factures impayées"
            hint="Aucune facture en retard."
            icon={ReceiptText}
            items={factures}
            onRelance={(id) => act(id, "relance")}
            onSnooze={(id) => act(id, "snooze")}
            busy={busy}
          />
        </>
      )}
    </AdminPage>
  );
}
