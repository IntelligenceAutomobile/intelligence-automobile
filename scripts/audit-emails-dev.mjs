// Vérifie qu'aucune adresse joignable ne dort dans la base de développement.
//
// Le mode atelier de src/lib/mailer.ts retient déjà tout message qui pourrait
// atteindre une vraie personne. Ce script est le second regard : il liste les
// adresses présentes dans dev.db et signale celles qui appartiennent à un
// domaine réel. Lancer avec : node scripts/audit-emails-dev.mjs
import { createClient } from "@libsql/client";

const db = createClient({ url: "file:./dev.db" });

// Domaines réservés par les normes : aucun serveur de messagerie derrière.
const RESERVE = /@(?:[a-z0-9-]+\.)*(?:invalid|test|localhost|example)$|@example\.(?:com|net|org)$/i;

const devis = await db.execute(
  "SELECT number, clientName, clientCompany, clientEmail FROM Quote WHERE clientEmail <> '' ORDER BY number",
);
const clients = await db.execute("SELECT name, company, email FROM Client WHERE email <> '' ORDER BY name");

const lignes = [
  ...devis.rows.map((r) => ({ ou: r.number, qui: r.clientCompany || r.clientName, mail: r.clientEmail })),
  ...clients.rows.map((r) => ({ ou: "fiche client", qui: r.company || r.name, mail: r.email })),
];

let reels = 0;
for (const l of lignes) {
  const sur = RESERVE.test(l.mail);
  if (!sur) reels++;
  console.log(`${sur ? "sur  " : "REEL "} ${l.ou} · ${l.qui} · ${l.mail}`);
}

if (reels === 0) {
  console.log(`\nOK : ${lignes.length} adresse(s), aucune joignable.`);
  process.exit(0);
}
console.log(`\n${reels} adresse(s) reelle(s) : un test qui declenche un envoi les viserait.`);
console.log("Remplacez le domaine par .invalid, ou verifiez que MAIL_MODE=atelier est bien dans .env.local.");
process.exit(1);
