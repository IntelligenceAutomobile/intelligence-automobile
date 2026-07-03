import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { quoteToData, quoteFromRow } from "@/lib/quote-serialize";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // ?type=devis|facture pour restreindre (défaut : tout).
  const type = req.nextUrl.searchParams.get("type");
  const where = type === "facture" ? { docType: "facture" } : type === "devis" ? { docType: { not: "facture" } } : undefined;

  const rows = await prisma.quote.findMany({ where, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(rows.map(quoteFromRow));
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const data = quoteToData(body);
    if (!data.number) return NextResponse.json({ error: "Numéro de devis manquant." }, { status: 400 });
    const created = await prisma.quote.create({ data });
    return NextResponse.json(quoteFromRow(created));
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("Unique") ? "Ce numéro de devis existe déjà." : "Erreur lors de la création.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
