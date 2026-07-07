// One-shot : insère l'Audi TT MK3 2014 dans la base Turso.
// Exécuter depuis la racine du projet : node scripts/seed-audi-tt-mk3.mjs
import { createClient } from "@libsql/client";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const url       = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) { console.error("DATABASE_URL absent du .env"); process.exit(1); }

const client = (url.startsWith("libsql://") || url.startsWith("https://"))
  ? createClient({ url, authToken })
  : createClient({ url });

// ── Données du véhicule ───────────────────────────────────────────────────────

const VEHICLE_ID = "audi-tt-mk3-sline-2014";

const FEATURES = JSON.stringify([
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

// P1 + P2 visibles, P3 → badges État & historique (filtré côté frontend)
const DESCRIPTION =
  "Troisième génération du Coupé Audi TT (génération 8S), produite de 2014 à 2023. " +
  "Ce 2.0 TFSI 230 ch couplé à la transmission intégrale quattro et à la boîte S tronic 7 rapports représente la configuration la plus aboutie de la gamme. " +
  "Le Virtual Cockpit (instrumentation 12.3\" entièrement numérique) fait son apparition sur cette génération.\n\n" +
  "Première immatriculation le 17/11/2014 en Belgique. Kilométrage au CT belge (24/04/2026) : 147 005 km. " +
  "Finition S line avec seuils de portes aluminium, jantes 19\" multi-branches et sellerie alcantara/cuir. " +
  "CT belge valide jusqu'au 24/04/2027. Car-Pass belge disponible.\n\n" +
  "Contrôle technique valide jusqu'au 24/04/2027. " +
  "Pas d'accident déclaré. " +
  "Car-Pass belge avec historique complet des kilométrages.";

const IMAGES = JSON.stringify([
  "/audi-tt-mk3-sline-2014/01-front-34.jpg",
  "/audi-tt-mk3-sline-2014/02-side-profile.jpg",
  "/audi-tt-mk3-sline-2014/03-front.jpg",
  "/audi-tt-mk3-sline-2014/04-rear.jpg",
  "/audi-tt-mk3-sline-2014/05-rear-34.jpg",
  "/audi-tt-mk3-sline-2014/06-side-other.jpg",
  "/audi-tt-mk3-sline-2014/07-front-other.jpg",
  "/audi-tt-mk3-sline-2014/08-rear-other.jpg",
  "/audi-tt-mk3-sline-2014/09-interior.jpg",
  "/audi-tt-mk3-sline-2014/10-seats-door.jpg",
  "/audi-tt-mk3-sline-2014/11-virtual-cockpit.jpg",
  "/audi-tt-mk3-sline-2014/12-wheel.jpg",
  "/audi-tt-mk3-sline-2014/13-sline-badge.jpg",
]);

// ── Insertion ─────────────────────────────────────────────────────────────────

try {
  await client.execute({
    sql: `INSERT INTO "Vehicle"
            (id, make, model, year, mileage, price, color, transmission, fuel,
             power, origin, description, features, images, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [
      VEHICLE_ID,
      "Audi",
      "TT 2.0 TFSI Coupé S line quattro S tronic",
      2014,
      147005,
      0,          // ⚠ Prix à définir via /admin/vehicules
      "Noir Mythos",
      "S tronic 7 rapports",
      "Essence",
      230,
      "Belgique",
      DESCRIPTION,
      FEATURES,
      IMAGES,
      "disponible",
    ],
  });
  console.log("✅ Audi TT MK3 créée en base avec l'ID :", VEHICLE_ID);
  console.log("   ⚠  Définissez le prix via l'interface admin (/admin/vehicules).");
} catch (err) {
  const msg = err?.message ?? String(err);
  if (msg.includes("UNIQUE constraint") || msg.includes("already exists")) {
    console.log("ℹ  Véhicule déjà présent en base — aucune action.");
  } else {
    console.error("❌ Erreur :", msg);
    process.exit(1);
  }
}

client.close();
