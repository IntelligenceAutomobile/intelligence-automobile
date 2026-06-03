// One-shot : insère l'Audi TT MK2 2010 dans la base Turso.
// Exécuter depuis la racine du projet : node scripts/seed-audi-tt.mjs
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

const VEHICLE_ID = "audi-tt-mk2-sline-2010";

const FEATURES = JSON.stringify([
  "Freinage refait — disques et plaquettes neufs AV/AR",
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

// 3 paragraphes : P1 + P2 visibles, P3 → badges État & historique (filtré côté frontend)
const DESCRIPTION =
  "Coupé sport 2+2 de la deuxième génération de la série TT, arrêtée définitivement en novembre 2023 sans successeur annoncé. " +
  "Le moteur 2.0 TFSI EA888 délivre 200 ch et 280 Nm de couple, associé à une boîte manuelle 6 rapports.\n\n" +
  "Mise en circulation le 25 mai 2010, kilométrage actuel : 151 042 km — suivi documenté depuis l'origine avec 18 entrées au carnet. " +
  "La finition S-line embarque les jantes 19 pouces, les sièges cuir chauffants et le volant sport cuir.\n\n" +
  "Contrôle technique favorable le 29/01/2026, valide jusqu'au 28/01/2028. " +
  "Pas d'accident déclaré. " +
  "Carnet d'entretien Audi d'origine avec tampons de concessionnaires agréés jusqu'en 2023.";

const IMAGES = JSON.stringify([]); // Photos à ajouter via l'admin

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
      "TT MK2 2.0 TFSI S-line",
      2010,
      151042,
      0,          // ⚠ Prix à définir via /admin/vehicules
      "Ice Silver",
      "Manuelle 6 rapports",
      "Essence",
      200,
      "Allemagne",
      DESCRIPTION,
      FEATURES,
      IMAGES,
      "disponible",
    ],
  });
  console.log("✅ Audi TT MK2 créée en base avec l'ID :", VEHICLE_ID);
  console.log("   ⚠  Définissez le prix via l'interface admin (/admin/vehicules).");
  console.log("   ⚠  Ajoutez les photos via l'interface admin.");
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
