// Met à jour l'annonce Audi TT MK2 : images + équipements complets
// node scripts/update-audi-tt-mk2-photos.mjs
import { createClient } from "@libsql/client";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const url       = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) { console.error("DATABASE_URL absent"); process.exit(1); }

const client = (url.startsWith("libsql://") || url.startsWith("https://"))
  ? createClient({ url, authToken })
  : createClient({ url });

const BASE = "/Audi TT 3/Audi TT 2.0 TFSI 200 S-Line GV-059-QZ";

const IMAGES = JSON.stringify([
  `${BASE}/1.jpg`,
  `${BASE}/2.jpg`,
  `${BASE}/3.jpg`,
  `${BASE}/4.jpeg`,
  `${BASE}/6.jpeg`,
  `${BASE}/8.jpeg`,
  `${BASE}/10.jpeg`,
  `${BASE}/14.jpeg`,
]);

const FEATURES = JSON.stringify([
  // Frais récents
  "Disques avant neufs",
  "Plaquettes avant neuves",
  "Disques arrière neufs",
  "Plaquettes arrière neuves",
  "Pneus avant récents",
  // Extérieur
  "Becquet arrière S-line",
  "Jantes alliage léger 19 pouces",
  "Rétroviseurs extérieurs électriques",
  // Intérieur
  "Cache-bagages d'origine",
  "Climatisation automatique",
  "Indicateur de température extérieur",
  "Levier de vitesses en cuir",
  "Lève-vitres électriques AV/AR",
  "Ordinateur de bord",
  "Système information conducteur",
  "Vitre arrière chauffante",
  "Volant sport en cuir",
  // Pack
  "Antidémarrage électronique",
  "Assistance de freinage",
  "Sièges chauffants en cuir",
  "Système Check-control",
  "Verrouillage centralisé télécommandé",
  // Sécurité
  "Airbag conducteur",
  "Airbags latéraux conducteur et passager",
  "Airbag passager",
  "Contrôle de traction",
  "Contrôle pression pneus (RDC)",
  "ESP (programme de stabilité électronique)",
  "Phares antibrouillard",
  "ABS (système anti-blocage)",
  // Autres
  "Volant réglable manuellement",
  "Oeillets de fixation",
]);

const DESCRIPTION =
  "Coupé sport 2+2 de la deuxième génération de la série TT, arrêtée définitivement en novembre 2023 sans successeur annoncé. " +
  "Le moteur 2.0 TFSI EA888 délivre 200 ch et 280 Nm de couple, associé à une boîte manuelle 6 rapports.\n\n" +
  "Mise en circulation le 25 mai 2010. " +
  "Carnet d'entretien à jour, contrôle technique OK, entretien suivi. " +
  "La finition S-line embarque les jantes 19 pouces, les sièges cuir chauffants et le volant sport cuir.\n\n" +
  "Freinage entièrement refait : disques et plaquettes neufs avant et arrière, pneus avant récents. " +
  "Pas d'accident déclaré.";

try {
  await client.execute({
    sql: `UPDATE "Vehicle"
          SET images = ?, features = ?, description = ?, updatedAt = datetime('now')
          WHERE id = ?`,
    args: [IMAGES, FEATURES, DESCRIPTION, "audi-tt-mk2-sline-2010"],
  });
  console.log("✅ Audi TT MK2 mise à jour — images, équipements et description.");
} catch (err) {
  console.error("❌ Erreur :", err?.message ?? err);
  process.exit(1);
}

client.close();
