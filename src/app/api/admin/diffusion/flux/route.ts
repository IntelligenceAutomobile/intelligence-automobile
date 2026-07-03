import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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
    <description>${esc(v.description)}</description>
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
