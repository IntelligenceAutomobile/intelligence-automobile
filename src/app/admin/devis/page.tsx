import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import {
  computeTotals,
  STATUS_LABEL,
  type QuoteItem,
  type TvaMode,
  type DepositMode,
  type QuoteStatus,
} from "@/lib/devis";
import { relanceDue, daysSince } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import { AdminPage, PageHeader, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import DevisList, { type DevisRow } from "./DevisList";

const VALID_FILTERS = ["brouillon", "envoye", "accepte", "refuse", "expire", "a-relancer"];
const VALID_SORTS = [
  "recent", "numero-asc", "numero-desc", "client-asc", "client-desc",
  "date-desc", "date-asc", "montant-desc", "montant-asc", "statut-asc", "statut-desc",
  "validite-asc", "validite-desc",
];

export default async function DevisListPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; tri?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  const canDelete = can(asRole(session.admin.role), "delete");

  const { statut, q, tri } = await searchParams;
  const initialFilter = statut && VALID_FILTERS.includes(statut) ? statut : "all";
  const initialSort = tri && VALID_SORTS.includes(tri) ? tri : "recent";

  const [rows, factures] = await Promise.all([
    prisma.quote.findMany({
      where: { docType: { not: "facture" } },
      orderBy: { updatedAt: "desc" },
      // Sélection restreinte : la personnalisation de l'en-tête pèse plusieurs
      // kilo-octets par devis et ne sert à rien dans une liste.
      select: {
        id: true, number: true, status: true, items: true, issueDate: true, validityDays: true,
        clientName: true, clientCompany: true, clientEmail: true, vehicleId: true, updatedAt: true,
        tvaMode: true, tvaRate: true, depositMode: true, depositValue: true,
        docType: true, paymentStatus: true, relanceCount: true, lastRelanceDate: true, relanceSnoozeUntil: true,
        sentAt: true, firstViewedAt: true, viewCount: true, signerName: true, signedAt: true,
      },
    }),
    prisma.quote.findMany({
      where: { docType: "facture", sourceQuoteId: { not: null } },
      select: { number: true, sourceQuoteId: true },
    }),
  ]);

  const vehicleIds = [...new Set(rows.map((r) => r.vehicleId).filter((v): v is string => !!v))];
  const vehicles = vehicleIds.length
    ? await prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, make: true, model: true } })
    : [];
  const vehicleById = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model}`]));

  const factureByQuote = new Map<string, string>();
  for (const f of factures) {
    if (f.sourceQuoteId && !factureByQuote.has(f.sourceQuoteId)) factureByQuote.set(f.sourceQuoteId, f.number);
  }

  const todayIso = parisDay(new Date()).toISOString().slice(0, 10);

  const devis: DevisRow[] = rows.map((r) => {
    let items: QuoteItem[] = [];
    try {
      const p = JSON.parse(r.items);
      if (Array.isArray(p)) items = p;
    } catch {
      /* une ligne abîmée laisse le devis lisible, avec un total à zéro */
    }
    const totals = computeTotals({
      items,
      tvaMode: r.tvaMode as TvaMode,
      tvaRate: r.tvaRate,
      depositMode: r.depositMode as DepositMode,
      depositValue: r.depositValue,
    });

    const ageDays = daysSince(r.issueDate, todayIso);
    // Jours restants avant échéance : la date de fin de validité était calculée
    // uniquement pour le papier, jamais pour la liste.
    const daysLeft = r.validityDays > 0 ? r.validityDays - ageDays : null;
    const relance = relanceDue(
      {
        docType: r.docType,
        status: r.status,
        paymentStatus: r.paymentStatus,
        issueDate: r.issueDate,
        sentAt: r.sentAt,
        lastRelanceDate: r.lastRelanceDate,
        relanceSnoozeUntil: r.relanceSnoozeUntil,
      },
      todayIso,
    );

    return {
      id: r.id,
      number: r.number,
      client: r.clientCompany || r.clientName || "",
      vehicle: r.vehicleId ? vehicleById.get(r.vehicleId) ?? "" : "",
      issueDate: r.issueDate,
      status: r.status,
      statusLabel: STATUS_LABEL[r.status as QuoteStatus] ?? r.status,
      total: totals.totalTTC,
      deposit: totals.deposit,
      lineCount: totals.lineCount,
      ageDays,
      daysLeft,
      expired: r.status === "envoye" && daysLeft !== null && daysLeft < 0,
      factureNumber: factureByQuote.get(r.id) ?? null,
      relanceDue: relance !== null,
      relanceCount: r.relanceCount,
      sentAt: r.sentAt,
      viewedDays: r.firstViewedAt ? daysSince(r.firstViewedAt.slice(0, 10), todayIso) : null,
      viewCount: r.viewCount,
      signerName: r.signerName,
      hasEmail: !!r.clientEmail,
      updatedAt: r.updatedAt.toISOString(),
    };
  });

  return (
    <AdminPage>
      <PageHeader
        title="Devis"
        subtitle={`${devis.length} devis au total.`}
        action={
          <Link href="/admin/devis/nouveau" className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouveau devis
          </Link>
        }
      />
      <DevisList
        devis={devis}
        canDelete={canDelete}
        initialFilter={initialFilter}
        initialQuery={q ?? ""}
        initialSort={initialSort}
      />
    </AdminPage>
  );
}
