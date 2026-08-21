import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMandats } from "@/lib/mandats-acces";
import { parisDay } from "@/lib/vehicules";
import {
  MANDAT_TYPE_LABEL, isMandatType, isMandatStatus, mandatStatusLabel,
  mandatVehiculeLabel, echeanceMandat,
} from "@/lib/mandats";

// Registre des mandats, exporté en CSV pour le comptable : la liste
// chronologique complète, un mandat par ligne, montants en euros.
// Point-virgule et BOM : le fichier s'ouvre proprement dans Excel en français.

/**
 * Une cellule CSV : guillemets doublés, valeur encadrée dès qu'elle l'exige.
 *
 * Un tableur lit « = », « + », « - » et « @ » en tête de cellule comme le
 * début d'une formule : un téléphone international « +33 6 … » s'affichait en
 * erreur dans Excel, et une note commençant par « = » aurait pu s'exécuter.
 * Ces valeurs sont donc encadrées ET précédées d'une apostrophe, la marque que
 * les tableurs reconnaissent pour « ceci est du texte ».
 */
function cellule(v: string | number): string {
  const s = String(v);
  const formule = /^[=+\-@\t\r]/.test(s);
  const texte = formule ? `'${s}` : s;
  return formule || /[";\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

function euros(cents: number): string {
  return cents > 0 ? String(Math.round(cents / 100)) : "";
}

export async function GET() {
  const acces = await requireMandats();
  if (!acces.ok) return acces.refus;

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
      // Jour de Paris : le serveur tourne en temps universel, et un mandat
      // saisi après minuit sortait daté de la veille dans le registre.
      parisDay(m.createdAt).toISOString().slice(0, 10),
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
