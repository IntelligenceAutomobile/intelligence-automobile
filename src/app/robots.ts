import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/og";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /devis/<jeton> est un document nominatif, /demopro une vitrine de
      // demarchage, /avis/<jeton> une redirection nominative vers Google :
      // aucun des trois n'a sa place dans un moteur de recherche.
      disallow: ["/admin", "/api", "/demopro", "/devis", "/avis"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
