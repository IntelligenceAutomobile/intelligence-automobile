import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { isWarrantyType } from "@/lib/warranties";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.clientName === "string" && body.clientName.trim()) data.clientName = body.clientName.trim();
    if (typeof body.clientEmail === "string") data.clientEmail = body.clientEmail.trim();
    if (typeof body.vehicleLabel === "string") data.vehicleLabel = body.vehicleLabel.trim();
    if (isWarrantyType(body.type)) data.type = body.type;
    if (DATE_RE.test(String(body.startDate))) data.startDate = body.startDate;
    if (DATE_RE.test(String(body.endDate))) data.endDate = body.endDate;
    if (typeof body.notes === "string") data.notes = body.notes.trim();

    const warranty = await prisma.warranty.update({ where: { id }, data });
    return NextResponse.json(warranty);
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
    await prisma.warranty.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
