import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { controleDiffusion, digestAnnonce, isPortal, motifDeRefus, type Portal } from "@/lib/diffusion";

/* Nombre d'entrées non vides d'une liste stockée en JSON (photos, équipements). */
function compte(json: string): number {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x.trim() !== "").length : 0;
  } catch {
    return 0;
  }
}

// État de diffusion (démo) : met en ligne, retire ou remet en ligne une annonce
// sur un ou plusieurs portails.
//
// Trois règles portent toute la valeur de cette route :
//  1. Mettre en ligne un portail DÉJÀ en ligne ne réécrit rien. Avant, le
//     bouton « Diffuser » republiait les quatre portails et remettait leur date
//     de mise en ligne à aujourd'hui : l'ancienneté réelle était perdue.
//  2. Retirer une annonce CONSERVE sa date de mise en ligne. Le statut suffit à
//     dire qu'elle est hors ligne, et « Annuler » redevient un vrai retour en
//     arrière.
//  3. Tout part en une seule transaction, avec un seul horodatage.

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

  const vehicleId = String(body.vehicleId ?? "");
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true, status: true, isPublished: true,
      images: true, price: true, mileage: true, description: true, features: true,
    },
  });
  if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 400 });

  if (action !== "unpublish" && (!vehicle.isPublished || vehicle.status === "vendu")) {
    return NextResponse.json(
      { error: "Ce véhicule est masqué ou vendu : rendez-le visible avant de le diffuser." },
      { status: 400 },
    );
  }

  // Contrôle avant envoi, comme le font les agrégateurs : ce qu'aucun portail
  // n'accepte bloque ici, avec un motif lisible. Le reste se signale à l'écran
  // sans empêcher le geste, pour que l'outil reste un outil.
  if (action !== "unpublish") {
    const { bloquants } = controleDiffusion({
      photoCount: compte(vehicle.images),
      price: vehicle.price,
      mileage: vehicle.mileage,
      descriptionLength: vehicle.description.trim().length,
      featureCount: compte(vehicle.features),
    });
    if (bloquants.length > 0) {
      return NextResponse.json({ error: motifDeRefus(bloquants) }, { status: 400 });
    }
  }

  const existantes = await prisma.listing.findMany({ where: { vehicleId } });
  const parPortail = new Map(existantes.map((l) => [l.portal, l]));
  const maintenant = new Date();

  // Empreinte de ce qui part en ligne : elle datera l'annonce par son CONTENU,
  // et non par la dernière écriture sur la fiche.
  const empreinte = digestAnnonce({
    price: vehicle.price,
    mileage: vehicle.mileage,
    photoCount: compte(vehicle.images),
    description: vehicle.description,
    features: vehicle.features,
  });

  const operations = [];
  const changes: Portal[] = [];

  for (const portal of portals) {
    const courante = parPortail.get(portal);
    const enLigne = courante?.status === "publie";

    if (action === "publish") {
      if (enLigne) continue; // déjà en ligne : sa date reste intacte
      changes.push(portal);
      operations.push(
        prisma.listing.upsert({
          where: { vehicleId_portal: { vehicleId, portal } },
          create: { vehicleId, portal, status: "publie", publishedAt: maintenant, publishedDigest: empreinte },
          update: { status: "publie", publishedAt: maintenant, publishedDigest: empreinte },
        }),
      );
    } else if (action === "restore") {
      // Retour arrière d'un retrait : le statut revient, la date d'origine reste.
      if (enLigne || !courante) continue;
      changes.push(portal);
      operations.push(
        prisma.listing.update({
          where: { vehicleId_portal: { vehicleId, portal } },
          // Retour arrière d'un retrait : l'empreinte d'origine reste, la fiche
          // n'a pas bougé entre le retrait et son annulation.
          data: { status: "publie" },
        }),
      );
    } else {
      if (!courante || !enLigne) continue;
      changes.push(portal);
      operations.push(
        prisma.listing.update({
          where: { vehicleId_portal: { vehicleId, portal } },
          data: { status: "non_diffuse" },
        }),
      );
    }
  }

  try {
    if (operations.length > 0) await prisma.$transaction(operations);
  } catch {
    return NextResponse.json({ error: "L'enregistrement a échoué." }, { status: 500 });
  }

  // Seuls les portails RÉELLEMENT modifiés reviennent : l'écran s'en sert pour
  // dire ce qui a changé, et le rafraîchissement de la page rapporte le reste.
  return NextResponse.json({ changed: changes });
}
