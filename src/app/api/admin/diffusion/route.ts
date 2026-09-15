import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  PORTAL_LABEL, controleDiffusion, digestAnnonce, isPortal, motifDeRefus, type Portal,
} from "@/lib/diffusion";
import { journaliser } from "@/lib/diffusion-server";

/* Nombre d'entrées non vides d'une liste stockée en JSON (photos, équipements). */
function compte(json: string): number {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x.trim() !== "").length : 0;
  } catch {
    return 0;
  }
}

// État de diffusion (démo) : met en ligne, retire ou remet en ligne une ou
// plusieurs annonces, sur un ou plusieurs portails, pour UN ou PLUSIEURS
// véhicules. La sélection multiple et la suspension d'un portail passent par le
// même chemin que le geste unitaire : mêmes contrôles, même journal.
//
// Trois règles portent toute la valeur de cette route :
//  1. Mettre en ligne un portail DÉJÀ en ligne ne réécrit rien. La date de
//     dernière mise en ligne (publishedAt) et la PREMIÈRE (firstPublishedAt)
//     restent intactes : l'ancienneté vraie survit aux republications.
//  2. Retirer une annonce CONSERVE ses dates. Le statut et removedAt suffisent
//     à dire qu'elle est hors ligne, et « Annuler » redevient un vrai retour en
//     arrière.
//  3. Tout part en une seule transaction par véhicule, avec un seul horodatage,
//     et chaque geste laisse une trace dans le journal.

type Action = "publish" | "unpublish" | "restore";

function lireAction(v: unknown): Action | null {
  return v === "publish" || v === "unpublish" || v === "restore" ? v : null;
}

/* Les portails demandés. Une valeur inconnue est refusée plutôt que corrigée en
   silence : une faute de frappe publiait auparavant sur les quatre portails. */
