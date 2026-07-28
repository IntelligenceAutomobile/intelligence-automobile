// Centre de relances de la démonstration /demopro (lecture seule).
// Reproduit le back-office refondu : grille alignée, gradation d'urgence,
// montant visible sur téléphone, sous-texte informatif. Les boutons
// « Relancer » / « Reporter » affichent un simple toast de démonstration.
// Aucun accès base, aucune action réelle.
import Link from "next/link";
import { Send, Clock, FileText, ReceiptText, CheckCircle2, MailPlus, ChevronDown } from "lucide-react";
import {
  computeTotals,
  formatEuro,
  formatDateFr,
  type QuoteItem,
  type TvaMode,
  type DepositMode,
} from "@/lib/devis";
import { relanceDue, daysSince, DEVIS_RELANCE_DAYS, FACTURE_RELANCE_DAYS } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import { T, Tag, AdminPage, PageHeader } from "@/app/admin/ui";
import { getDemoQuotes, type DemoQuoteItem } from "@/lib/demo-data";
import { DEMO_BASE } from "../demo";
import DemoActionButton from "../DemoActionButton";

const VALIDITY_DAYS = 30;

type RelanceItem = {
  id: string;
  number: string;
  client: string;
  clientEmail: string;
  amount: number;
  kind: "devis" | "facture";
  sinceDays: number;
  startDate: string;
  expired: boolean;
  href: string;
};

// Les lignes de devis d'exemple deviennent des QuoteItem complets pour computeTotals.
function toQuoteItems(items: DemoQuoteItem[]): QuoteItem[] {
  return items.map((it) => ({ id: it.id, designation: it.designation, detail: it.detail ?? "", qty: it.qty, unitPrice: it.unitPrice }));
}

const ghostBorder = "rgba(159,179,212,0.45)";

