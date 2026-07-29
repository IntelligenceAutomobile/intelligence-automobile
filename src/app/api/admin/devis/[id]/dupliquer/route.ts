import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { nextNumber, quotePrefix } from "@/lib/devis";
import { parisDay } from "@/lib/vehicules";

// Duplique un devis pour repartir d'une base au lieu de tout resaisir : c'est le
// geste courant quand deux clients demandent le même véhicule ou la même
// prestation. La copie arrive en brouillon, datée du jour, avec un numéro neuf.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const source = await prisma.quote.findUnique({
      where: { id },
      omit: { id: true, createdAt: true, updatedAt: true },
    });
    if (!source) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });

    const year = new Date().getFullYear();
    const taken = await prisma.quote.findMany({
      where: { number: { startsWith: quotePrefix(year) } },
      select: { number: true },
    });

    const copy = await prisma.quote.create({
      data: {
        ...source,
        number: nextNumber(quotePrefix(year), taken.map((q) => q.number)),
        // Une copie repart toujours en devis brouillon, même prise sur une facture.
        docType: "devis",
        factureKind: "complete",
        status: "brouillon",
        issueDate: parisDay(new Date()).toISOString().slice(0, 10),
        // Le suivi appartient au document d'origine : paiement, relances et
        // filiation repartent à zéro sur la copie.
        paymentStatus: "impayee",
        paidDate: "",
        sourceQuoteId: null,
        relanceCount: 0,
        lastRelanceDate: "",
        relanceSnoozeUntil: "",
        // La copie n'a jamais été envoyée ni signée. Le jeton du lien public est
        // unique en base : le recopier faisait échouer la duplication de tout
        // devis déjà envoyé, et aurait fait pointer deux devis sur un même lien.
        publicToken: null,
        sentAt: "",
        firstViewedAt: "",
        viewCount: 0,
        signerName: "",
        signedAt: "",
        signedIp: "",
      },
    });
    return NextResponse.json({ id: copy.id, number: copy.number });
  } catch {
    return NextResponse.json({ error: "La duplication a échoué." }, { status: 500 });
  }
}
