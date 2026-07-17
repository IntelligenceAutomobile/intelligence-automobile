import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/og";

// Le sitemap lit la base : sans cette directive Next le figerait au build, et
// les fiches publiées après coup resteraient absentes jusqu'au déploiement suivant.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

const PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: Entry["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/vehicules", priority: 0.9, changeFrequency: "daily" },
  { path: "/recherche-personnalisee", priority: 0.8, changeFrequency: "monthly" },
  { path: "/revente-sur-mesure", priority: 0.8, changeFrequency: "monthly" },
  { path: "/transport-livraison", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/methode", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
  { path: "/cgv", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Même règle que l'accueil et les métadonnées de partage : une fiche masquée
  // reste hors du sitemap, y compris quand elle est encore joignable par URL.
  const vehicles = await prisma.vehicle.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return [
    ...PAGES.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...vehicles.map((v) => ({
      url: `${SITE_URL}/vehicules/${v.id}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
