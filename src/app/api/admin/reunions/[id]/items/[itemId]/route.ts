import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import { isDateKey, isItemStatus } from "@/lib/reunions";

// Modification partielle d'une décision ou d'une action.
// L'identifiant de la réunion fait partie du chemin : une ligne ne peut être
// modifiée que depuis la fiche qui la porte.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, itemId } = await params;

  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const body = parsed as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if ("content" in body) {
      const content = String(body.content ?? "").trim();
      if (!content) return NextResponse.json({ error: "Le texte est vide." }, { status: 400 });
      data.content = content.slice(0, 2000);
    }

    if ("owner" in body) data.owner = String(body.owner ?? "").trim().slice(0, 60);

    if ("dueDate" in body) {
      const raw = String(body.dueDate ?? "").trim();
      // La chaîne vide retire l'échéance : une action peut attendre sans date.
      if (raw && !isDateKey(raw)) return NextResponse.json({ error: "Échéance invalide." }, { status: 400 });
      data.dueDate = raw;
    }

    if ("status" in body) {
      if (!isItemStatus(body.status)) return NextResponse.json({ error: "Statut inconnu." }, { status: 400 });
      data.status = body.status;
      // La date de réalisation suit le statut : cocher pose le jour, décocher l'efface.
      data.doneAt = body.status === "fait" ? parisDay(new Date()).toISOString().slice(0, 10) : "";
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Rien à enregistrer." }, { status: 400 });
    }

    const updated = await prisma.meetingItem.updateMany({ where: { id: itemId, meetingId: id }, data });
    if (updated.count === 0) return NextResponse.json({ error: "Cette ligne a été supprimée." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "L'enregistrement a échoué." }, { status: 500 });
  }
}

// Suppression d'une ligne, sous la même capacité que la suppression d'une
// réunion : laisser les lignes ouvertes à tous permettait de vider un compte
// rendu décision par décision malgré le garde-fou posé sur la fiche. La
// correction d'une faute de frappe passe par le PATCH, qui reste ouvert.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "delete")) {
    return NextResponse.json({ error: "La suppression est réservée aux rôles patron et gestionnaire." }, { status: 403 });
  }

  const { id, itemId } = await params;

  try {
    const removed = await prisma.meetingItem.deleteMany({ where: { id: itemId, meetingId: id } });
    if (removed.count === 0) return NextResponse.json({ error: "Cette ligne a déjà été supprimée." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "La suppression a échoué." }, { status: 500 });
  }
}
