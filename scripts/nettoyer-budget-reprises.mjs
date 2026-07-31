// Vide le budget des affaires commerciales nées d'une reprise.
//
// Le prix proposé au vendeur était rangé dans `Lead.budget`, le champ qui sert
// de budget d'achat aux acheteurs. Les deux compteurs de la page Clients
// additionnent ce champ : une reprise à 16 500 € ajoutait 16 500 € au
// « Pipeline en cours », puis les mêmes 16 500 € au « Gagné sur 30 jours ».
// Or cet argent sort de la caisse. Le montant vit désormais sur l'estimation,
// où il a un sens, et le budget redevient disponible pour un vrai budget
// d'achat saisi à la main.
//
// ORDRE IMPORTANT : à lancer APRÈS le déploiement du code qui affiche le
// montant depuis le module Reprises. Lancé avant, il viderait le montant des
// cartes du pipeline pendant la fenêtre où le nouveau module reste absent.
//
//   node scripts/nettoyer-budget-reprises.mjs --dev --dry-run   → lecture seule, dev.db
//   node scripts/nettoyer-budget-reprises.mjs --dev             → écrit dans dev.db
//   node scripts/nettoyer-budget-reprises.mjs --dry-run         → lecture seule, Turso
//   node scripts/nettoyer-budget-reprises.mjs                   → écrit dans Turso
//
// Rejouable : une affaire au budget déjà vide est sautée.
import { createClient } from "@libsql/client";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const dev = process.argv.includes("--dev");
const dryRun = process.argv.includes("--dry-run");

let client;
if (dev) {
  client = createClient({ url: `file:${resolve(__dirname, "../dev.db").replace(/\\/g, "/")}` });
  console.log("Cible : dev.db (poste local)");
} else {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || url.startsWith("file:")) {
    console.error("DATABASE_URL doit pointer sur l'adresse libsql:// de Turso (ou passez --dev).");
    process.exit(1);
  }
  client = createClient({ url, authToken });
  console.log("Cible : Turso (production)");
}
console.log(dryRun ? "Mode : lecture seule, rien ne sera écrit.\n" : "Mode : écriture.\n");

// Seules les affaires effectivement reprises sont touchées : le lien passe par
// la colonne `leadId` de l'estimation, jamais par la seule étiquette de source,
// qui se change à la main depuis la fiche client.
const lignes = await client.execute(`
  SELECT l.id, l.title, l.budget, r.reference, r.offerCents
  FROM Lead l
  JOIN Reprise r ON r.leadId = l.id
  WHERE l.source = 'reprise' AND l.budget IS NOT NULL
  ORDER BY l.createdAt ASC
`);

let vides = 0;
for (const l of lignes.rows) {
  const ecart = Math.abs(Math.round(Number(l.budget) * 100) - Number(l.offerCents));
  const mention = ecart > 100 ? "  (écart avec l'offre de l'estimation, à vérifier)" : "";
  console.log(
    `${dryRun ? "viderait" : "vide    "}  ${l.reference}  budget ${l.budget} €  →  l'offre vit sur l'estimation${mention}`,
  );
  if (!dryRun) {
    await client.execute({ sql: "UPDATE Lead SET budget = NULL WHERE id = ?", args: [l.id] });
  }
  vides++;
}

console.log(`\n${vides} affaire(s) ${dryRun ? "à nettoyer" : "nettoyée(s)"}.`);
if (dryRun) console.log("Relancez sans --dry-run pour écrire.");
if (!dryRun && vides > 0) {
  console.log("Les compteurs « Pipeline en cours » et « Gagné sur 30 jours » de la page Clients redeviennent justes.");
}
process.exit(0);
