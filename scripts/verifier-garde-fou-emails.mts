// Contrôle du garde-fou d'envoi : mode retenu et adresses refusées.
import { mailMode, blockReason, sendMail } from "../src/lib/mailer";

let ko = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = String(got) === String(want);
  if (!ok) ko++;
  console.log(`${ok ? "ok  " : "KO  "} ${label} -> ${got}${ok ? "" : ` (attendu ${want})`}`);
};

const env = (o: Record<string, string | undefined>) => o as unknown as NodeJS.ProcessEnv;

console.log("-- Mode selon l'environnement --");
check("poste de developpement", mailMode(env({ NODE_ENV: "development" })), "atelier");
check("build local", mailMode(env({ NODE_ENV: "production" })), "live");
check("Vercel production", mailMode(env({ NODE_ENV: "production", VERCEL_ENV: "production" })), "live");
check("Vercel preview", mailMode(env({ NODE_ENV: "production", VERCEL_ENV: "preview" })), "atelier");
check("MAIL_MODE=atelier prime", mailMode(env({ NODE_ENV: "production", VERCEL_ENV: "production", MAIL_MODE: "atelier" })), "atelier");
check("faute de frappe = prudence", mailMode(env({ NODE_ENV: "production", VERCEL_ENV: "production", MAIL_MODE: "LIVEE" })), "atelier");
check("MAIL_MODE=live assume", mailMode(env({ NODE_ENV: "development", MAIL_MODE: "live" })), "live");

const atelier = env({ NODE_ENV: "development" });
const live = env({ NODE_ENV: "production", VERCEL_ENV: "production" });

console.log("\n-- Adresses refusees en atelier --");
for (const a of [
  "achat@transakauto.be",
  "bruxelles@transakauto.com",
  "fabrice.ferrando@gmail.com",
  "cesarvachon@hotmail.fr",
  "contact@intelligence-automobile.fr",
  "client@exemple.fr",
  "m.dubois@transcar.be",
]) {
  check(a, blockReason(a, atelier) !== null, "true");
}

console.log("\n-- Adresses sans destinataire possible : autorisees --");
for (const a of [
  "essai@exemple.invalid",
  "achat@transakauto.invalid",
  "quelquun@example.com",
  "a@b.test",
  "x@sous.domaine.invalid",
]) {
  check(a, blockReason(a, atelier), "null");
}

console.log("\n-- Liste d'exception --");
const permis = env({ NODE_ENV: "development", MAIL_ALLOWLIST: "moi@monagence.fr, autre@ici.fr" });
check("adresse listee", blockReason("moi@monagence.fr", permis), "null");
check("insensible a la casse", blockReason("MOI@MonAgence.FR", permis), "null");
check("voisine refusee", blockReason("toi@monagence.fr", permis) !== null, "true");

console.log("\n-- Un seul destinataire risque suffit a retenir --");
check("liste mixte", blockReason(["essai@exemple.invalid", "achat@transakauto.be"], atelier) !== null, "true");

console.log("\n-- En production, rien ne bloque --");
check("client reel", blockReason("achat@transakauto.be", live), "null");
check("boite perso", blockReason("fabrice.ferrando@gmail.com", live), "null");

// Épreuve du chemin réel : clé d'envoi PRESENTE (factice, donc incapable
// d'expédier quoi que ce soit) et destinataire d'apparence réelle. C'est la
// situation exacte du 28/07. En atelier le message doit être retenu AVANT le
// service ; en live il doit atteindre le service, qui refuse la clé. La
// différence entre les deux prouve que c'est bien le garde-fou qui arrête.
console.log("\n-- Chemin reel, cle factice --");
process.env.RESEND_API_KEY = "re_00000000_faketestkeynotvalid00000";
delete process.env.MAIL_ALLOWLIST;

process.env.MAIL_MODE = "atelier";
const retenu = await sendMail({ to: "achat@transakauto.be", subject: "Epreuve du garde-fou", html: "<p>Rien ne doit partir.</p>" });
check("atelier : retenu", retenu.blocked, "true");
check("atelier : rien d'envoye", retenu.sent, "false");
check("atelier : le service n'est pas appele", retenu.error === undefined, "true");

process.env.MAIL_MODE = "live";
const passe = await sendMail({ to: "achat@transakauto.be", subject: "Epreuve du garde-fou", html: "<p>La cle factice arrete ici.</p>" });
check("live : le garde-fou laisse passer", passe.blocked, "false");
check("live : le service refuse la cle factice", passe.error !== undefined, "true");
check("live : rien d'envoye non plus", passe.sent, "false");
console.log(`     refus du service : ${passe.error}`);

console.log(ko === 0 ? "\nTOUT PASSE" : `\n${ko} ECHEC(S)`);
process.exit(ko === 0 ? 0 : 1);
