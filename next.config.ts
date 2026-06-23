import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Anciennes routes -2 → routes canoniques (la version -2 est devenue la version officielle)
      { source: "/vehicules-2", destination: "/vehicules", permanent: true },
      { source: "/recherche-2", destination: "/recherche", permanent: true },
      { source: "/aide-vente-2", destination: "/aide-vente", permanent: true },
      { source: "/convoyage-2", destination: "/convoyage", permanent: true },
      { source: "/methode-2", destination: "/methode", permanent: true },
      { source: "/contact-2", destination: "/contact", permanent: true },
      { source: "/vehicules/:id/v2", destination: "/vehicules/:id", permanent: true },
      // Pages de démo/legacy supprimées
      { source: "/accueil-2", destination: "/", permanent: true },
      { source: "/accueil-3", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
