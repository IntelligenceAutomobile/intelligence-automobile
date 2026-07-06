import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { sanitizeEntryInput } from "@/lib/comptes";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "finances")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data = sanitizeEntryInput(body, new Date().toISOString().slice(0, 10));
    if (!data) {
      return NextResponse.json({ error: "Écriture invalide : payeur ou montant manquant." }, { status: 400 });
    }
    const updated = await prisma.ledgerEntry.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[comptes PUT]", err);
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "finances")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.ledgerEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[comptes DELETE]", err);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
