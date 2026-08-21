import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { voitMandats } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import {
  MANDAT_TYPE_LABEL, isMandatType, isMandatStatus, mandatStatusLabel,
  mandatVehiculeLabel, echeanceMandat,
} from "@/lib/mandats";

// Registre des mandats, exporté en CSV pour le comptable : la liste
// chronologique complète, un mandat par ligne, montants en euros.
// Point-virgule et BOM : le fichier s'ouvre proprement dans Excel en français.

/** Une cellule CSV : guillemets doublés, valeur encadrée dès qu'elle l'exige. */
function cellule(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function euros(cents: number): string {
  return cents > 0 ? String(Math.round(cents / 100)) : "";
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const collab = await getCollabSession();
  if (!voitMandats(session.admin.email, collab?.name)) {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  const rows = await prisma.mandat.findMany({ orderBy: { createdAt: "asc" } });
  const today = parisDay(new Date()).toISOString().slice(0, 10);

  const entetes = [
    "Référence", "Type", "Statut", "Créé le", "Signé le", "Prend effet le", "Échéance",
    "Client", "Email", "Téléphone",
    "Véhicule", "Immatriculation", "VIN",
    "Prix affiché (€)", "Prix plancher (€)", "Budget (€)", "Honoraires convenus (€)",
    "Conclu le", "Prix conclu (€)", "Honoraires facturés (€)",
    "Signature en ligne", "Note d'issue",
  ];

  const lignes = rows.map((m) => {
    const type = isMandatType(m.type) ? m.type : "vente";
    const status = isMandatStatus(m.status) ? m.status : "brouillon";
    const e = echeanceMandat(m.startDate, m.durationDays, today);
    return [
      m.reference,
      MANDAT_TYPE_LABEL[type],
      mandatStatusLabel(type, status),
      m.createdAt.toISOString().slice(0, 10),
      m.signedOn,
      m.startDate,
      e ? e.echeance : "",
      m.ownerName,
      m.ownerEmail,
      m.ownerPhone,
      mandatVehiculeLabel(m),
      m.plate,
      m.vin,
      euros(m.priceCents),
      euros(m.floorCents),
      euros(m.budgetCents),
      euros(m.feeCents),
      m.soldOn,
      euros(m.soldPriceCents),
      euros(m.feeFinalCents),
      m.signedAt !== "" ? `Signé en ligne par ${m.signerName}` : "",
      m.outcomeNote,
    ].map(cellule).join(";");
  });

  const csv = "﻿" + [entetes.map(cellule).join(";"), ...lignes].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registre-mandats-${today}.csv"`,
    },
  });
}
