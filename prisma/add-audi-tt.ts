import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const images = [
  "/Audit%20TT/Voiture%202/Image%20Annonce/Photo%201%20good.png",
  "/Audit%20TT/Voiture%202/Image%20Annonce/Photo%202%20good.png",
  "/Audit%20TT/Voiture%202/Image%20Annonce/Photo%203%20good.png",
  "/Audit%20TT/Voiture%202/Image%20Annonce/Photo%204%20good.png",
  "/Audit%20TT/Voiture%202/Image%20Annonce/Photo%205%20good.png",
  "/Audit%20TT/Voiture%202/Image%20Annonce/Photo%206%20Good.png",
  "/Audit%20TT/Voiture%202/Image%20Annonce/Photo%207%20Good.png",
  "/Audit%20TT/Voiture%202/Image%20Annonce/Photo%208%20good.png",
];

const features = [
  // Extérieur & Jantes
  "Pack S line Competition",
  "Jantes 19\" alliage léger bi-ton anthracite",
  "Spoiler arrière fixe",
  "Diffuseur arrière sport",
  "Échappement sport bi-sorties chromées",
  "Boucliers avant/arrière spécifiques S line",
  "Bas de caisse S line",
  // Éclairage
  "Phares LED matrix Audi",
  "Feux arrière LED",
  "Éclairage ambiance",
  // Intérieur & Confort
  "Audi Virtual Cockpit",
  "Navigation MMI haute résolution",
  "Sièges sport S line en tissu/cuir Alcantara",
  "Climatisation bi-zone",
  "Volant sport multifonction à méplat",
  "Démarrage sans clé (Keyless go)",
  "Rétroviseur intérieur anti-éblouissant automatique",
  // Technologie
  "Bluetooth & connectivité smartphone",
  "Aide au stationnement arrière",
  "Régulateur de vitesse adaptatif",
  "Système audio Bang & Olufsen",
  // Sécurité
  "6 airbags",
  "ESP & ASR",
  "Freins sport Audi",
];

const description = `Exceptionnelle Audi TT Coupé 2.0 TFSI 230 ch S line Competition, importée directement d'Allemagne et proposée en parfait état. Revêtue dans la légendaire teinte Gris Daytona Perlé, cette icône du design automobile allie sportivité pure et élégance allemande avec une cohérence stylistique sans faille.

Le pack S line Competition lui confère un caractère encore plus affirmé : boucliers exclusifs aux grandes prises d'air, jantes 19" bi-ton anthracite, diffuseur arrière sport et double sortie d'échappement chromée — une signature visuelle immédiatement reconnaissable.

À bord, le poste de conduite orienté pilote fascine dès le premier regard : Audi Virtual Cockpit entièrement numérique, navigation MMI, sièges sport S line en Alcantara et volant à méplat enveloppé de cuir fine-grain. Chaque détail a été pensé pour sublimer l'expérience de conduite.

Motorisée par le 4 cylindres 2.0 TFSI de 230 chevaux associé à la boîte S tronic 6 rapports, elle offre des performances vives et un agrément de conduite exceptionnel au quotidien.

Importée avec contrôle technique valide, historique d'entretien complet et sans aucun antécédent de sinistre. Intelligence Automobile prend en charge l'intégralité des démarches administratives : immatriculation française, expertise, financement et assurance. Essai disponible sur rendez-vous.`;

async function main() {
  const vehicle = await prisma.vehicle.create({
    data: {
      make: "Audi",
      model: "TT Coupé 2.0 TFSI S line Competition S tronic",
      year: 2018,
      mileage: 82571,
      price: 29900,
      color: "Gris Daytona Perlé",
      transmission: "Automatique",
      fuel: "Essence",
      power: 230,
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
