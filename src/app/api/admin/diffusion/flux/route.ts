import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { normalizeSaleRegime, SALE_REGIME_MENTION } from "@/lib/sale-regime";

// Flux d'export XML du stock publié — la partie RÉELLE de la diffusion :
// c'est ce fichier normalisé qu'un agrégateur de multidiffusion (Ubiflow,
// Spider VO…) consomme pour publier sur les portails souscrits.
function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function parseImages(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string") : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new NextResponse("Non autorisé", { status: 401 });

  const vehicles = await prisma.vehicle.findMany({
    where: { isPublished: true, status: "disponible" },
    orderBy: { createdAt: "desc" },
  });

  const items = vehicles
    .map((v) => {
      const photos = parseImages(v.images)
        .map((u) => `      <photo>${esc(u)}</photo>`)
        .join("\n");
      // Régime de vente : la balise dédiée sert aux portails qui savent la lire,
      // et la mention est recopiée à la fin du texte pour tous les autres, qui
      // n'affichent que la description. Elle doit se voir dans l'annonce, pas
      // seulement sur notre site.
      const regime = normalizeSaleRegime(v.saleRegime);
      const mention = SALE_REGIME_MENTION[regime];
      const description = [v.description, mention].filter(Boolean).join("\n\n");
      return `  <annonce>
    <reference>${esc(v.id)}</reference>
    <marque>${esc(v.make)}</marque>
    <modele>${esc(v.model)}</modele>
    <annee>${v.year}</annee>
    <kilometrage>${v.mileage}</kilometrage>
    <prix devise="EUR">${v.price}</prix>
    <carburant>${esc(v.fuel)}</carburant>
    <boite>${esc(v.transmission)}</boite>
    ${v.power ? `<puissance unite="ch">${v.power}</puissance>` : "<puissance />"}
    <couleur>${esc(v.color)}</couleur>
    <origine>${esc(v.origin)}</origine>
    <regime_vente>${esc(regime)}</regime_vente>
    <description>${esc(description)}</description>
    <photos>
${photos}
    </photos>
  </annonce>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<flux generateur="Intelligence Automobile" genere_le="${new Date().toISOString()}">
${items}
</flux>
`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
