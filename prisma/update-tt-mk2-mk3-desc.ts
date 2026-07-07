import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const MK2_FEATURES = JSON.stringify([
  "Freinage refait : disques et plaquettes neufs AV/AR",
  "Kit distribution neuf (déc. 2023)",
  "Jantes alliage 19 pouces S-line",
  "Sièges cuir chauffants",
  "Volant sport cuir S-line",
  "Pack S-line extérieur complet",
  "Boîte manuelle 6 rapports",
  "Climatisation automatique",
  "Pédalier aluminium sport",
  "Ordinateur de bord",
  "Lève-vitres électriques",
  "Verrouillage centralisé",
  "Rétroviseurs électriques",
  "Vitre arrière chauffante",
  "Cache-bagages d'origine",
  "Phares antibrouillard",
  "Antidémarrage électronique",
  "ESP (stabilité électronique)",
  "ABS + assistance freinage",
  "Airbags conducteur / passager / latéraux",
  "Norme Euro 5",
]);

const MK2_DESCRIPTION =
  "Coupé sport 2+2 de la deuxième génération de la série TT, arrêtée définitivement en novembre 2023 sans successeur annoncé. " +
  "Le moteur 2.0 TFSI EA888 délivre 200 ch et 280 Nm de couple, associé à une boîte manuelle 6 rapports.\n\n" +
  "Mise en circulation le 25 mai 2010, kilométrage actuel : 151 042 km, suivi documenté depuis l'origine avec 18 entrées au carnet. " +
  "La finition S-line embarque les jantes 19 pouces, les sièges cuir chauffants et le volant sport cuir.\n\n" +
  "Contrôle technique favorable le 29/01/2026, valide jusqu'au 28/01/2028. " +
  "Pas d'accident déclaré. " +
  "Carnet d'entretien Audi d'origine avec tampons de concessionnaires agréés jusqu'en 2023.";

const MK3_FEATURES = JSON.stringify([
  "Virtual Cockpit : instrumentation numérique 12.3\"",
  "Apple CarPlay intégré",
  "Pack S line extérieur complet",
  "Seuils de portes S line aluminium",
  "Jantes alliage 19\" multi-branches",
  "Sellerie alcantara/cuir",
  "S tronic 7 rapports",
  "Transmission intégrale quattro (Haldex)",
  "Freinage Haldex révisé (fév. 2026)",
  "Bougies neuves (fév. 2026)",
  "Batterie VARTA AGM neuve (mars 2025)",
  "Climatisation automatique",
  "Feux LED",
  "Régulateur de vitesse",
  "Rétroviseurs électriques rabattables",
  "Aide au stationnement arrière",
  "ESP + ASR",
  "Airbags conducteur / passager / latéraux",
  "Norme Euro 6",
]);

const MK3_DESCRIPTION =
  "Troisième génération du Coupé Audi TT (génération 8S), produite de 2014 à 2023. " +
  "Ce 2.0 TFSI 230 ch couplé à la transmission intégrale quattro et à la boîte S tronic 7 rapports représente la configuration la plus aboutie de la gamme. " +
  "Le Virtual Cockpit (instrumentation 12.3\" entièrement numérique) fait son apparition sur cette génération.\n\n" +
  "Première immatriculation le 17/11/2014 en Belgique. Kilométrage au CT belge (24/04/2026) : 147 005 km. " +
  "Finition S line avec seuils de portes aluminium, jantes 19\" multi-branches et sellerie alcantara/cuir. " +
  "CT belge valide jusqu'au 24/04/2027. Car-Pass belge disponible.\n\n" +
  "Contrôle technique valide jusqu'au 24/04/2027. " +
  "Pas d'accident déclaré. " +
  "Car-Pass belge avec historique complet des kilométrages.";

async function main() {
  await prisma.vehicle.update({
    where: { id: "audi-tt-mk2-sline-2010" },
    data: { description: MK2_DESCRIPTION, features: MK2_FEATURES },
  });
  console.log("✓ Description/équipements Audi TT MK2 (2010) mis à jour.");

  await prisma.vehicle.update({
    where: { id: "audi-tt-mk3-sline-2014" },
    data: { description: MK3_DESCRIPTION, features: MK3_FEATURES },
  });
  console.log("✓ Description/équipements Audi TT MK3 (2014) mis à jour.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
