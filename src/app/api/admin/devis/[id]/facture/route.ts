import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { reserveVehicleForQuote } from "@/lib/devis-effets";
import { computeTotals, factureNumber, facturePrefix, FACTURE_KIND_LABEL, quoteIssues, issuesLabel, type FactureKind, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import { parisDay } from "@/lib/vehicules";

// Convertit un devis en facture (acompte / solde / complète).
// Réutilise le moteur devis : la facture est une ligne Quote (docType=facture).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const src = await prisma.quote.findUnique({ where: { id } });
    if (!src) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
    if (src.docType === "facture") return NextResponse.json({ error: "Ce document est déjà une facture." }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const kind: FactureKind = body.kind === "acompte" || body.kind === "solde" ? body.kind : "complete";

    let items: QuoteItem[] = [];
    try {
      const p = JSON.parse(src.items);
      if (Array.isArray(p)) items = p;
    } catch {
      /* ignore */
    }

    const totals = computeTotals({
      items,
      tvaMode: src.tvaMode as TvaMode,
      tvaRate: src.tvaRate,
      depositMode: src.depositMode as DepositMode,
      depositValue: src.depositValue,
    });

    // Facturer un devis vide produisait une facture à 0 € en toute discrétion.
    const manques = quoteIssues({
      items, tvaMode: src.tvaMode as TvaMode, tvaRate: src.tvaRate,
      depositMode: src.depositMode as DepositMode, depositValue: src.depositValue,
      clientName: src.clientName, clientCompany: src.clientCompany,
    });
    if (manques.length > 0) {
      return NextResponse.json({ error: `Ce devis attend encore ${issuesLabel(manques)}.` }, { status: 400 });
    }

    if (kind === "acompte" && totals.deposit <= 0) {
      return NextResponse.json({ error: "Ce devis ne prévoit pas d'acompte." }, { status: 400 });
    }

    // Une facture du même type par devis : sans ce contrôle, un retour arrière du
    // navigateur suivi d'un second clic créait un doublon et doublait l'encours.
    const deja = await prisma.quote.findFirst({
      where: { docType: "facture", sourceQuoteId: src.id, factureKind: kind },
      select: { number: true },
    });
    if (deja) {
      return NextResponse.json(
        { error: `${FACTURE_KIND_LABEL[kind]} ${deja.number} existe déjà pour ce devis.` },
        { status: 409 },
      );
    }

    // Numéro de facture continu FAC-AAAA-NNN, calculé sur le plus grand déjà attribué.
    const year = new Date().getFullYear();
    const taken = await prisma.quote.findMany({
      where: { docType: "facture", number: { startsWith: facturePrefix(year) } },
      select: { number: true },
    });
    const number = factureNumber(year, taken.map((f) => f.number));
    // Jour de Paris : la facture émise le soir datait de la veille, décalant son échéance.
    const issueDate = parisDay(new Date()).toISOString().slice(0, 10);

    let newItems: QuoteItem[];
    let depositMode = "none";
    let depositValue = 0;
    let paymentTerms = src.paymentTerms;

    if (kind === "acompte") {
      // Une ligne = l'acompte. Le montant HT vient du calcul du devis lui-même :
      // le reconvertir ici faisait diverger d'un centime la somme acompte + solde.
      const unitPrice = totals.depositHT;
      let designation = "Acompte sur commande";
      if (src.vehicleId) {
        const v = await prisma.vehicle.findUnique({ where: { id: src.vehicleId }, select: { make: true, model: true } });
        if (v) designation = `Acompte sur commande — ${v.make} ${v.model}`;
      }
      newItems = [{ id: "acompte", designation, detail: `Acompte sur devis ${src.number}`, qty: 1, unitPrice }];
      paymentTerms = "Facture d'acompte. Le solde fera l'objet d'une facture ultérieure.";
    } else if (kind === "solde") {
      // Détail complet + acompte déjà facturé déduit (via depositMode/Value du devis).
      newItems = items;
      depositMode = src.depositMode;
      depositValue = src.depositValue;
      paymentTerms = "Facture de solde. Acompte déjà facturé, solde restant dû.";
    } else {
      // Facture complète : total intégral, sans découpage.
      newItems = items;
    }

    const facture = await prisma.quote.create({
      data: {
        number,
        kind: src.kind,
        status: "envoye",
        docType: "facture",
        factureKind: kind,
        paymentStatus: "impayee",
        sourceQuoteId: src.id,
        clientId: src.clientId,
        clientName: src.clientName,
        clientCompany: src.clientCompany,
        clientAddress: src.clientAddress,
        clientEmail: src.clientEmail,
        clientPhone: src.clientPhone,
        issueDate,
        // Sur une facture, ce champ porte le délai de règlement : sans lui, le
        // document ne dit ni quand payer ni à partir de quand la créance est due.
        validityDays: 30,
        items: JSON.stringify(newItems),
        tvaMode: src.tvaMode,
        tvaRate: src.tvaRate,
        depositMode,
        depositValue,
        paymentTerms,
        notes: src.notes,
        branding: src.branding,
        vehicleId: src.vehicleId,
        // La facture désigne la même voiture que le devis, avec le même numéro
        // de série : c'est ce qui rattache la pièce comptable au véhicule.
        vehicleInfo: src.vehicleInfo,
      },
    });

    // Le devis converti passe « accepté », et la voiture quitte le site.
    if (src.status !== "accepte") {
      await prisma.quote.update({ where: { id: src.id }, data: { status: "accepte" } });
    }
    await reserveVehicleForQuote({ ...src, status: "accepte" });

    return NextResponse.json({ id: facture.id, number: facture.number });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la conversion." }, { status: 500 });
  }
}
