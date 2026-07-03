import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isAppointmentType } from "@/lib/planning";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.date === "string" && DATE_RE.test(body.date)) data.date = body.date;
    if (Number.isFinite(Number(body.startMin))) data.startMin = Math.round(Number(body.startMin));
    if (Number.isFinite(Number(body.durationMin))) data.durationMin = Math.max(15, Math.round(Number(body.durationMin)));
    if (isAppointmentType(body.type)) data.type = body.type;
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.person === "string") data.person = body.person.trim();
    if (typeof body.clientId === "string" || body.clientId === null) data.clientId = body.clientId || null;
    if (typeof body.vehicleId === "string" || body.vehicleId === null) data.vehicleId = body.vehicleId || null;
    if (typeof body.notes === "string") data.notes = body.notes.trim();

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
