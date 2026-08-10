import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import {
  PORTALS, cheminFiche, controleDiffusion, daysOnline, digestAnnonce, etatPortail,
  FENETRE_ARRIVEES_JOURS, type EtatPortail, type Portal,
} from "@/lib/diffusion";
import { firstImage } from "../ui";
import type { LigneVue } from "./presentation";
import DiffusionClient from "./DiffusionClient";

function compte(json: string): number {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x.trim() !== "").length : 0;
  } catch {
    return 0;
  }
}

export default async function DiffusionPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const vehicles = await prisma.vehicle.findMany({
    where: { isPublished: true, status: { in: ["disponible", "reserve"] } },
    orderBy: { createdAt: "desc" },
  });
  const ids = vehicles.map((v) => v.id);

  // Les annonces des seuls véhicules affichés. Sans ce filtre, toute la table
  // traversait le réseau, y compris les lignes des voitures vendues, masquées
  // ou supprimées, qui ne servent à rien ici.
  //
  // Les ARRIVÉES viennent de la mesure d'audience déjà en production : une
  // visite qui ouvre une fiche depuis un lien marqué ?src=leboncoin. C'est du
  // réel, là où l'écran affichait auparavant une formule.
  const maintenant = new Date().getTime();
  const debut = new Date(maintenant - FENETRE_ARRIVEES_JOURS * 86_400_000);
  const [listings, arrivees] = await Promise.all([
    ids.length
      ? prisma.listing.findMany({
          where: { vehicleId: { in: ids } },
          select: { vehicleId: true, portal: true, status: true, publishedAt: true, publishedDigest: true },
        })
      : Promise.resolve([]),
    ids.length
      ? prisma.pageView.groupBy({
          by: ["path", "src"],
          where: {
            day: { gte: parisDay(debut).toISOString().slice(0, 10) },
            isEntry: true,
            path: { in: ids.map(cheminFiche) },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const parCle = new Map(listings.map((l) => [`${l.vehicleId}:${l.portal}`, l]));

  // Arrivées indexées par fiche : le total, puis le détail des quatre marqueurs
  // que le module Audience reconnaît déjà au caractère près.
  const parFiche = new Map<string, { total: number; parPortail: Record<string, number> }>();
  for (const a of arrivees) {
    const id = a.path.replace("/vehicules/", "");
    const entree = parFiche.get(id) ?? { total: 0, parPortail: {} };
    entree.total += a._count._all;
    if ((PORTALS as readonly string[]).includes(a.src)) {
      entree.parPortail[a.src] = (entree.parPortail[a.src] ?? 0) + a._count._all;
    }
    parFiche.set(id, entree);
  }

  const lignes: LigneVue[] = vehicles.map((v) => {
    // Ce que la fiche dirait si on la publiait maintenant : comparé à ce qui
    // est en ligne, l'écart signale une annonce à republier.
    const empreinte = digestAnnonce({
      price: v.price,
      mileage: v.mileage,
      photoCount: compte(v.images),
      description: v.description,
      features: v.features,
    });

    const etats = {} as Record<Portal, EtatPortail>;
    const dates: number[] = [];
    for (const p of PORTALS) {
      const l = parCle.get(`${v.id}:${p}`);
      const publishedAt = l?.publishedAt ?? null;
      etats[p] = etatPortail(l?.status, l?.publishedDigest ?? "", empreinte);
      if (etats[p] !== "retire" && publishedAt) dates.push(publishedAt.getTime());
    }

    const mesure = parFiche.get(v.id);
    const controle = controleDiffusion({
      photoCount: compte(v.images),
      price: v.price,
      mileage: v.mileage,
      descriptionLength: v.description.trim().length,
      featureCount: compte(v.features),
    });

    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      price: v.price,
      status: v.status,
      image: firstImage(v.images),
      etats,
      joursEnLigne: dates.length ? daysOnline(new Date(Math.min(...dates)), maintenant) : null,
      joursEnStock: daysOnline(v.createdAt, maintenant),
      arrivees: mesure?.total ?? 0,
      arriveesParPortail: (mesure?.parPortail ?? {}) as Record<Portal, number>,
      bloquants: controle.bloquants,
      aSignaler: controle.aSignaler,
      // Le fichier XML sort les seuls véhicules disponibles : une réservation
      // qui part chez un agrégateur repart en ligne pour de bon, faute de
      // balise d'état lue par tous les portails.
      dansLeFlux: v.status === "disponible",
    };
  });

  return <DiffusionClient lignes={lignes} />;
}
