import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  isAppointmentType, isValidStartMin,
  MIN_DURATION_MIN, MAX_DURATION_MIN,
} from "@/lib/planning";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Modification partielle : seules les clés présentes dans le corps sont écrites,
// ce qui permet au glisser de n'envoyer que { date, startMin }. Les bornes sont
// celles de la création : la route les laissait autrefois toutes passer, si bien
// qu'une durée aberrante dessinait un bloc traversant la page.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.date === "string") {
      if (!DATE_RE.test(body.date)) return NextResponse.json({ error: "Date invalide." }, { status: 400 });
      data.date = body.date;
    }
    if (body.startMin !== undefined) {
      if (!isValidStartMin(body.startMin)) return NextResponse.json({ error: "Heure de début invalide." }, { status: 400 });
      data.startMin = Math.round(Number(body.startMin));
    }
    if (body.durationMin !== undefined) {
      const d = Math.round(Number(body.durationMin));
      if (!Number.isFinite(d) || d < MIN_DURATION_MIN || d > MAX_DURATION_MIN) {
        return NextResponse.json({ error: "Durée invalide." }, { status: 400 });
      }
      data.durationMin = d;
    }
    if (body.type !== undefined) {
      if (!isAppointmentType(body.type)) return NextResponse.json({ error: "Type inconnu." }, { status: 400 });
      data.type = body.type;
    }
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.person === "string") data.person = body.person.trim();
    if (typeof body.clientId === "string" || body.clientId === null) data.clientId = body.clientId || null;
    if (typeof body.vehicleId === "string" || body.vehicleId === null) data.vehicleId = body.vehicleId || null;
    if (typeof body.notes === "string") data.notes = body.notes.trim();

    // Règle appliquée sur l'état résultant, et plus seulement à la création :
    // une modification pouvait vider la personne d'une indisponibilité.
    const merged = { ...existing, ...data } as { type: string; person: string };
    if (merged.type === "indispo" && !merged.person.trim()) {
      return NextResponse.json({ error: "Indiquez la personne concernée par l'indisponibilité." }, { status: 400 });
    }

    const appt = await prisma.appointment.update({ where: { id }, data });
    return NextResponse.json(appt);
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
