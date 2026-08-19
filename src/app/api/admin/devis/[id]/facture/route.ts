import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { convertQuoteToFacture } from "@/lib/devis-facture";
import type { FactureKind } from "@/lib/devis";

// Convertit un devis en facture (acompte / solde / complète).
// La mécanique vit dans lib/devis-facture : elle sert aussi la création
// directe d'une facture depuis le stock.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const src = await prisma.quote.findUnique({ where: { id } });
    if (!src) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const kind: FactureKind = body.kind === "acompte" || body.kind === "solde" ? body.kind : "complete";

    const result = await convertQuoteToFacture(src, kind);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ id: result.id, number: result.number });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la conversion." }, { status: 500 });
  }
}
