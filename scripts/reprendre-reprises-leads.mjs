// Reprend les estimations déjà enregistrées sous forme d'affaires commerciales.
//
// Avant la table Reprise, une estimation vivait comme un Lead de source
// « reprise », et le détail du véhicule partait en texte libre dans un
// événement de journal. Ce script relit ce texte et en refait des colonnes.
//
// Le texte d'origine est recopié EN ENTIER dans les notes de l'estimation :
// même quand le découpage échoue, rien ne se perd.
//
// Rejouable : une affaire déjà reprise est reconnue par son leadId et sautée.
//
//   node scripts/reprendre-reprises-leads.mjs --dev --dry-run   → lecture seule, dev.db
//   node scripts/reprendre-reprises-leads.mjs --dev             → écrit dans dev.db
//   node scripts/reprendre-reprises-leads.mjs --dry-run         → lecture seule, Turso
//   node scripts/reprendre-reprises-leads.mjs                   → écrit dans Turso
//
// À lancer APRÈS apply-migration-reprises.mjs sur la même base.
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
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

/* ── Lecture du texte laissé par l'ancien module ── */

const CARBURANTS = ["Essence", "Diesel", "Hybride", "Électrique", "GPL"];
const BOITES = ["Manuelle", "Automatique"];

/** « Reprise Audi A3 (2019) » ou « Audi A3 (2019) » → marque, modèle, année. */
function lireVehicule(ligne) {
  const brut = String(ligne || "").replace(/^Reprise\s+/i, "").trim();
  const anneeMatch = brut.match(/\((\d{4})\)\s*$/);
  const year = anneeMatch ? Number(anneeMatch[1]) : 0;
  const sansAnnee = brut.replace(/\s*\(\d{4}\)\s*$/, "").trim();
  const mots = sansAnnee.split(/\s+/).filter(Boolean);
  return {
    make: mots[0] || "",
    model: mots.slice(1).join(" ") || "",
    year: year >= 1950 && year <= new Date().getFullYear() + 1 ? year : 0,
  };
}

/** « 118 000 km · Diesel · Automatique » → kilométrage, énergie, boîte. */
function lireCaracteristiques(ligne) {
  const parts = String(ligne || "").split("·").map((s) => s.trim());
  let mileageKm = 0;
  let fuel = "";
  let transmission = "";
  for (const p of parts) {
    const km = p.match(/^([\d\s  ]+)\s*km$/i);
    if (km) {
      mileageKm = Number(km[1].replace(/[\s  ]/g, "")) || 0;
      continue;
    }
    if (CARBURANTS.includes(p)) fuel = p;
    if (BOITES.includes(p)) transmission = p;
  }
  return { mileageKm, fuel: fuel || "Essence", transmission: transmission || "Manuelle" };
}

/** L'étape du pipeline dit ce qu'est devenue l'estimation. */
function lireStatut(stage) {
  if (stage === "gagne") return "acceptee";
  if (stage === "perdu") return "refusee";
  if (stage === "nouveau") return "brouillon";
  return "proposee";
}

