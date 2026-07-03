// Diffusion multi-portails — MODULE DE DÉMONSTRATION.
// La « publication » est simulée (aucun portail n'expose d'API publique : le
// chemin réel passe par un flux d'export consommé par un agrégateur type
// Ubiflow, voir /api/admin/diffusion/flux). Les compteurs de vues sont
// synthétiques mais déterministes : ils croissent chaque jour, la démo reste
// cohérente d'une visite à l'autre.

export const PORTALS = ["lacentrale", "leboncoin", "autoscout24", "facebook"] as const;
export type Portal = (typeof PORTALS)[number];

export const PORTAL_LABEL: Record<Portal, string> = {
  lacentrale: "La Centrale",
  leboncoin: "Leboncoin",
  autoscout24: "AutoScout24",
  facebook: "FB Marketplace",
};

// Rythme de vues quotidien de base par portail (réaliste pour du VO premium).
const PORTAL_RATE: Record<Portal, number> = {
  lacentrale: 9,
  leboncoin: 14,
  autoscout24: 6,
  facebook: 4,
};

export function isPortal(v: unknown): v is Portal {
  return typeof v === "string" && (PORTALS as readonly string[]).includes(v);
}

/* Petit hachage stable pour faire varier les rythmes par annonce. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/* Vues simulées d'une annonce sur un portail : croissance quotidienne stable. */
export function simulatedViews(vehicleId: string, portal: Portal, publishedAt: Date | null): number {
  if (!publishedAt) return 0;
  const days = Math.max(0, (Date.now() - publishedAt.getTime()) / 86_400_000);
  const jitter = hash(`${vehicleId}:${portal}`);
  const rate = PORTAL_RATE[portal] + (jitter % 5);
  return Math.floor(days * rate + (jitter % 7));
}
