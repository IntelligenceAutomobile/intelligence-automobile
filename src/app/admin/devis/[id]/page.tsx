import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { mergeBranding, mergeVehicleBlock, computeTotals, creditsByInvoice, formatDateFr, formatEuro, FACTURE_KIND_LABEL, type QuoteData, type QuoteItem, type TvaMode, type DepositMode, type QuoteStatus, type QuoteKind, type DocType, type FactureKind, type PaymentStatus, type DocLang } from "@/lib/devis";
import { daysSince } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import { loadStockForQuotes } from "@/lib/devis-stock";
import { T, AdminPage, PageHeader } from "../../ui";
import DevisEditor from "../DevisEditor";
import ConvertActions from "../ConvertActions";
import EnvoiButton from "../EnvoiButton";
import AvoirButton from "../AvoirButton";

export default async function EditDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const row = await prisma.quote.findUnique({ where: { id } });
  if (!row) notFound();

  // Stock + coût de revient + identité administrative du véhicule.
  const vehicles = await loadStockForQuotes();

  // Document d'origine : le devis d'une facture, la facture d'un avoir. Le lien
  // de retour manquait dans les deux sens, et l'avoir doit citer sa facture.
  const sourceQuote = row.sourceQuoteId
    ? await prisma.quote.findUnique({ where: { id: row.sourceQuoteId }, select: { id: true, number: true } })
    : null;
  const sourceNumber = row.docType === "avoir" ? sourceQuote?.number ?? "" : "";

  let items: QuoteItem[] = [];
  try {
    const p = JSON.parse(row.items);
    if (Array.isArray(p)) items = p;
  } catch {
    /* ignore */
  }
  let brandingRaw: unknown = {};
  try {
    brandingRaw = JSON.parse(row.branding ?? "{}");
  } catch {
    /* ignore */
  }
  let vehicleRaw: unknown = {};
  try {
    vehicleRaw = JSON.parse(row.vehicleInfo ?? "{}");
  } catch {
    /* ignore */
  }

  const initial: QuoteData = {
    id: row.id,
    number: row.number,
    kind: row.kind as QuoteKind,
    status: row.status as QuoteStatus,
    docType: row.docType as DocType,
    factureKind: row.factureKind as FactureKind,
    paymentStatus: row.paymentStatus as PaymentStatus,
    paidDate: row.paidDate,
    sourceQuoteId: row.sourceQuoteId,
    sourceNumber: sourceNumber,
    // Le lien vers la fiche CRM se perdait ici : absent de l'objet transmis à
    // l'éditeur, il repartait vide au premier enregistrement.
    clientId: row.clientId,
    clientName: row.clientName,
    clientCompany: row.clientCompany,
    clientAddress: row.clientAddress,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    clientCountry: row.clientCountry,
    clientVatNumber: row.clientVatNumber,
    docLang: row.docLang as DocLang,
    issueDate: row.issueDate,
    validityDays: row.validityDays,
    items,
    tvaMode: row.tvaMode as TvaMode,
    tvaRate: row.tvaRate,
    depositMode: row.depositMode as DepositMode,
    depositValue: row.depositValue,
    paymentTerms: row.paymentTerms,
    notes: row.notes,
    vehicleId: row.vehicleId,
    vehicle: mergeVehicleBlock(vehicleRaw),
    branding: mergeBranding(brandingRaw),
  };

  const role = asRole(session.admin.role);

  const isAvoir = row.docType === "avoir";
  const isFacture = row.docType === "facture";
  // Un avoir se range avec les factures : c'est la même pièce comptable.
  const backHref = isFacture || isAvoir ? "/admin/factures" : "/admin/devis";
  const docLabel = isAvoir ? "Avoir" : isFacture ? (FACTURE_KIND_LABEL[row.factureKind as FactureKind] ?? "Facture") : "Devis";

  const totals = computeTotals({
    items,
    tvaMode: row.tvaMode as TvaMode,
    tvaRate: row.tvaRate,
    depositMode: row.depositMode as DepositMode,
    depositValue: row.depositValue,
  });

  // Avoirs déjà émis sur cette facture : ils bornent ce qu'il reste à créditer,
  // et disent à l'écran qu'une facture a été annulée.
  const avoirs = isFacture
    ? await prisma.quote.findMany({
        where: { docType: "avoir", sourceQuoteId: row.id },
        select: { id: true, number: true, issueDate: true, sourceQuoteId: true, items: true, tvaMode: true, tvaRate: true, depositMode: true, depositValue: true },
      })
    : [];
  const factureDue = row.factureKind === "solde" ? totals.balance : totals.totalTTC;
  const dejaCredite = creditsByInvoice(avoirs).get(row.id) ?? 0;

  // Trace des relances : le client qui rappelle « je viens de recevoir votre
  // mail » trouvait une fiche muette sur le sujet. Un report reste en base après
  // son échéance : la pause s'affiche seulement tant qu'elle court encore.
  const todayParis = parisDay(new Date()).toISOString().slice(0, 10);
  const snoozeActive = Boolean(row.relanceSnoozeUntil) && daysSince(row.relanceSnoozeUntil, todayParis) < 0;
  const relanceInfo =
    row.relanceSnoozeUntil === "9999-12-31"
      ? "Relances arrêtées"
      : snoozeActive
        ? `Relances en pause jusqu'au ${formatDateFr(row.relanceSnoozeUntil)}`
        : row.relanceCount > 0
          ? `Relancé ×${row.relanceCount}${row.lastRelanceDate ? ` le ${formatDateFr(row.lastRelanceDate)}` : ""}`
          : "";

  return (
    <AdminPage>
      <Link href={backHref} className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }}>
        ← {isFacture || isAvoir ? "Factures" : "Devis"}
      </Link>
      <PageHeader
        title={`${docLabel} ${row.number}`}
        subtitle={[row.clientCompany || row.clientName || "Sans client", relanceInfo].filter(Boolean).join(" · ")}
        action={
          isAvoir ? undefined : isFacture ? (
            <AvoirButton quoteId={row.id} number={row.number} montant={factureDue} dejaCredite={dejaCredite} />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <EnvoiButton
                quoteId={row.id}
                number={row.number}
                clientEmail={row.clientEmail}
                clientName={row.clientName || row.clientCompany}
                sentAt={row.sentAt}
                viewCount={row.viewCount}
                publicToken={row.publicToken}
              />
              <ConvertActions quoteId={row.id} hasDeposit={totals.deposit > 0} />
            </div>
          )
        }
      />
      {row.signedAt && (
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3 mb-5"
          style={{ backgroundColor: "rgba(78,209,161,0.10)", border: "1px solid rgba(78,209,161,0.40)" }}
        >
          <span className="text-sm" style={{ color: T.textDim }}>
            Accepté en ligne par {row.signerName} le {new Date(row.signedAt).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.
          </span>
        </div>
      )}

      {/* Avoirs émis sur cette facture : l'information manque à qui ouvre la
          facture et cherche pourquoi elle n'est plus réclamée. */}
      {avoirs.length > 0 && (
        <div className="px-4 py-3 mb-5" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
          <span className="text-sm" style={{ color: T.textDim }}>
            {dejaCredite >= factureDue ? "Facture annulée par avoir" : `Facture créditée de ${formatEuro(dejaCredite)}, reste ${formatEuro(Math.max(0, factureDue - dejaCredite))}`}
            {" · "}
            {avoirs.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ", "}
                <Link href={`/admin/devis/${a.id}`} style={{ color: T.accent }}>{a.number}</Link>
                <span style={{ color: T.muted }}> du {formatDateFr(a.issueDate)}</span>
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Un avoir renvoie à la facture qu'il corrige. */}
      {isAvoir && sourceQuote && (
        <div className="px-4 py-3 mb-5" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
          <span className="text-sm" style={{ color: T.textDim }}>
            Avoir sur la facture{" "}
            <Link href={`/admin/devis/${sourceQuote.id}`} style={{ color: T.accent }}>{sourceQuote.number}</Link>.
          </span>
        </div>
      )}

      <DevisEditor
        initial={initial}
        vehicles={vehicles}
        isEdit
        sourceQuote={sourceQuote}
        canFinance={can(role, "finances")}
        canUnlock={role === "patron"}
        canBranding={can(role, "settings")}
        sentAt={row.sentAt}
        publicToken={row.publicToken}
      />
    </AdminPage>
  );
}
