import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const features = [
  // Motorisation hybride
  "Hybride rechargeable (PHEV)",
  "Mode 100% électrique (~50 km d'autonomie)",
  "Chargeur embarqué + câble de charge inclus",
  "Boîte S tronic 6 rapports",
  "Norme Euro 6d : 4,8 L/100 km (mixte)",
  // Extérieur S line
  "Pack S line extérieur",
  "Jantes 18\" alliage S line anthracite",
  "Boucliers avant/arrière S line",
  "Bas de caisse S line",
  "Feux arrière LED",
  // Intérieur & Confort
  "Sièges sport S line cuir partiel noir",
  "Volant sport multifonction cuir S line",
  "Climatisation bi-zone Audi",
  "Navigation MMI",
  "Bluetooth & connectivité smartphone",
  "Régulateur de vitesse adaptatif",
  "Rétroviseurs électriques et chauffants",
  "Démarrage sans clé (Keyless go)",
  // Sécurité
  "Aide au stationnement arrière",
  "Caméra de recul",
  "6 airbags",
  "ESP & ASR",
  "Isofix",
];

const description = `Exceptionnelle Audi A3 Sportback e-tron 1.4 PHEV 204 ch S line importée de Belgique, en excellent état. Revêtue en Gris métallisé, elle associe l'élégance de la finition S line à la modernité d'une motorisation hybride rechargeable, une combinaison aussi rare que pertinente.

Le groupe motopropulseur e-tron conjugue un 4 cylindres 1.4 TFSI et un moteur électrique pour une puissance système de 204 chevaux, transmise via la boîte S tronic. En mode 100% électrique, elle offre jusqu'à 50 km d'autonomie zéro émission, idéal au quotidien. En mode hybride, la consommation tombe à 4,8 L/100 km en cycle mixte.

La finition S line garantit un style sportif affirmé dès le premier regard : boucliers spécifiques, jantes 18" anthracite, bas de caisse et sellerie sport cuir partiel noir avec surpiqûres contrastées.

Véhicule sans accident connu, très bon état mécanique et esthétique, intérieur propre et soigné. Contrôle technique valide (11/2025). Carnet d'entretien complet, 2 propriétaires précédents.

Intelligence Automobile prend en charge l'intégralité des démarches administratives : immatriculation française, expertise, financement et assurance. Essai disponible sur rendez-vous.`;

async function main() {
  const vehicle = await prisma.vehicle.update({
    where: { id: "cmppu3mt30000y8vvqdrmj12s" },
    data: {
      model: "A3 Sportback e-tron 1.4 PHEV S line S tronic",
      year: 2020,
      mileage: 75000,
      fuel: "Hybride",
      power: 204,
      origin: "Belgique",
      description,
      features: JSON.stringify(features),
    },
  });

  console.log("✓ Véhicule mis à jour !");
  console.log(`  Modèle  : ${vehicle.make} ${vehicle.model}`);
  console.log(`  Année   : ${vehicle.year}`);
  console.log(`  Km      : ${vehicle.mileage.toLocaleString("fr-FR")} km`);
  console.log(`  Carbu   : ${vehicle.fuel}`);
  console.log(`  Origine : ${vehicle.origin}`);
  console.log(`  Prix    : ${vehicle.price.toLocaleString("fr-FR")} €`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
