import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { quoteToData, quoteFromRow } from "@/lib/quote-serialize";
import { QUOTE_STATUSES, type QuoteStatus } from "@/lib/devis";
import { reserveVehicleForQuote, syncLeadForQuote } from "@/lib/devis-effets";
import { getCollabSession } from "@/lib/collab-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const row = await prisma.quote.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(quoteFromRow(row));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data = quoteToData(body);
    if (!data.number) return NextResponse.json({ error: "Numéro de devis manquant." }, { status: 400 });
    const updated = await prisma.quote.update({ where: { id }, data });
    return NextResponse.json(quoteFromRow(updated));
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("Unique") ? "Ce numéro de devis existe déjà." : "Erreur lors de la mise à jour.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Modification d'un seul champ depuis la liste (statut). Le PUT reconstruit tout
// l'enregistrement à partir du corps reçu : l'appeler avec le seul statut
// effacerait les lignes, les conditions et la mise en page du document.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data: { status?: string } = {};
    if (typeof body.status === "string" && QUOTE_STATUSES.includes(body.status as QuoteStatus)) {
      data.status = body.status;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucune modification reconnue." }, { status: 400 });
    }
    const updated = await prisma.quote.update({ where: { id }, data });

    // Le changement de statut ne s'arrête plus au devis : la voiture se réserve
    // et le pipeline commercial avance.
    if (updated.docType !== "facture") {
      const collab = await getCollabSession();
      const author = collab?.name ?? session.admin.email ?? "";
      if (updated.status === "accepte") await reserveVehicleForQuote(updated);
      await syncLeadForQuote(updated, author);
    }

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "delete")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
