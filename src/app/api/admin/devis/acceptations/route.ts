import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { computeTotals, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";

// Devis signés en ligne par le client, plus récents que l'horodatage fourni.
// Interrogée en boucle par le back-office pour annoncer une acceptation où que
// l'on soit dans l'outil : sans elle, une signature passait inaperçue jusqu'à la
// prochaine ouverture de la liste.
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // `signedAt` est un horodatage ISO : la comparaison de chaînes suit l'ordre
  // chronologique, aucune conversion nécessaire.
  const since = (req.nextUrl.searchParams.get("since") ?? "").trim();

  const rows = await prisma.quote.findMany({
    where: {
      docType: { not: "facture" },
      signedAt: since ? { gt: since } : { not: "" },
    },
    orderBy: { signedAt: "desc" },
    take: 20,
    select: {
      id: true, number: true, clientName: true, clientCompany: true,
      signerName: true, signedAt: true, items: true,
      tvaMode: true, tvaRate: true, depositMode: true, depositValue: true,
    },
  });

  const acceptations = rows.map((r) => {
    let items: QuoteItem[] = [];
    try {
      const p = JSON.parse(r.items);
      if (Array.isArray(p)) items = p;
    } catch {
      /* un devis abîmé s'annonce quand même, avec un total à zéro */
    }
    const totals = computeTotals({
      items,
      tvaMode: r.tvaMode as TvaMode,
      tvaRate: r.tvaRate,
      depositMode: r.depositMode as DepositMode,
      depositValue: r.depositValue,
    });
    return {
      id: r.id,
      number: r.number,
      client: r.clientCompany || r.clientName || "",
      signerName: r.signerName,
      signedAt: r.signedAt,
      amount: totals.totalTTC,
    };
  });

  return NextResponse.json({ acceptations });
}
