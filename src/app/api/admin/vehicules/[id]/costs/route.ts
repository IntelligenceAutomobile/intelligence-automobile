import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isCostCategory } from "@/lib/vehicle-tracking";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toCents(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) : null;
  if (typeof v !== "string") return null;
  const cleaned = v.replace(/\s|€/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

// Ajout d'un frais à un véhicule.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
    if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });

    const body = await req.json();
    const amountCents = toCents(body.amount);
    if (amountCents === null || amountCents <= 0) {
      return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
    }
    const date = typeof body.date === "string" && DATE_RE.test(body.date) ? body.date : new Date().toISOString().slice(0, 10);

    const cost = await prisma.vehicleCost.create({
      data: {
        vehicleId: id,
        category: isCostCategory(body.category) ? body.category : "autre",
        label: String(body.label ?? "").trim(),
        amountCents,
        date,
      },
    });
    return NextResponse.json(cost);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'ajout." }, { status: 500 });
  }
}
