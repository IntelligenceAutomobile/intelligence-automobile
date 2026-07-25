import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les gabarits Cerfa sont lus au moment de générer le mandat : ils doivent
  // suivre la fonction déployée, sinon la lecture échoue en production.
  outputFileTracingIncludes: {
    "/api/admin/immatriculations/[id]/mandat": ["assets/cerfa/**/*"],
    "/api/admin/immatriculations/[id]/cerfa-13750": ["assets/cerfa/**/*"],
  },
  async redirects() {
    return [
      // Renommage des routes vers des slugs cohérents avec les onglets
      { source: "/aide-vente", destination: "/revente-sur-mesure", permanent: true },
      { source: "/convoyage", destination: "/transport-livraison", permanent: true },
      { source: "/recherche", destination: "/recherche-personnalisee", permanent: true },
      // Anciennes routes -2 → routes canoniques (la version -2 est devenue la version officielle)
      { source: "/vehicules-2", destination: "/vehicules", permanent: true },
      { source: "/recherche-2", destination: "/recherche-personnalisee", permanent: true },
      { source: "/aide-vente-2", destination: "/revente-sur-mesure", permanent: true },
      { source: "/convoyage-2", destination: "/transport-livraison", permanent: true },
      { source: "/methode-2", destination: "/methode", permanent: true },
      { source: "/contact-2", destination: "/contact", permanent: true },
      { source: "/vehicules/:id/v2", destination: "/vehicules/:id", permanent: true },
      // Pages de démo/legacy supprimées
      { source: "/accueil-2", destination: "/", permanent: true },
      { source: "/accueil-3", destination: "/", permanent: true },
      // Démo pro : la route canonique est /demopro (un seul O). On rattrape
      // l'ancienne adresse à 3 O pour ne pas casser un lien déjà partagé.
      { source: "/demoprooo", destination: "/demopro", permanent: false },
      { source: "/demoprooo/:path*", destination: "/demopro/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