/** Jour YYYY-MM-DD d'une valeur de colonne DATETIME, quelle que soit sa forme. */
function jourDe(valeur) {
  if (valeur == null) return "";
  if (typeof valeur === "number") return new Date(valeur).toISOString().slice(0, 10);
  const s = String(valeur);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/* ── Reprise ── */

const leads = await client.execute(`
  SELECT l.id, l.clientId, l.title, l.stage, l.budget, l.createdAt,
         c.name AS clientName, c.company AS clientCompany,
         c.email AS clientEmail, c.phone AS clientPhone
  FROM Lead l
  LEFT JOIN Client c ON c.id = l.clientId
  WHERE l.source = 'reprise'
  ORDER BY l.createdAt ASC
`);

const dejaRepris = await client.execute(`SELECT leadId FROM Reprise WHERE leadId IS NOT NULL`);
const connus = new Set(dejaRepris.rows.map((r) => r.leadId));

// La numérotation reprend là où la base s'est arrêtée, année par année.
const compteurs = new Map();
const refs = await client.execute(`SELECT reference FROM Reprise`);
for (const r of refs.rows) {
  const m = String(r.reference).match(/^REP-(\d{4})-(\d+)$/);
  if (m) compteurs.set(m[1], Math.max(compteurs.get(m[1]) ?? 0, Number(m[2])));
}
function prochaineReference(annee) {
  const suivant = (compteurs.get(annee) ?? 0) + 1;
  compteurs.set(annee, suivant);
  return `REP-${annee}-${String(suivant).padStart(3, "0")}`;
}

let repris = 0;
let sautes = 0;

for (const l of leads.rows) {
  if (connus.has(l.id)) {
    sautes++;
    continue;
  }

  const events = await client.execute({
    sql: `SELECT type, content, author FROM LeadEvent WHERE leadId = ? ORDER BY createdAt ASC`,
    args: [l.id],
  });
  const note = events.rows.find((e) => e.type === "note")?.content ?? "";
  const auteur = events.rows.find((e) => e.type === "creation")?.author ?? "";
  const lignes = String(note).split("\n").map((s) => s.trim()).filter(Boolean);

  // Le titre écrit par l'ancien module commence toujours par « Reprise ».
  // Un titre saisi à la main (« Estimation de son X3 avant achat ») décrit une
  // intention, pas un véhicule : le découper donnerait « Estimation » pour
  // marque. Dans ce cas la première ligne de la note prend le relais, et à
  // défaut le véhicule reste à préciser sur la fiche.
  const titreDuModule = /^Reprise\s+/i.test(String(l.title ?? ""));
  const parTitre = titreDuModule ? lireVehicule(l.title) : { make: "", model: "", year: 0 };
  const parNote = lignes[0] && !lignes[0].startsWith("État :") ? lireVehicule(lignes[0]) : { make: "", model: "", year: 0 };
  const vehicule = parTitre.make ? parTitre : parNote;
  if (!vehicule.year && parNote.year) vehicule.year = parNote.year;
  const titreOrphelin = !vehicule.make && String(l.title ?? "").trim();

  const ligneCaract = lignes.find((s) => /\d\s*km/i.test(s) || CARBURANTS.some((c) => s.includes(c)));
  const caract = lireCaracteristiques(ligneCaract ?? "");

  const ligneEtat = lignes.find((s) => s.startsWith("État :"));
  const condition = ligneEtat ? ligneEtat.replace(/^État\s*:\s*/, "") : "";

  const jour = jourDe(l.createdAt);
  const annee = jour ? jour.slice(0, 4) : String(new Date().getFullYear());
  const reference = prochaineReference(annee);
  const offerCents = Math.max(0, Math.round(Number(l.budget) || 0)) * 100;

  // Rien ne se perd : le texte d'origine part en entier dans les notes, et un
  // titre qu'on a renoncé à découper y est rappelé en tête.
  const notes = [
    titreOrphelin ? `Objet de l'affaire : ${titreOrphelin}` : "",
    note ? `Repris du journal de l'affaire commerciale :\n${note}` : "",
  ].filter(Boolean).join("\n\n");

  const ligne = {
    id: randomUUID(),
    reference,
    status: lireStatut(l.stage),
    clientId: l.clientId ?? null,
    leadId: l.id,
    ownerName: l.clientName ?? "",
    ownerCompany: l.clientCompany ?? "",
    ownerEmail: l.clientEmail ?? "",
    ownerPhone: l.clientPhone ?? "",
    make: vehicule.make,
    model: vehicule.model,
    year: vehicule.year,
    mileageKm: caract.mileageKm,
    fuel: caract.fuel,
    transmission: caract.transmission,
    condition,
    offerCents,
    offerDate: jour,
    decidedOn: l.stage === "gagne" || l.stage === "perdu" ? jour : "",
    notes,
    author: auteur,
    createdAt: jourDe(l.createdAt) ? String(l.createdAt) : new Date().toISOString(),
  };

  const vehiculeLu = `${ligne.make} ${ligne.model}`.trim() || "véhicule à préciser sur la fiche";
  console.log(
    `${dryRun ? "verrait" : "reprend"}  ${reference}  ${vehiculeLu}` +
    `${ligne.year ? ` (${ligne.year})` : ""}  ${ligne.mileageKm ? `${ligne.mileageKm} km  ` : ""}` +
    `${offerCents ? `${Math.round(offerCents / 100)} €  ` : ""}${ligne.status}`,
  );

  if (!dryRun) {
    // updatedAt manque de valeur par défaut, volontairement : Prisma la pose à
    // chaque écriture, et un défaut ferait diverger la base du schéma. Un INSERT
    // direct doit donc la fournir lui-même.
    const maintenant = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO Reprise (
              id, reference, status, clientId, leadId,
              ownerName, ownerCompany, ownerEmail, ownerPhone,
              make, model, year, mileageKm, fuel, transmission,
              condition, offerCents, offerDate, decidedOn, notes, author,
              createdAt, updatedAt
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        ligne.id, ligne.reference, ligne.status, ligne.clientId, ligne.leadId,
        ligne.ownerName, ligne.ownerCompany, ligne.ownerEmail, ligne.ownerPhone,
        ligne.make, ligne.model, ligne.year, ligne.mileageKm, ligne.fuel, ligne.transmission,
        ligne.condition, ligne.offerCents, ligne.offerDate, ligne.decidedOn, ligne.notes, ligne.author,
        ligne.createdAt, maintenant,
      ],
    });
    await client.execute({
      sql: `INSERT INTO RepriseEvent (id, repriseId, type, content, author, createdAt) VALUES (?,?,?,?,?,?)`,
      args: [randomUUID(), ligne.id, "creation", "Estimation reprise de l'affaire commerciale", ligne.author, maintenant],
    });
  }
  repris++;
}

console.log(
  `\n${repris} estimation(s) ${dryRun ? "à reprendre" : "reprise(s)"}, ${sautes} déjà en place.`,
);
if (dryRun) console.log("Relancez sans --dry-run pour écrire.");
process.exit(0);
