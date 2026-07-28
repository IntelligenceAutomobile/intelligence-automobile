// Page publique d'un devis : le client l'ouvre depuis son email, sans compte.
// C'est la seule page qui rend le document hors du back-office ; jusqu'ici,
// envoyer le lien menait le client à l'écran de connexion.
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  mergeBranding,
  formatEuro,
  computeTotals,
  validUntilFr,
  type QuoteData,
  type QuoteItem,
  type TvaMode,
  type DepositMode,
  type QuoteStatus,
  type QuoteKind,
  type DocType,
  type FactureKind,
  type PaymentStatus,
} from "@/lib/devis";
import { daysSince } from "@/lib/relances";
import { parisDay } from "@/lib/vehicules";
import DevisDocument from "@/app/admin/devis/DevisDocument";
import AccepterForm from "./AccepterForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await prisma.quote.findUnique({ where: { publicToken: token }, select: { number: true } });
  return {
    title: row ? `Devis ${row.number}` : "Devis",
    // Un devis nominatif reste hors des moteurs de recherche.
    robots: { index: false, follow: false },
  };
}

export default async function DevisPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await prisma.quote.findUnique({ where: { publicToken: token } });
  if (!row || row.docType === "facture") notFound();

  // Suivi de lecture : la première ouverture donne au vendeur l'information la
  // plus utile de son suivi commercial, sans rien coûter.
  await prisma.quote.update({
    where: { id: row.id },
    data: {
      viewCount: { increment: 1 },
      ...(row.firstViewedAt ? {} : { firstViewedAt: new Date().toISOString() }),
    },
  });

  let items: QuoteItem[] = [];
  try {
    const p = JSON.parse(row.items);
    if (Array.isArray(p)) items = p;
  } catch {
    /* le document reste lisible */
  }
  let brandingRaw: unknown = {};
  try {
    brandingRaw = JSON.parse(row.branding ?? "{}");
  } catch {
    /* repli sur les valeurs par défaut */
  }

  const quote: QuoteData = {
    id: row.id,
    number: row.number,
    kind: row.kind as QuoteKind,
    status: row.status as QuoteStatus,
    docType: row.docType as DocType,
    factureKind: row.factureKind as FactureKind,
    paymentStatus: row.paymentStatus as PaymentStatus,
    paidDate: row.paidDate,
    sourceQuoteId: row.sourceQuoteId,
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

  const totals = computeTotals(quote);
  const todayIso = parisDay(new Date()).toISOString().slice(0, 10);
  const expired = row.validityDays > 0 && daysSince(row.issueDate, todayIso) > row.validityDays;
  const accepted = row.status === "accepte";
  const refused = row.status === "refuse";
  const accent = quote.branding.accentColor || "#1E4FA3";

  return (
    <main style={{ backgroundColor: "#EEF1F6", minHeight: "100vh", padding: "24px 16px 64px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            boxShadow: "0 18px 50px rgba(16,32,60,0.16)",
            overflowX: "auto",
          }}
        >
          <div style={{ width: "210mm", margin: "0 auto", transformOrigin: "top left" }}>
            <DevisDocument quote={quote} />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <AccepterForm
            token={token}
            number={row.number}
            amount={formatEuro(totals.totalTTC)}
            deposit={totals.deposit > 0 ? formatEuro(totals.deposit) : ""}
            validUntil={validUntilFr(row.issueDate, row.validityDays)}
            accent={accent}
            emitter={quote.branding.emitterName}
            emitterEmail={quote.branding.emitterEmail}
            emitterPhone={quote.branding.emitterPhone}
            accepted={accepted}
            refused={refused}
            expired={expired}
            signerName={row.signerName}
            signedAt={row.signedAt}
          />
        </div>
      </div>
    </main>
  );
}
