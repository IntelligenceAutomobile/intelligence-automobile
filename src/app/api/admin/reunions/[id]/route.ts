import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { isDateKey, isMeetingKind, type MeetingAttachment } from "@/lib/reunions";

// PATCH partiel : seules les clés présentes sont écrites. Les décisions et les
// actions ont leurs propres routes, si bien que cocher une action ne peut jamais
// écraser une synthèse en cours de rédaction dans l'autre onglet.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  try {
    // « null », un nombre ou une chaîne sont du JSON valide : l'opérateur `in`
    // lèverait dessus, et la panne ressortirait en 500 au lieu d'un refus clair.
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const body = parsed as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if ("title" in body) data.title = String(body.title ?? "").trim().slice(0, 200);
    if ("location" in body) data.location = String(body.location ?? "").trim().slice(0, 120);
    // La synthèse est le seul champ long, mais elle voyage dans chaque chargement
    // de la liste : une borne large la garde consultable.
    if ("summary" in body) data.summary = String(body.summary ?? "").slice(0, 20000);

    if ("date" in body) {
      if (!isDateKey(body.date)) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
      data.date = body.date;
    }

    if ("kind" in body) {
      if (!isMeetingKind(body.kind)) return NextResponse.json({ error: "Type de réunion inconnu." }, { status: 400 });
      data.kind = body.kind;
    }

    if ("attendees" in body) {
      const list = Array.isArray(body.attendees) ? body.attendees : [];
      const clean = list
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, 20);
      data.attendees = JSON.stringify(Array.from(new Set(clean)));
    }

    if ("attachments" in body) {
      const list = Array.isArray(body.attachments) ? body.attachments : [];
      const clean: MeetingAttachment[] = list
        .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
        .filter((v) => typeof v.url === "string" && v.url.trim() !== "")
        .map((v) => ({ url: String(v.url).trim(), label: String(v.label ?? "").trim() || "Document" }))
        .slice(0, 30);
      data.attachments = JSON.stringify(clean);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Rien à enregistrer." }, { status: 400 });
    }

    // updateMany plutôt qu'update : une réunion supprimée depuis un autre onglet
    // doit répondre « elle a été supprimée » et pas une erreur serveur.
    const updated = await prisma.meeting.updateMany({ where: { id }, data });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Cette réunion a été supprimée." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "L'enregistrement a échoué." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!can(asRole(session.admin.role), "delete")) {
    return NextResponse.json({ error: "La suppression est réservée aux rôles patron et gestionnaire." }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Les décisions et actions partent avec la réunion (cascade du schéma).
    const removed = await prisma.meeting.deleteMany({ where: { id } });
    if (removed.count === 0) {
      return NextResponse.json({ error: "Cette réunion a déjà été supprimée." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "La suppression a échoué." }, { status: 500 });
  }
}