function lirePortails(v: unknown): Portal[] | null {
  const brut = Array.isArray(v) ? v : [v];
  if (brut.length === 0) return null;
  const out: Portal[] = [];
  for (const p of brut) {
    if (!isPortal(p)) return null;
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

function lireVehicules(body: Record<string, unknown>): string[] | null {
  const brut = Array.isArray(body.vehicleIds) ? body.vehicleIds : [body.vehicleId];
  const out: string[] = [];
  for (const v of brut) {
    if (typeof v !== "string" || v.trim() === "") return null;
    if (!out.includes(v)) out.push(v);
  }
  return out.length > 0 && out.length <= 100 ? out : null;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const action = lireAction(body.action);
  if (!action) return NextResponse.json({ error: "Action inconnue." }, { status: 400 });

  const portals = lirePortails(body.portals ?? body.portal);
  if (!portals) return NextResponse.json({ error: "Portail inconnu." }, { status: 400 });

  const vehicleIds = lireVehicules(body);
  if (!vehicleIds) return NextResponse.json({ error: "Véhicule manquant." }, { status: 400 });

  const auteur = decodeURIComponent(req.cookies.get("ia_collab_name")?.value ?? "");

  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: vehicleIds } },
    select: {
      id: true, make: true, model: true, status: true, isPublished: true,
      images: true, price: true, mileage: true, description: true, features: true,
    },
  });
  const parId = new Map(vehicles.map((v) => [v.id, v]));

  // Geste unitaire : les refus tombent en erreur franche, comme avant.
  // Geste groupé : les fiches refusées sont écartées et NOMMÉES, les autres
  // passent. Un lot qui échoue en bloc parce qu'une fiche manque de photo
  // transformerait la sélection multiple en loterie.
  const unitaire = vehicleIds.length === 1;
  const changed: Array<{ vehicleId: string; portals: Portal[] }> = [];
  const skipped: Array<{ vehicleId: string; vehicle: string; reason: string }> = [];

  for (const vehicleId of vehicleIds) {
    const vehicle = parId.get(vehicleId);
    if (!vehicle) {
      if (unitaire) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 400 });
      skipped.push({ vehicleId, vehicle: "", reason: "fiche introuvable" });
      continue;
    }
    const nom = `${vehicle.make} ${vehicle.model}`;

    if (action !== "unpublish" && (!vehicle.isPublished || vehicle.status === "vendu")) {
      const motif = "Ce véhicule est masqué ou vendu : rendez-le visible avant de le diffuser.";
      if (unitaire) return NextResponse.json({ error: motif }, { status: 400 });
      skipped.push({ vehicleId, vehicle: nom, reason: "masqué ou vendu" });
      continue;
    }

    // Contrôle avant envoi, comme le font les agrégateurs : ce qu'aucun portail
    // n'accepte bloque ici, avec un motif lisible. Le reste se signale à
    // l'écran sans empêcher le geste. La remise en ligne (restore) y échappe :
    // c'est un retour arrière, l'annonce était en ligne l'instant d'avant, et
    // un « Annuler » qui échoue ferait perdre confiance dans toute la bande.
    if (action === "publish") {
      const { bloquants } = controleDiffusion({
        photoCount: compte(vehicle.images),
        price: vehicle.price,
        mileage: vehicle.mileage,
        descriptionLength: vehicle.description.trim().length,
        featureCount: compte(vehicle.features),
      });
      if (bloquants.length > 0) {
        const motif = motifDeRefus(bloquants);
        await journaliser({ vehicleId, vehicle: nom, action: "refus", detail: motif, author: auteur });
        if (unitaire) return NextResponse.json({ error: motif }, { status: 400 });
        skipped.push({ vehicleId, vehicle: nom, reason: bloquants.join(", ") });
        continue;
      }
    }

    const existantes = await prisma.listing.findMany({ where: { vehicleId } });
    const parPortail = new Map(existantes.map((l) => [l.portal, l]));
    const maintenant = new Date();

    // Empreinte de ce qui part en ligne : elle datera l'annonce par son
    // CONTENU, et non par la dernière écriture sur la fiche.
    const empreinte = digestAnnonce({
      price: vehicle.price,
      mileage: vehicle.mileage,
      photoCount: compte(vehicle.images),
      description: vehicle.description,
      features: vehicle.features,
    });

    const operations = [];
    const faits: Portal[] = [];
    const republies: Portal[] = [];

    for (const portal of portals) {
      const courante = parPortail.get(portal);
      const enLigne = courante?.status === "publie";

      if (action === "publish") {
        // Déjà en ligne avec le même contenu : rien à réécrire, ses dates
        // restent intactes. Une empreinte vide date d'avant la mesure du
        // contenu : l'annonce est crue à jour, comme à l'écran.
        if (enLigne && (!courante?.publishedDigest || courante.publishedDigest === empreinte)) continue;
        // En ligne mais la fiche a bougé depuis : c'est une REPUBLICATION. La
        // date de dernière mise en ligne et l'empreinte se rafraîchissent, la
        // première mise en ligne reste. Sans ce cas, « Republier » répondait
        // « déjà en ligne » et l'alerte restait allumée pour toujours.
        if (enLigne) republies.push(portal);
        faits.push(portal);
        operations.push(
          prisma.listing.upsert({
            where: { vehicleId_portal: { vehicleId, portal } },
            create: {
              vehicleId,
              portal,
              status: "publie",
              publishedAt: maintenant,
              firstPublishedAt: maintenant,
              publishedDigest: empreinte,
              removedAt: null,
            },
            update: {
              status: "publie",
              publishedAt: maintenant,
              publishedDigest: empreinte,
              removedAt: null,
              // La première mise en ligne survit aux republications : elle
              // s'écrit une seule fois.
              firstPublishedAt: courante?.firstPublishedAt ?? maintenant,
            },
          }),
        );
      } else if (action === "restore") {
        // Retour arrière d'un retrait : le statut revient, les dates et
        // l'empreinte d'origine restent.
        if (enLigne || !courante) continue;
        faits.push(portal);
        operations.push(
          prisma.listing.update({
            where: { vehicleId_portal: { vehicleId, portal } },
            data: { status: "publie", removedAt: null },
          }),
        );
      } else {
        if (!courante || !enLigne) continue;
        faits.push(portal);
        operations.push(
          prisma.listing.update({
            where: { vehicleId_portal: { vehicleId, portal } },
            data: { status: "non_diffuse", removedAt: maintenant },
          }),
        );
      }
    }

    if (faits.length > 0) {
      const libelles = faits.map((p) => PORTAL_LABEL[p]).join(", ");
      // Le journal distingue la republication de la première mise en ligne :
      // « pourquoi la date a-t-elle bougé ? » y trouve sa réponse.
      const touteRepublication = action === "publish" && republies.length === faits.length;
      const detail =
        action === "publish" && republies.length > 0 && !touteRepublication
          ? `${libelles} (dont republication : ${republies.map((p) => PORTAL_LABEL[p]).join(", ")})`
          : libelles;
      operations.push(
        prisma.diffusionLog.create({
          data: {
            vehicleId,
            vehicle: nom.slice(0, 80),
            portal: faits.length === 1 ? faits[0] : "",
            action:
              action === "publish"
                ? touteRepublication
                  ? "republication"
                  : "mise_en_ligne"
                : action === "restore"
                  ? "remise_en_ligne"
                  : "retrait",
            detail,
            author: auteur.slice(0, 60),
          },
        }),
      );
      try {
        await prisma.$transaction(operations);
      } catch {
        if (unitaire) return NextResponse.json({ error: "L'enregistrement a échoué." }, { status: 500 });
        skipped.push({ vehicleId, vehicle: nom, reason: "enregistrement en échec" });
        continue;
      }
      changed.push({ vehicleId, portals: faits });
    } else {
      changed.push({ vehicleId, portals: [] });
    }
  }

  // Geste unitaire : le contrat historique, la liste des portails modifiés.
  if (unitaire) {
    return NextResponse.json({ changed: changed[0]?.portals ?? [] });
  }
  return NextResponse.json({ changed, skipped });
}
