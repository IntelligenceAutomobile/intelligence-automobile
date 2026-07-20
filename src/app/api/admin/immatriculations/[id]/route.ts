import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { isRegStatus, isRegType, isVatRegime } from "@/lib/immatriculation";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (isRegType(body.type)) data.type = body.type;
    if (isRegStatus(body.status)) data.status = body.status;
    if (isVatRegime(body.vatRegime)) data.vatRegime = body.vatRegime;

    for (const key of ["vehicleLabel", "countryOrigin", "holderName", "holderAddress", "quitusRef", "sivRef", "archiveRef", "notes"] as const) {
      if (typeof body[key] === "string") data[key] = body[key].trim();
    }
    for (const key of ["vin", "plateForeign", "plateFinal"] as const) {
      if (typeof body[key] === "string") data[key] = body[key].trim().toUpperCase();
    }
    for (const key of ["firstRegDate", "acquiredOn", "deliveredOn", "registeredOn", "quitusDate", "archivedAt"] as const) {
      if (body[key] === "" || DATE_RE.test(String(body[key]))) data[key] = String(body[key] ?? "");
    }
    if (body.mileageKm !== undefined) data.mileageKm = Math.max(0, Math.round(Number(body.mileageKm) || 0));
    if (body.purchaseCents !== undefined) data.purchaseCents = Math.max(0, Math.round(Number(body.purchaseCents) || 0));

    // Pièces fournies : tableau de clés de la checklist, stocké en JSON.
    if (Array.isArray(body.documents)) data.documents = JSON.stringify(body.documents);

    const registration = await prisma.registration.update({ where: { id }, data });
    return NextResponse.json(registration);
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
    // Un dossier archivé matérialise une obligation de conservation : on refuse
    // de le retirer du back-office tant qu'il porte une référence de coffre-fort.
    const existing = await prisma.registration.findUnique({ where: { id }, select: { archiveRef: true } });
    if (existing?.archiveRef) {
      return NextResponse.json({ error: "Ce dossier est archivé, il reste conservé 5 ans." }, { status: 409 });
    }
    await prisma.registration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
