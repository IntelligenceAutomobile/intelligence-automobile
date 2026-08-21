import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMandats } from "@/lib/mandats-acces";
import { parisDay } from "@/lib/vehicules";
import { assessVat } from "@/lib/immatriculation";
import { mandatVehiculeLabel } from "@/lib/mandats";

/** Référence lisible du dossier : IMM-2026-014, remise à 1 chaque année.
    Même recette que le module Immatriculations, qui reste maître de la série. */
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

/**
 * Ouvre le dossier d'immatriculation d'un mandat d'import signé : quitus,
 * plaques provisoires et carte grise se pilotent ensuite depuis le module
 * Immatriculations, prérempli avec le client et le véhicule retenu.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const acces = await requireMandats();
  if (!acces.ok) return acces.refus;

  const { id } = await params;
  try {
    const row = await prisma.mandat.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Mandat introuvable." }, { status: 404 });
    if (row.type !== "import") {
      return NextResponse.json({ error: "Le dossier d'immatriculation accompagne les mandats d'import." }, { status: 400 });
    }
    if (row.registrationId) {
      const existant = await prisma.registration.findUnique({ where: { id: row.registrationId }, select: { id: true, reference: true } });
      if (existant) return NextResponse.json({ id: existant.id, reference: existant.reference, deja: true });
    }
    if (row.status !== "signe" && row.status !== "vendu") {
      return NextResponse.json({ error: "Le dossier s'ouvre une fois le mandat signé." }, { status: 409 });
    }

    const author = acces.author;
    const jour = parisDay(new Date()).toISOString().slice(0, 10);
    const acquiredOn = row.soldOn || jour;

    // Le régime de TVA se propose depuis la règle des six mois et 6 000 km ;
    // il reste modifiable sur le dossier tant que les repères sont incomplets.
    const vat = row.firstRegDate && row.mileageKm > 0 ? assessVat(row.firstRegDate, row.mileageKm, acquiredOn) : null;

    const reference = await nextReference();
    const dossier = await prisma.registration.create({
      data: {
        reference,
        type: "import_ue",
        status: "brouillon",
        vehicleLabel: mandatVehiculeLabel(row),
        vin: row.vin,
        plateForeign: row.plate,
        countryOrigin: row.countryOrigin,
        firstRegDate: row.firstRegDate,
        mileageKm: row.mileageKm,
        holderName: row.ownerName,
        holderAddress: row.ownerAddress,
        acquiredOn,
        vatRegime: vat?.regime ?? "occasion",
        purchaseCents: row.soldPriceCents > 0 ? row.soldPriceCents : row.budgetCents,
      },
    });

    await prisma.mandat.update({
      where: { id },
      data: {
        registrationId: dossier.id,
        events: {
          create: [{ type: "statut", content: `Dossier d'immatriculation ${reference} ouvert`, author }],
        },
      },
    });

    return NextResponse.json({ id: dossier.id, reference });
  } catch (e) {
    if (e instanceof Error && /unique/i.test(e.message) && /reference/i.test(e.message)) {
      return NextResponse.json({ error: "Un autre dossier vient d'être créé. Réessayez." }, { status: 409 });
    }
    return NextResponse.json({ error: "La création du dossier a échoué." }, { status: 500 });
  }
}
