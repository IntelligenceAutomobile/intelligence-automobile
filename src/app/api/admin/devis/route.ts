import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { quoteToData, quoteFromRow } from "@/lib/quote-serialize";
import { DOCS_HORS_DEVIS } from "@/lib/devis";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // ?type=devis|facture pour restreindre (défaut : tout).
  const type = req.nextUrl.searchParams.get("type");
  const where = type === "facture" ? { docType: "facture" } : type === "devis" ? { docType: { notIn: [...DOCS_HORS_DEVIS] } } : undefined;

  // ?light=1 : juste de quoi peupler la palette de commandes. Sans ce mode, elle
  // téléchargeait TOUS les devis avec leurs lignes et leur mise en page, pour
  // n'en afficher que cinq.
  if (req.nextUrl.searchParams.get("light") === "1") {
    const legers = await prisma.quote.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: { id: true, number: true, docType: true, status: true, clientName: true, clientCompany: true },
    });
    return NextResponse.json(legers);
  }

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
