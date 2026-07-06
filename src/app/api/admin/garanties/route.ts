import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isWarrantyType, addMonths } from "@/lib/warranties";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rows = await prisma.warranty.findMany({ orderBy: { endDate: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const clientName = String(body.clientName ?? "").trim();
    if (!clientName) return NextResponse.json({ error: "Le nom du client est requis." }, { status: 400 });

    const startDate = DATE_RE.test(String(body.startDate)) ? String(body.startDate) : new Date().toISOString().slice(0, 10);
    // Échéance : date de fin explicite, sinon début + durée (mois).
    let endDate = DATE_RE.test(String(body.endDate)) ? String(body.endDate) : "";
    if (!endDate) {
      const months = Math.round(Number(body.durationMonths));
      endDate = addMonths(startDate, Number.isFinite(months) && months > 0 ? months : 12);
    }

    const warranty = await prisma.warranty.create({
      data: {
        clientName,
        clientEmail: String(body.clientEmail ?? "").trim(),
        vehicleLabel: String(body.vehicleLabel ?? "").trim(),
        type: isWarrantyType(body.type) ? body.type : "constructeur",
        startDate,
        endDate,
        notes: String(body.notes ?? "").trim(),
      },
    });
    return NextResponse.json(warranty);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }
}
