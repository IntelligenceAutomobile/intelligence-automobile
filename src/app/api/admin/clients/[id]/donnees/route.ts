import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { dossierPersonnel } from "@/lib/rgpd";

// Droit d'accès et portabilité (art. 15 et 20 du RGPD) : remet à la personne
// TOUT ce que le back-office détient sur elle, dans un fichier lisible et
// réutilisable. Répondre à la main à une telle demande suppose de fouiller six
// écrans ; le délai légal est d'un mois.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const dossier = await dossierPersonnel(id);
  if (!dossier) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });

  const { client, quotes, appointments, warranties, registrations } = dossier;

  const contenu = {
    genereLe: new Date().toISOString(),
    objet: "Données personnelles détenues par l'agence, remises au titre des articles 15 et 20 du RGPD.",
    personne: {
      nom: client.name,
      societe: client.company,
      email: client.email,
      telephone: client.phone,
      notes: client.notes,
      fichecreeeLe: client.createdAt,
      demandeAvisEnvoyeeLe: client.reviewRequestedAt || null,
      demandesAvisEnvoyees: client.reviewCount,
      demandeAvisIssue: client.reviewOutcome || null,
      demandeAvisMotif: client.reviewOutcomeNote || null,
    },
    pistesCommerciales: client.leads.map((l) => ({
      objet: l.title,
      etape: l.stage,
      origine: l.source,
      budget: l.budget,
      creeeLe: l.createdAt,
      journal: l.events.map((e) => ({ type: e.type, contenu: e.content, auteur: e.author, le: e.createdAt })),
    })),
    documents: quotes.map((q) => ({
      type: q.docType,
      numero: q.number,
      emisLe: q.issueDate,
      statut: q.status,
      paiement: q.docType === "devis" ? null : q.paymentStatus,
      nomPorte: q.clientName,
      societePortee: q.clientCompany,
      adressePortee: q.clientAddress,
      emailPorte: q.clientEmail,
      telephonePorte: q.clientPhone,
      pays: q.clientCountry,
      numeroTva: q.clientVatNumber,
      lignes: (() => {
        try {
          return JSON.parse(q.items);
        } catch {
          return [];
        }
      })(),
      envoyeLe: q.sentAt || null,
      premiereLectureLe: q.firstViewedAt || null,
      nombreDeLectures: q.viewCount,
      accepteLe: q.signedAt || null,
      accepteParnom: q.signerName || null,
      adresseIpDeLAcceptation: q.signedIp || null,
    })),
    rendezVous: appointments.map((a) => ({ jour: a.date, type: a.type, objet: a.title, personne: a.person, notes: a.notes })),
    garanties: warranties.map((g) => ({ vehicule: g.vehicleLabel, type: g.type, debut: g.startDate, fin: g.endDate, notes: g.notes })),
    dossiersImmatriculation: registrations.map((r) => ({
      reference: r.reference,
      type: r.type,
      statut: r.status,
      vehicule: r.vehicleLabel,
      numeroDeSerie: r.vin,
      immatriculation: r.plateFinal || r.plateForeign,
      titulaire: r.holderName,
      adresseDuTitulaire: r.holderAddress,
      acquisLe: r.acquiredOn || null,
      immatriculeLe: r.registeredOn || null,
    })),
  };

  const nom = (client.company || client.name || "client").replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase();
  return new NextResponse(JSON.stringify(contenu, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="donnees-${nom}.json"`,
      // Un dossier nominatif ne se met jamais en cache.
      "Cache-Control": "no-store",
    },
  });
}
