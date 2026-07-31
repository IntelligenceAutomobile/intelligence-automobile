// La file de travail du jour, en tête de la page Clients & leads.
//
// La page répondait « où en sont mes affaires » et jamais « qu'est-ce que je
// fais maintenant » : elle ouvrait sur quatre colonnes de cartes toutes
// équivalentes, qu'il fallait lire en entier pour savoir par quoi commencer.
//
// Quatre sources alimentent la même liste, dont deux vivaient jusqu'ici dans
// des écrans séparés :
//   • les rappels dont le jour est venu ou passé ;
//   • les demandes du site restées sans première réponse ;
//   • les affaires figées au-delà du silence toléré à leur étape ;
//   • les devis envoyés sans réponse, que le centre de relances sait déjà
//     détecter et dont la règle est reprise telle quelle.
import { prisma } from "./prisma";
import { JOURS_SANS_ECHANGE, PIPELINE_STAGES, SOURCES_ENTRANTES, type Stage } from "./crm";
import { relanceDue } from "./relances";
import { parisDay } from "./vehicules";

export type GenreTache = "action" | "entrant" | "fige" | "devis";

export type Tache = {
  id: string;
  genre: GenreTache;
  clientId: string;
  clientNom: string;
  leadId: string;
  /** Ce qu'il y a à faire, en tête de ligne. */
  intitule: string;
  /** Pourquoi cette ligne est là, en une phrase courte. */
  detail: string;
  /** Jours de retard : positif en retard, 0 pour aujourd'hui. */
  retard: number;
};

/** Écart en jours entre deux jours YYYY-MM-DD. */
function ecart(depuis: string, jusqua: string): number {
  return Math.round((Date.parse(`${jusqua}T00:00:00Z`) - Date.parse(`${depuis}T00:00:00Z`)) / 86_400_000);
}

export async function tachesDuJour(): Promise<Tache[]> {
  const aujourdhui = parisDay(new Date()).toISOString().slice(0, 10);
  const maintenant = Date.now();
  const taches: Tache[] = [];

  // ── 1. Les rappels dont le jour est venu ──────────────────────────────────
  const rappels = await prisma.lead.findMany({
    where: { stage: { in: PIPELINE_STAGES }, nextActionAt: { not: "", lte: aujourdhui } },
    select: {
      id: true, title: true, nextActionAt: true, nextActionLabel: true,
      client: { select: { id: true, name: true, company: true } },
    },
    take: 50,
  });
  for (const l of rappels) {
    const retard = ecart(l.nextActionAt, aujourdhui);
    taches.push({
      id: `action-${l.id}`,
      genre: "action",
      clientId: l.client.id,
      clientNom: l.client.company || l.client.name,
      leadId: l.id,
      intitule: l.nextActionLabel || "Action à mener",
      detail: retard > 0 ? `En retard de ${retard} j · ${l.title || "sans objet"}` : l.title || "Sans objet",
      retard,
    });
  }

  // ── 2. Les demandes du site sans première réponse ─────────────────────────
  // Une demande dont le journal ne contient que sa création n'a jamais reçu de
  // réponse. C'est le seul moment où la vitesse change vraiment l'issue.
  const entrants = await prisma.lead.findMany({
    where: {
      stage: "nouveau",
      source: { in: [...SOURCES_ENTRANTES] },
      events: { none: { type: { not: "creation" } } },
    },
    select: {
      id: true, title: true, createdAt: true,
      client: { select: { id: true, name: true, company: true } },
    },
    take: 50,
  });
  for (const l of entrants) {
    const heures = Math.floor((maintenant - l.createdAt.getTime()) / 3_600_000);
    taches.push({
      id: `entrant-${l.id}`,
      genre: "entrant",
      clientId: l.client.id,
      clientNom: l.client.company || l.client.name,
      leadId: l.id,
      intitule: "Répondre à la demande",
      detail:
        heures < 1
          ? `Reçue à l'instant · ${l.title || "demande du site"}`
          : heures < 48
            ? `Reçue il y a ${heures} h · ${l.title || "demande du site"}`
            : `Reçue il y a ${Math.floor(heures / 24)} j · ${l.title || "demande du site"}`,
      // Une demande entrante passe devant tout au-delà de 24 h.
      retard: Math.max(0, Math.floor(heures / 24)),
    });
  }
  const dejaListes = new Set(taches.map((t) => t.leadId));

  // ── 3. Les affaires figées, sans rappel prévu ─────────────────────────────
  const figes = await prisma.lead.findMany({
    where: { stage: { in: PIPELINE_STAGES }, nextActionAt: "" },
    select: {
      id: true, title: true, stage: true, updatedAt: true,
      client: { select: { id: true, name: true, company: true } },
      events: { take: 1, orderBy: { createdAt: "desc" }, select: { createdAt: true } },
    },
    take: 100,
  });
  for (const l of figes) {
    if (dejaListes.has(l.id)) continue;
    const dernier = l.events[0]?.createdAt ?? l.updatedAt;
    const jours = Math.floor((maintenant - dernier.getTime()) / 86_400_000);
    const seuil = JOURS_SANS_ECHANGE[l.stage as Stage] ?? 7;
    if (seuil <= 0 || jours < seuil) continue;
    taches.push({
      id: `fige-${l.id}`,
      genre: "fige",
      clientId: l.client.id,
      clientNom: l.client.company || l.client.name,
      leadId: l.id,
      intitule: "Reprendre contact",
      detail: `${jours} j sans échange · ${l.title || "sans objet"}`,
      retard: jours - seuil,
    });
  }

  // ── 4. Les devis envoyés sans réponse ─────────────────────────────────────
  // Même règle que le centre de relances : les deux files se rejoignent ici.
  // `Quote.clientId` est une simple colonne, sans relation Prisma : le nom vient
  // du document lui-même, qui le fige au moment de l'émission.
  const devis = await prisma.quote.findMany({
    where: { clientId: { not: null }, docType: { not: "facture" }, status: "envoye" },
    select: {
      id: true, number: true, docType: true, status: true, paymentStatus: true,
      issueDate: true, sentAt: true, validityDays: true,
      lastRelanceDate: true, relanceSnoozeUntil: true,
      clientId: true, leadId: true, clientName: true, clientCompany: true,
    },
    take: 100,
  });
  for (const q of devis) {
    if (!q.clientId) continue;
    const due = relanceDue(
      {
        docType: q.docType,
        status: q.status,
        paymentStatus: q.paymentStatus,
        issueDate: q.issueDate,
        sentAt: q.sentAt,
        validityDays: q.validityDays,
        lastRelanceDate: q.lastRelanceDate,
        relanceSnoozeUntil: q.relanceSnoozeUntil,
      },
      aujourdhui,
    );
    if (!due) continue;
    taches.push({
      id: `devis-${q.id}`,
      genre: "devis",
      clientId: q.clientId,
      clientNom: q.clientCompany || q.clientName || "Client",
      leadId: q.leadId ?? "",
      intitule: `Relancer le devis ${q.number}`,
      detail: `${due.sinceDays} j sans réponse`,
      retard: due.sinceDays,
    });
  }

  // Le plus en retard d'abord, puis par ordre de genre pour un affichage stable.
  const rang: Record<GenreTache, number> = { action: 0, entrant: 1, devis: 2, fige: 3 };
  return taches.sort((a, b) => b.retard - a.retard || rang[a.genre] - rang[b.genre] || a.clientNom.localeCompare(b.clientNom));
}
