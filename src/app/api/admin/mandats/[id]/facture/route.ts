import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMandats } from "@/lib/mandats-acces";
import { formatEuroCents } from "@/lib/comptes";
import {
  emptyQuote, brandingFromTheme, mergeBranding, nextNumber, quotePrefix, formatDateFr, type QuoteItem,
} from "@/lib/devis";
import { quoteToData } from "@/lib/quote-serialize";
import { convertQuoteToFacture } from "@/lib/devis-facture";
import {
  MANDAT_TYPE_LABEL, isMandatType, commissionEstimee, mandatVehiculeLabel,
} from "@/lib/mandats";

/**
 * Crée la facture d'honoraires d'un mandat conclu, en un clic : la ligne de
 * prestation au montant du contrat, le client du mandat, la TVA à 20 %. Elle
 * passe par le même devis puis par la conversion commune que le reste de
 * l'outil : mêmes contrôles, même numérotation FAC-.
 *
 * La formule A de la vente reste à part : le pack de livraison se facture à
 * l'ACQUÉREUR, dont l'identité vit hors du mandat ; le module Devis s'en charge.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const acces = await requireMandats();
  if (!acces.ok) return acces.refus;

  const { id } = await params;
  try {
    const row = await prisma.mandat.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Mandat introuvable." }, { status: 404 });

    const type = isMandatType(row.type) ? row.type : "vente";
    if (row.status !== "vendu") {
      return NextResponse.json({ error: "La facture d'honoraires attend une mission conclue." }, { status: 409 });
    }
    if (type === "vente" && row.feeFormula === "acquereur") {
      return NextResponse.json(
        { error: "Formule A : le pack de livraison se facture à l'acquéreur, depuis le module Devis." },
        { status: 400 },
      );
    }
    if (row.feeInvoiceId) {
      const existante = await prisma.quote.findUnique({ where: { id: row.feeInvoiceId }, select: { id: true, number: true } });
      if (existante) return NextResponse.json({ factureId: existante.id, number: existante.number, deja: true });
    }

    // Le montant : les honoraires réellement facturés s'ils sont posés, sinon
    // le contrat (commission de 5 % bornée pour la vente, forfait convenu pour
    // la recherche et l'import).
    const montantCents =
      row.feeFinalCents > 0
        ? row.feeFinalCents
        : type === "vente"
          ? commissionEstimee(row.soldPriceCents > 0 ? row.soldPriceCents : row.priceCents)
          : row.feeCents;
    if (montantCents <= 0) {
      return NextResponse.json(
        { error: "Renseignez les honoraires facturés (ou le prix conclu) avant de créer la facture." },
        { status: 400 },
      );
    }

    // Numéro, identité de marque et mise en page : les mêmes règles que la
    // page « Nouveau devis ».
    const year = new Date().getFullYear();
    const [taken, last, brandTheme] = await Promise.all([
      prisma.quote.findMany({ where: { number: { startsWith: quotePrefix(year) } }, select: { number: true } }),
      prisma.quote.findFirst({ orderBy: { updatedAt: "desc" }, select: { branding: true } }),
      prisma.brandTheme.findUnique({ where: { id: "default" } }),
    ]);
    let lastBranding: unknown = {};
    try {
      lastBranding = JSON.parse(last?.branding ?? "{}");
    } catch {
      /* repli sur les valeurs par défaut */
    }

    const number = nextNumber(quotePrefix(year), taken.map((q) => q.number));
    const issueDate = row.soldOn || row.decidedOn || new Date().toISOString().slice(0, 10);
    const quote = emptyQuote(number, issueDate, brandingFromTheme(brandTheme, mergeBranding(lastBranding)), "prestation");

    quote.clientId = row.clientId;
    quote.leadId = row.leadId;
    quote.clientName = row.ownerName;
    quote.clientAddress = row.ownerAddress;
    quote.clientEmail = row.ownerEmail;
    quote.clientPhone = row.ownerPhone;
    quote.tvaMode = "tva20";
    quote.depositMode = "none";

    // Prix unitaire HT : le contrat parle TTC, la ligne en mode « tva20 »
    // s'écrit hors taxes. L'arrondi au centime retombe sur le TTC du contrat.
    const unitPriceHT = Math.round(montantCents / 1.2) / 100;
    const vehicule = mandatVehiculeLabel(row);
    const item: QuoteItem = {
      id: "it_mandat",
      designation: `Honoraires — ${MANDAT_TYPE_LABEL[type]} ${row.reference}`,
      detail: [
        vehicule,
        row.plate,
        row.soldOn ? `Mission conclue le ${formatDateFr(row.soldOn)}` : "",
      ].filter(Boolean).join(" · "),
      qty: 1,
      unitPrice: unitPriceHT,
    };
    quote.items = [item];

    const created = await prisma.quote.create({ data: quoteToData(quote as unknown as Record<string, unknown>) });

    // La conversion commune s'applique : si un élément manque, le devis
    // pré-rempli reste là, prêt à compléter, et la réponse le dit.
    const result = await convertQuoteToFacture(created, "complete");
    if (!result.ok) {
      return NextResponse.json({ devisId: created.id, number: created.number, manque: result.error });
    }

    const author = acces.author;
    await prisma.mandat.update({
      where: { id },
      data: {
        feeInvoiceId: result.id,
        feeFinalCents: row.feeFinalCents > 0 ? row.feeFinalCents : montantCents,
        events: {
          create: [{
            type: "statut",
            content: `Facture d'honoraires ${result.number} créée (${formatEuroCents(montantCents)} TTC)`,
            author,
          }],
        },
      },
    });

    // Le montant retenu revient à l'écran : la fiche le repose dans le champ
    // « Honoraires facturés », resté vide jusque-là. Sans ce retour, le
    // prochain enregistrement renvoyait un zéro qui écrasait la somme.
    return NextResponse.json({
      factureId: result.id,
      number: result.number,
      champs: { feeFinalCents: row.feeFinalCents > 0 ? row.feeFinalCents : montantCents },
    });
  } catch {
    return NextResponse.json({ error: "La création de la facture a échoué." }, { status: 500 });
  }
}
