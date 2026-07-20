import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assessVat, isRegType, isVatRegime } from "@/lib/immatriculation";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function asDate(v: unknown): string {
  return DATE_RE.test(String(v)) ? String(v) : "";
}

/** Référence lisible du dossier : IMM-2026-014, remise à 1 chaque année. */
async function nextReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `IMM-${year}-`;
  const last = await prisma.registration.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last ? parseInt(last.reference.slice(prefix.length), 10) : 0;
  return `${prefix}${String((Number.isFinite(seq) ? seq : 0) + 1).padStart(3, "0")}`;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rows = await prisma.registration.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const vehicleLabel = String(body.vehicleLabel ?? "").trim();
    if (!vehicleLabel) return NextResponse.json({ error: "Le véhicule est requis." }, { status: 400 });

    const type = isRegType(body.type) ? body.type : "import_ue";
    const firstRegDate = asDate(body.firstRegDate);
    const acquiredOn = asDate(body.acquiredOn);
    const mileageKm = Math.max(0, Math.round(Number(body.mileageKm) || 0));

    // Le régime se calcule dès la création quand les données le permettent ;
    // il reste modifiable ensuite depuis la fiche.
    let vatRegime = isVatRegime(body.vatRegime) ? body.vatRegime : "occasion";
    if (type === "import_ue" && firstRegDate && acquiredOn) {
      vatRegime = assessVat(firstRegDate, mileageKm, acquiredOn).regime;
    }

    const registration = await prisma.registration.create({
      data: {
        reference: await nextReference(),
        type,
        status: "pieces",
        vehicleId: typeof body.vehicleId === "string" && body.vehicleId ? body.vehicleId : null,
        clientId: typeof body.clientId === "string" && body.clientId ? body.clientId : null,
        vehicleLabel,
        vin: String(body.vin ?? "").trim().toUpperCase(),
        plateForeign: String(body.plateForeign ?? "").trim().toUpperCase(),
        countryOrigin: String(body.countryOrigin ?? "Allemagne").trim(),
        firstRegDate,
        mileageKm,
        holderName: String(body.holderName ?? "").trim(),
        holderAddress: String(body.holderAddress ?? "").trim(),
        acquiredOn,
        deliveredOn: asDate(body.deliveredOn),
        vatRegime,
        purchaseCents: Math.max(0, Math.round(Number(body.purchaseCents) || 0)),
        notes: String(body.notes ?? "").trim(),
      },
    });
    return NextResponse.json(registration);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  }
}
