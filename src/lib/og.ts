// Métadonnées de partage (Open Graph) des pages vitrines.
//
// Ce que lisent WhatsApp, LinkedIn, Facebook, iMessage et Slack quand on colle
// un lien du site. Deux contraintes à respecter :
//   1. l'image doit rester sous ~600 Ko, sinon WhatsApp ignore l'aperçu ;
//   2. son URL doit être absolue, d'où le `metadataBase` du layout racine, qui
//      préfixe les chemins relatifs passés ici.
//
// Les fichiers /og/*.jpg sont produits par scripts/generate-og-images.mjs à
// partir des héros de chaque page.

import type { Metadata } from "next";

export const SITE_NAME = "Intelligence Automobile";
export const SITE_URL = "https://intelligenceautomobile.fr";

export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  /** Chemin de la page, ex. "/recherche-personnalisee". */
  path: string;
  /** Chemin de l'image de partage, ex. "/og/recherche-personnalisee.jpg". */
  image: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "fr_FR",
      title,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
