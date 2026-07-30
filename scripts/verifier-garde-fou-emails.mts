// Contrôle du garde-fou d'envoi : mode retenu, liste rouge, adresses refusées.
import { mailMode, blockReason, sendMail, blockedByRedList, LISTE_ROUGE_FIXE } from "../src/lib/mailer";

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
check("emballage dans un tableau", blockReason(["ok@transcar.be", "TransakAuto <achat@transakauto.be>"], live, ["transakauto.be"]) !== null, "true");
check("destinataires refuses, emballage compris",
  blockedByRedList(["ok@transcar.be", "TransakAuto <achat@transakauto.be>"], live, ["transakauto.be"]).length, "1");

console.log("\n-- En production, seule la liste rouge bloque --");
check("boite perso", blockReason("fabrice.ferrando@gmail.com", live), "null");
check("client reel hors liste", blockReason("m.dubois@transcar.be", live), "null");

// La liste appartient à l'utilisateur : elle vit en base (écran Réglages →
// Emails), donc les contrôles la simulent par le paramètre d'ajouts. Le tableau
// épinglé dans le code reste vide, ce qui est le réglage voulu.
const BLOQUE = ["transakauto.be", "transakauto.com"];
const rouge = (to: string | string[], env = live) => blockReason(to, env, BLOQUE);

console.log("\n-- Liste rouge : bloquee EN PRODUCTION aussi --");
check("aucune valeur epinglee dans le code", LISTE_ROUGE_FIXE.length, "0");
for (const a of [
  "achat@transakauto.be",
  "bruxelles@transakauto.com",
  "BRUXELLES@TransakAuto.COM",
  "n.importe.qui@transakauto.be",
  "contact@mail.transakauto.be",
]) {
  check(`${a} refusee en live`, rouge(a) !== null, "true");
}
check("domaine voisin non couvert", rouge("contact@transakauto.be.fr"), "null");
check("nom qui contient seulement le mot", rouge("contact@transakauto-bis.fr"), "null");
check("liste mixte : un seul suffit", rouge(["ok@transcar.be", "achat@transakauto.be"]) !== null, "true");
check("destinataires refuses listes", blockedByRedList(["ok@transcar.be", "achat@transakauto.be"], live, BLOQUE).join(","), "achat@transakauto.be");
check("liste vide : rien n'est bloque", blockReason("achat@transakauto.be", live), "null");

// Un carnet d'adresses colle volontiers « Nom <adresse> ». Cette forme
// traversait la liste rouge et le message partait vraiment.
console.log("\n-- Emballages et formes tordues, en production --");
for (const a of [
  "TransakAuto <achat@transakauto.be>",
  "<achat@transakauto.be>",
  "achat@transakauto.be.",
  "  ACHAT@TransakAuto.BE  ",
  '"Achat" <achat@transakauto.be>',
]) {
  check(`${JSON.stringify(a)} refusee`, rouge(a) !== null, "true");
}
console.log("   -- deux adresses collees dans une seule chaine : refus, pas de devinette --");
for (const a of [
  "achat@transakauto.be, moi@ailleurs.fr",
  "moi@ailleurs.fr, achat@transakauto.be",
  "moi@ailleurs.fr; achat@transakauto.be",
]) {
  check(`${JSON.stringify(a)} refusee`, rouge(a) !== null, "true");
}
check("une adresse simple hors liste passe toujours", rouge("quelquun@transcar.be"), "null");
check("adresse illisible refusee", rouge("pas une adresse") !== null, "true");
check("emballage hors liste : accepte", rouge("Marc Dubois <m.dubois@transcar.be>"), "null");

console.log("\n-- Liste rouge par variable d'environnement --");
const avecEnv = env({ NODE_ENV: "production", VERCEL_ENV: "production", MAIL_BLOCKLIST: "exemple-bloque.fr, precis@ailleurs.fr" });
check("domaine ajoute", blockReason("qui@exemple-bloque.fr", avecEnv) !== null, "true");
check("adresse exacte ajoutee", blockReason("precis@ailleurs.fr", avecEnv) !== null, "true");
check("voisine de l'adresse exacte", blockReason("autre@ailleurs.fr", avecEnv), "null");

console.log("\n-- Liste rouge par ajout d'ecran (parametre) --");
check("ajout pris en compte", blockReason("client@ajoute.fr", live, ["ajoute.fr"]) !== null, "true");
check("liste d'exception ne peut pas ouvrir la porte",
  blockReason("achat@transakauto.be", env({ NODE_ENV: "development", MAIL_ALLOWLIST: "achat@transakauto.be" }), BLOQUE) !== null, "true");

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

// Le cas qui compte : en PRODUCTION, vers un destinataire en liste rouge, le
// message doit être retenu avant même d'atteindre le service d'envoi. La liste
// passe ici par la variable d'environnement, pour que le contrôle ne dépende pas
// du contenu de la base du poste.
process.env.MAIL_MODE = "live";
process.env.MAIL_BLOCKLIST = "transakauto.be";
const rougeLive = await sendMail({ to: "achat@transakauto.be", subject: "Epreuve de la liste rouge", html: "<p>Rien ne doit partir.</p>" });
check("live + liste rouge : retenu", rougeLive.blocked, "true");
check("live + liste rouge : rien d'envoye", rougeLive.sent, "false");
check("live + liste rouge : le service n'est pas appele", rougeLive.error === undefined, "true");
console.log(`     motif : ${rougeLive.reason}`);

// Hors liste rouge, en production, le message atteint bien le service : la
// différence prouve que c'est la liste rouge qui arrête, pas autre chose.
delete process.env.MAIL_BLOCKLIST;
const passe = await sendMail({ to: "quelquun@transcar.be", subject: "Epreuve du garde-fou", html: "<p>La cle factice arrete ici.</p>" });
check("live hors liste : le garde-fou laisse passer", passe.blocked, "false");
check("live hors liste : le service refuse la cle factice", passe.error !== undefined, "true");
check("live hors liste : rien d'envoye non plus", passe.sent, "false");
console.log(`     refus du service : ${passe.error}`);

console.log(ko === 0 ? "\nTOUT PASSE" : `\n${ko} ECHEC(S)`);
process.exit(ko === 0 ? 0 : 1);
