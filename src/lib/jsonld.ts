// Objets schema.org du site vitrine.
//
// Ce que Google lit pour comprendre qui nous sommes et ce que vaut chaque fiche.
// Le bloc `AutoDealer` est posé une fois dans le layout racine ; les fiches y
// renvoient par `@id` plutôt que de redécrire le vendeur à chaque annonce.

import { SITE_NAME, SITE_URL } from "@/lib/og";

export const ORG_ID = `${SITE_URL}/#organization`;

const LOGO = `${SITE_URL}/Logo/v9%20Logo%20Sans%20texte.png`;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": ORG_ID,
    name: SITE_NAME,
    legalName: "SASU Intelligence Automobile",
    vatID: "FR08108086646",
    url: SITE_URL,
    logo: LOGO,
    image: `${SITE_URL}/og/accueil.jpg`,
    description:
      "Importateur spécialisé dans la sélection et l'acquisition de véhicules premium en provenance de l'Union européenne.",
    email: "contact@intelligenceautomobile.com",
    telephone: "+33620243879",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Paris",
      postalCode: "75017",
      addressCountry: "FR",
    },
    areaServed: { "@type": "Country", name: "France" },
    priceRange: "€€€",
  };
}

type VehicleLike = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  color: string;
  fuel: string;
  transmission: string;
  power: number | null;
  status: string;
  description: string;
};

const AVAILABILITY: Record<string, string> = {
  disponible: "https://schema.org/InStock",
  reserve: "https://schema.org/LimitedAvailability",
  vendu: "https://schema.org/SoldOut",
};

/** Fiche véhicule : c'est ce bloc qui autorise l'affichage du prix et du
 *  kilométrage directement dans les résultats de recherche. */
export function vehicleJsonLd(v: VehicleLike, images: string[]) {
  const url = `${SITE_URL}/vehicules/${v.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": `${url}/#vehicle`,
    url,
    name: `${v.make} ${v.model} ${v.year}`,
    ...(v.description ? { description: v.description } : {}),
    brand: { "@type": "Brand", name: v.make },
    model: v.model,
    vehicleModelDate: String(v.year),
    productionDate: String(v.year),
    color: v.color,
    fuelType: v.fuel,
    vehicleTransmission: v.transmission,
    itemCondition: "https://schema.org/UsedCondition",
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: v.mileage,
      unitCode: "KMT",
    },
    ...(v.power
      ? {
          vehicleEngine: {
            "@type": "EngineSpecification",
            enginePower: {
              "@type": "QuantitativeValue",
              value: v.power,
              unitText: "ch",
            },
          },
        }
      : {}),
    ...(images.length
      ? { image: images.map((src) => `${SITE_URL}${src}`) }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      price: v.price,
      priceCurrency: "EUR",
      availability: AVAILABILITY[v.status] ?? "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: { "@id": ORG_ID },
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