function Row({ it, first }: { it: RelanceItem; first: boolean }) {
  const isFacture = it.kind === "facture";
  const tone = isFacture
    ? it.sinceDays >= FACTURE_RELANCE_DAYS ? "danger" : "warning"
    : it.sinceDays >= DEVIS_RELANCE_DAYS * 2 ? "danger" : "warning";
  const ageText = isFacture ? `retard ${it.sinceDays} j` : `${it.sinceDays} j`;
  const ageTitle = isFacture
    ? `Échéance dépassée depuis ${it.sinceDays} jour${it.sinceDays > 1 ? "s" : ""}`
    : `Sans réponse depuis ${it.sinceDays} jour${it.sinceDays > 1 ? "s" : ""}`;

  const montant = (
    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
      {formatEuro(it.amount)}
    </span>
  );

  const ghostBtnClass =
    "inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3.5 py-2.5 border transition-colors hover:border-[#6B9FEE]";

  return (
    <div
      className="group relative grid items-center px-4 py-3 gap-x-3 gap-y-2
                 grid-cols-[1fr_auto]
                 @[800px]:grid-cols-[96px_minmax(120px,1fr)_110px_118px_auto]"
      style={{ borderTop: first ? "none" : `1px solid ${T.border}` }}
    >
      {/* Lien de couverture : toute la ligne ouvre la fiche, sauf les actions */}
      <Link href={it.href} className="absolute inset-0" aria-label={`Ouvrir ${isFacture ? "la facture" : "le devis"} ${it.number}`} style={{ zIndex: 0 }} />

      <span className="text-xs tracking-widest uppercase whitespace-nowrap" style={{ color: T.accent }}>
        {it.number}
      </span>

      {/* Ancienneté, calée à droite sur téléphone */}
      <span className="@[800px]:hidden justify-self-end" title={ageTitle}>
        <Tag tone={tone}>{ageText}</Tag>
      </span>

      <div className="min-w-0 col-span-2 @[800px]:col-span-1">
        <div className="text-sm truncate" style={{ color: it.client ? T.text : T.muted }}>
          {it.client || "Sans client"}
        </div>
        <div className="text-[11px] flex items-center gap-2 min-w-0" style={{ color: T.muted }}>
          <span className="whitespace-nowrap">{isFacture ? "Émise" : "Envoyé"} le {formatDateFr(it.startDate)}</span>
          {it.clientEmail ? (
            <span className="truncate">{it.clientEmail}</span>
          ) : (
            <Link href={it.href} className="relative z-10 inline-flex items-center gap-1 whitespace-nowrap" style={{ color: T.warning }}>
              <MailPlus size={11} />
              Ajouter un email
            </Link>
          )}
          {it.expired && <span className="whitespace-nowrap" style={{ color: T.danger }}>Validité dépassée</span>}
        </div>
      </div>

      <span className="hidden @[800px]:block text-right">{montant}</span>

      <span className="hidden @[800px]:block" title={ageTitle}>
        <Tag tone={tone}>{ageText}</Tag>
      </span>

      {/* Barre d'actions : à part sur téléphone (montant inclus), en fin de ligne ensuite */}
      <div
        className="flex flex-wrap @[800px]:flex-nowrap items-center gap-x-3 gap-y-2 col-span-2 @[800px]:col-span-1 justify-between @[800px]:justify-end
                   border-t @[800px]:border-t-0 pt-2 @[800px]:pt-0"
        style={{ borderColor: T.border }}
      >
        <span className="@[800px]:hidden">{montant}</span>
        <div className="relative z-10 flex items-center gap-2">
          {it.clientEmail && (
            <DemoActionButton
              className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3.5 py-2.5 transition-opacity hover:opacity-90"
              style={{ backgroundColor: T.accent, color: T.bg }}
            >
              <Send size={13} />
              Relancer
            </DemoActionButton>
          )}
          <DemoActionButton className={ghostBtnClass} style={{ borderColor: ghostBorder, color: T.textDim }}>
            <Clock size={13} />
            Reporter
            <ChevronDown size={12} />
          </DemoActionButton>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  icon: Icon,
  items,
}: {
  title: string;
  hint: string;
  icon: typeof FileText;
  items: RelanceItem[];
}) {
  const sum = items.reduce((s, it) => s + it.amount, 0);
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color: T.accent }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>{title}</h2>
        <span className="text-xs" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
          · {items.length}
          {items.length > 0 && ` · ${formatEuro(sum)}`}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-sm inline-flex items-center gap-2" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <CheckCircle2 size={15} style={{ color: T.success }} />
          {hint}
        </div>
      ) : (
        <div className="@container" style={{ border: `1px solid ${T.border}` }}>
          {items.map((it, i) => (
            <Row key={it.id} it={it} first={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DemoRelancesPage() {
  const today = parisDay(new Date()).toISOString().slice(0, 10);

  const devis: RelanceItem[] = [];
  const factures: RelanceItem[] = [];

  for (const q of getDemoQuotes()) {
    const due = relanceDue(
      {
        docType: q.docType,
        status: q.status,
        paymentStatus: q.paymentStatus ?? "",
        issueDate: q.issueDate,
        // Même règle que le vrai back-office : l'échéance d'une facture court
        // sur le délai de règlement, la fiche démo affiche la même date.
        validityDays: VALIDITY_DAYS,
        lastRelanceDate: "",
        relanceSnoozeUntil: "",
      },
      today,
    );
    if (!due) continue;

    const totals = computeTotals({
      items: toQuoteItems(q.items),
      tvaMode: q.tvaMode as TvaMode,
      tvaRate: q.tvaRate,
      depositMode: q.depositMode as DepositMode,
      depositValue: q.depositValue,
    });
    const amount = due.kind === "facture" && q.factureKind === "solde" ? totals.balance : totals.totalTTC;

    const item: RelanceItem = {
      id: q.id,
      number: q.number,
      client: q.clientCompany || q.clientName || "",
      clientEmail: q.clientEmail,
      amount,
      kind: due.kind,
      sinceDays: due.sinceDays,
      startDate: q.issueDate,
      expired: due.kind === "devis" && daysSince(q.issueDate, today) > VALIDITY_DAYS,
      href: due.kind === "facture" ? `${DEMO_BASE}/factures` : `${DEMO_BASE}/devis/${q.id}`,
    };
    if (due.kind === "facture") factures.push(item);
    else devis.push(item);
  }

  devis.sort((a, b) => b.sinceDays - a.sinceDays);
  factures.sort((a, b) => b.sinceDays - a.sinceDays);

  const total = devis.length + factures.length;
  const totalSum = [...devis, ...factures].reduce((s, it) => s + it.amount, 0);

  return (
    <AdminPage>
      <PageHeader
        title="Relances"
        subtitle={
          total === 0
            ? "Tout est à jour."
            : `${total} relance${total > 1 ? "s" : ""} à faire · ${formatEuro(totalSum)} en attente.`
        }
      />

      {total === 0 ? (
        <div className="p-10 text-center text-sm inline-flex items-center gap-2 w-full justify-center" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <CheckCircle2 size={16} style={{ color: T.success }} />
          Tout est à jour. Le centre se remplit tout seul dès qu&apos;un devis attend une réponse ou qu&apos;une facture dépasse son échéance.
        </div>
      ) : (
        <>
          <Section title="Devis en attente de réponse" hint="Tous vos devis ont reçu une réponse ou une relance récente." icon={FileText} items={devis} />
          <Section title="Factures impayées" hint="Toutes vos factures sont réglées ou relancées récemment." icon={ReceiptText} items={factures} />
        </>
      )}
    </AdminPage>
  );
}
