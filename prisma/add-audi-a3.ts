import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const images = [
  "/Audi%20TT%202/1%20good.png",
  "/Audi%20TT%202/2.jpg",
  "/Audi%20TT%202/3.jpg",
  "/Audi%20TT%202/4.jpg",
  "/Audi%20TT%202/5.jpg",
  "/Audi%20TT%202/6.jpg",
  "/Audi%20TT%202/7.jpg",
  "/Audi%20TT%202/8.jpg",
  "/Audi%20TT%202/10.jpg",
  "/Audi%20TT%202/11.jpg",
  "/Audi%20TT%202/12.jpg",
];

const features = [
  // Extérieur
  "Pack S line extérieur",
  "Jantes 18\" alliage S line anthracite",
  "Boucliers avant/arrière S line",
  "Bas de caisse S line",
  "Feux arrière LED",
  "Phares bi-xénon avec lave-phares",
  // Intérieur & Confort
  "Sièges sport S line tissu/cuir",
  "Volant sport multifonction cuir S line",
  "Climatisation bi-zone Audi",
  "Navigation MMI",
  "Bluetooth & connectivité smartphone",
  "Régulateur de vitesse adaptatif",
  "Rétroviseurs électriques et chauffants",
  "Démarrage sans clé (Keyless go)",
  // Technologie & Sécurité
  "Aide au stationnement arrière",
  "Caméra de recul",
  "6 airbags",
  "ESP & ASR",
  "Isofix",
];

const description = `Élégante Audi A3 Sportback 2.0 TDI 150 ch S line importée d'Allemagne, en excellent état général. Revêtue dans la teinte Gris Daytona Perlé, elle allie le style affirmé du pack S line à la polyvalence du Sportback 5 portes, un équilibre rare entre sportivité et praticité au quotidien.

Le pack S line lui confère une signature visuelle immédiatement reconnaissable : boucliers spécifiques, jantes 18" anthracite, bas de caisse et sellerie sport avec surpiqûres contrastées. L'intérieur soigné offre une ambiance premium dès la montée à bord.

Motorisée par le robuste 4 cylindres 2.0 TDI de 150 chevaux couplé à la boîte S tronic 6 rapports, elle conjugue performances dynamiques et consommation maîtrisée, idéale pour les longs trajets comme pour la ville.

Historique d'entretien complet, contrôle technique valide, sans antécédent de sinistre. Intelligence Automobile prend en charge l'intégralité des démarches administratives : immatriculation française, expertise, financement et assurance. Essai disponible sur rendez-vous.`;

async function main() {
  const vehicle = await prisma.vehicle.create({
    data: {
      make: "Audi",
      model: "A3 Sportback 2.0 TDI 150 S line S tronic",
      year: 2018,
      mileage: 68400,
      price: 21900,
      color: "Gris Daytona Perlé",
      transmission: "Automatique",
      fuel: "Diesel",
      power: 150,
      origin: "Allemagne",
      status: "disponible",
      description,
      features: JSON.stringify(features),
      images: JSON.stringify(images),
    },
  });

  console.log("✓ Véhicule créé avec succès !");
  console.log(`  ID      : ${vehicle.id}`);
  console.log(`  Modèle  : ${vehicle.make} ${vehicle.model}`);
  console.log(`  Année   : ${vehicle.year}`);
  console.log(`  Prix    : ${vehicle.price.toLocaleString("fr-FR")} €`);
  console.log(`  Images  : ${images.length} photo(s)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
