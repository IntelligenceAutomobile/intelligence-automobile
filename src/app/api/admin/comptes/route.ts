import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { sanitizeEntryInput } from "@/lib/comptes";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "finances")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const rows = await prisma.ledgerEntry.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "finances")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const body = await req.json();
    const data = sanitizeEntryInput(body, new Date().toISOString().slice(0, 10));
    if (!data) {
      return NextResponse.json({ error: "Écriture invalide : payeur ou montant manquant." }, { status: 400 });
    }
    const created = await prisma.ledgerEntry.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[comptes POST]", err);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }
}
