import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import {
  computeTotals, avoirNumber, avoirPrefix, formatDateFr, formatEuro,
  type QuoteItem, type TvaMode, type DepositMode,
} from "@/lib/devis";
import { parisDay } from "@/lib/vehicules";

// Établit un avoir sur une facture émise.
//
// Une facture ne se modifie ni ne se supprime : la comptabilité impose que les
// écritures restent intangibles. Corriger une facture, c'est émettre un avoir
// qui la crédite, en totalité ou en partie. Jusqu'ici le back-office ne savait
// pas le faire : une erreur de facturation se réglait en supprimant la facture,
// ce qui laissait un trou dans la numérotation.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  // Créditer une facture engage la comptabilité : même droit que l'accès aux finances.
  if (!can(asRole(session.admin.role), "finances")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const src = await prisma.quote.findUnique({ where: { id } });
    if (!src) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
    if (src.docType === "avoir") {
      return NextResponse.json({ error: "Un avoir ne se crédite pas lui-même." }, { status: 400 });
    }
    if (src.docType !== "facture") {
      return NextResponse.json({ error: "Un avoir se fait sur une facture. Convertissez d'abord ce devis en facture." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const kind: "total" | "partiel" = body.kind === "partiel" ? "partiel" : "total";
    const reason = String(body.reason ?? "").trim().slice(0, 300);
    if (!reason) {
      return NextResponse.json({ error: "Indiquez le motif de l'avoir." }, { status: 400 });
    }

    let items: QuoteItem[] = [];
    try {
      const p = JSON.parse(src.items);
      if (Array.isArray(p)) items = p;
    } catch {
      /* une facture abîmée se crédite quand même, sur son montant lu */
    }
    const chiffres = {
      items,
      tvaMode: src.tvaMode as TvaMode,
      tvaRate: src.tvaRate,
      depositMode: src.depositMode as DepositMode,
      depositValue: src.depositValue,
    };
    const totals = computeTotals(chiffres);
    // Le montant réellement facturé : une facture de solde ne porte que le solde.
    const facture = src.factureKind === "solde" ? totals.balance : totals.totalTTC;

    // Somme déjà créditée : deux avoirs ne peuvent pas dépasser la facture.
    const dejaAvoirs = await prisma.quote.findMany({
      where: { docType: "avoir", sourceQuoteId: src.id },
      select: { items: true, tvaMode: true, tvaRate: true, depositMode: true, depositValue: true, number: true },
    });
    let dejaCredite = 0;
    for (const a of dejaAvoirs) {
      let aItems: QuoteItem[] = [];
      try {
        const p = JSON.parse(a.items);
        if (Array.isArray(p)) aItems = p;
      } catch {
        /* ignore */
      }
      dejaCredite += computeTotals({
        items: aItems,
        tvaMode: a.tvaMode as TvaMode,
        tvaRate: a.tvaRate,
        depositMode: a.depositMode as DepositMode,
        depositValue: a.depositValue,
      }).totalTTC;
    }
    const restant = Math.round((facture - dejaCredite) * 100) / 100;
    if (restant <= 0) {
      return NextResponse.json(
        { error: `Cette facture est déjà créditée en totalité (${dejaAvoirs.map((a) => a.number).join(", ")}).` },
        { status: 409 },
      );
    }

    let newItems: QuoteItem[];
    if (kind === "total") {
      if (dejaCredite > 0) {
        return NextResponse.json(
          { error: `Un avoir partiel existe déjà sur cette facture. Il reste ${formatEuro(restant)} à créditer : établissez un avoir partiel de ce montant.` },
          { status: 409 },
        );
      }
      // Avoir total : le détail de la facture est reproduit à l'identique, pour
      // que le client retrouve ligne par ligne ce qui lui est crédité.
      newItems = items;
    } else {
      const montant = Math.round((Number(body.amount) || 0) * 100) / 100;
      if (montant <= 0) {
        return NextResponse.json({ error: "Indiquez le montant à créditer." }, { status: 400 });
      }
      if (montant > restant) {
        return NextResponse.json(
          { error: `Le montant dépasse ce qui reste à créditer sur cette facture (${formatEuro(restant)}).` },
          { status: 400 },
        );
      }
      newItems = [{
        id: "avoir",
        designation: `Avoir sur facture ${src.number}`,
        detail: reason,
        qty: 1,
        unitPrice: montant,
      }];
    }

    const year = new Date().getFullYear();
    const taken = await prisma.quote.findMany({
      where: { docType: "avoir", number: { startsWith: avoirPrefix(year) } },
      select: { number: true },
    });
    // Jour de Paris : un avoir établi le soir datait de la veille.
    const issueDate = parisDay(new Date()).toISOString().slice(0, 10);

    const avoir = await prisma.quote.create({
      data: {
        number: avoirNumber(year, taken.map((a) => a.number)),
        kind: src.kind,
        // Un avoir ne se signe pas et ne s'attend pas : il est émis, point.
        status: "accepte",
        docType: "avoir",
        factureKind: "complete",
        // Un avoir n'est pas une créance : il ne doit jamais remonter dans
        // l'encours impayé ni dans le centre de relances.
        paymentStatus: "payee",
        sourceQuoteId: src.id,
        clientId: src.clientId,
        clientName: src.clientName,
        clientCompany: src.clientCompany,
        clientAddress: src.clientAddress,
        clientEmail: src.clientEmail,
        clientPhone: src.clientPhone,
        clientCountry: src.clientCountry,
        clientVatNumber: src.clientVatNumber,
        issueDate,
        // Un avoir n'a pas d'échéance de règlement.
        validityDays: 0,
        items: JSON.stringify(newItems),
        // Même régime de TVA que la facture créditée : c'est la même opération,
        // en sens inverse. Un avoir hors taxe sur une facture TTC laisserait la
        // TVA collectée sans contrepartie.
        tvaMode: src.tvaMode,
        tvaRate: src.tvaRate,
        // L'acompte appartient à la facture, pas à son avoir.
        depositMode: "none",
        depositValue: 0,
        // Le champ libre du document porte le motif : sur un avoir, il n'y a
        // pas de conditions de règlement à énoncer.
        paymentTerms: reason,
        notes: `Avoir sur la facture ${src.number} du ${formatDateFr(src.issueDate)}.`,
        branding: src.branding,
        vehicleId: src.vehicleId,
        vehicleInfo: src.vehicleInfo,
      },
    });

    return NextResponse.json({ id: avoir.id, number: avoir.number, montant: computeTotals({ ...chiffres, items: newItems, depositMode: "none", depositValue: 0 }).totalTTC });
  } catch {
    return NextResponse.json({ error: "L'avoir n'a pas pu être établi." }, { status: 500 });
  }
}
