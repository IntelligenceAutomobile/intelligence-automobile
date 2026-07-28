import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { mergeBranding, computeTotals, formatDateFr, FACTURE_KIND_LABEL, type QuoteData, type QuoteItem, type TvaMode, type DepositMode, type QuoteStatus, type QuoteKind, type DocType, type FactureKind, type PaymentStatus } from "@/lib/devis";
import { daysSince } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import { T, AdminPage, PageHeader } from "../../ui";
import DevisEditor from "../DevisEditor";
import ConvertActions from "../ConvertActions";
import EnvoiButton from "../EnvoiButton";

export default async function EditDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const row = await prisma.quote.findUnique({ where: { id } });
  if (!row) notFound();

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, make: true, model: true, year: true, mileage: true, price: true, fuel: true, transmission: true, power: true, status: true },
  });

  // Coût de revient par véhicule (achat + frais), pour la marge affichée au
  // vendeur pendant la négociation. Jamais imprimée sur le document.
  const costs = await prisma.vehicleCost.groupBy({ by: ["vehicleId"], _sum: { amountCents: true } });
  const costByVehicle = new Map(costs.map((c) => [c.vehicleId, c._sum.amountCents ?? 0]));
  const vehiclesWithCost = vehicles.map((v) => ({ ...v, costCents: costByVehicle.get(v.id) ?? 0 }));

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
    // Le lien vers la fiche CRM se perdait ici : absent de l'objet transmis à
    // l'éditeur, il repartait vide au premier enregistrement.
    clientId: row.clientId,
    clientName: row.clientName,
    clientCompany: row.clientCompany,
    clientAddress: row.clientAddress,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
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
    branding: mergeBranding(brandingRaw),
  };

  const role = asRole(session.admin.role);

  // Devis d'origine d'une facture : le lien de retour manquait dans les deux sens.
  const sourceQuote = row.sourceQuoteId
    ? await prisma.quote.findUnique({ where: { id: row.sourceQuoteId }, select: { id: true, number: true } })
    : null;

  const isFacture = row.docType === "facture";
  const backHref = isFacture ? "/admin/factures" : "/admin/devis";
  const docLabel = isFacture ? (FACTURE_KIND_LABEL[row.factureKind as FactureKind] ?? "Facture") : "Devis";

  const totals = computeTotals({
    items,
    tvaMode: row.tvaMode as TvaMode,
    tvaRate: row.tvaRate,
    depositMode: row.depositMode as DepositMode,
    depositValue: row.depositValue,
  });

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
        ← {isFacture ? "Factures" : "Devis"}
      </Link>
      <PageHeader
        title={`${docLabel} ${row.number}`}
        subtitle={[row.clientCompany || row.clientName || "Sans client", relanceInfo].filter(Boolean).join(" · ")}
        action={
          isFacture ? undefined : (
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

      <DevisEditor
        initial={initial}
        vehicles={vehiclesWithCost}
        isEdit
        sourceQuote={sourceQuote}
        canFinance={can(role, "finances")}
        canUnlock={role === "patron"}
      />
    </AdminPage>
  );
}
