import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { voitAudience } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { timeAgo } from "@/lib/format";
import {
  APPAREIL_LABEL,
  CANAL_LABEL,
  isPeriode,
  libellePage,
  libelleSrc,
} from "@/lib/audience";

import AudienceClient, {
  type Compteurs,
  type LigneJournal,
  type LigneLien,
  type LignePage,
  type LigneProvenance,
  type Repartition,
} from "./AudienceClient";

// Lignes affichées dans les trois tableaux de synthèse. Au-delà, la lecture
// devient un dépouillement.
const LIGNES_TABLEAU = 12;
// Journal : de quoi voir la dernière heure d'un site qui vit, sans faire de la
// page une liste à faire défiler.
const LIGNES_JOURNAL = 30;

/** Jour de Paris décalé de n jours, au format YYYY-MM-DD. */
function jourAvant(today: string, n: number): string {
  return new Date(Date.parse(`${today}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
}

/** « 2026-08-03 » → « 03/08 ». */
function etiquetteJour(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

/** Heure de Paris d'un instant, « 14:32 ». */
function heureParis(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Part en pourcents, arrondie, avec un plancher à 1 % pour les lignes vues. */
function part(n: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(1, Math.round((n / total) * 100));
}

export default async function AudiencePage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // Écran nominatif : masquer la ligne de menu suffirait à qui ignore l'adresse,
  // la garde se pose donc ici, avant la moindre lecture en base.
  if (!voitAudience(session.admin.email)) redirect("/admin");

  const sp = await searchParams;
  // Paramètre d'URL validé par liste blanche : le lien se partage, mais rien de
  // ce qu'il contient n'atteint la base sans contrôle.
  const periode = isPeriode(sp.periode) ? Number(sp.periode) : 7;

  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const debut = jourAvant(today, periode - 1);
  // Fenêtre précédente de même longueur : c'est elle qui donne l'évolution.
  const debutPrecedent = jourAvant(today, periode * 2 - 1);
  const finPrecedente = jourAvant(today, periode);

  const [
    parJour,
    visites,
    pages,
    visiteurs,
    nouveaux,
    visitesAujourdhui,
    pagesAujourdhui,
    visitesPrecedentes,
    parLien,
    pagesParChemin,
    arriveesParChemin,
    parProvenance,
    parAppareil,
    parCanal,
    journal,
    premiere,
  ] = await Promise.all([
    // Une visite se compte sur sa première page : `isEntry` évite de confondre
    // un visiteur curieux qui ouvre huit fiches avec huit visiteurs.
    prisma.pageView.groupBy({
      by: ["day"],
      where: { day: { gte: debut }, isEntry: true },
      _count: { _all: true },
    }),
    prisma.pageView.count({ where: { day: { gte: debut }, isEntry: true } }),
    prisma.pageView.count({ where: { day: { gte: debut } } }),
    prisma.pageView.groupBy({
      by: ["visitorId"],
      where: { day: { gte: debut }, isEntry: true },
    }),
    prisma.pageView.count({ where: { day: { gte: debut }, isEntry: true, isNew: true } }),
    prisma.pageView.count({ where: { day: today, isEntry: true } }),
    prisma.pageView.count({ where: { day: today } }),
    prisma.pageView.count({
      where: { day: { gte: debutPrecedent, lte: finPrecedente }, isEntry: true },
    }),
    prisma.pageView.groupBy({
      by: ["src"],
      where: { day: { gte: debut }, isEntry: true },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { day: { gte: debut } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { day: { gte: debut }, isEntry: true },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["referrer", "channel"],
      where: { day: { gte: debut }, isEntry: true, referrer: { not: "" } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["device"],
      where: { day: { gte: debut }, isEntry: true },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["channel"],
      where: { day: { gte: debut }, isEntry: true },
      _count: { _all: true },
    }),
    prisma.pageView.findMany({
      orderBy: { createdAt: "desc" },
      take: LIGNES_JOURNAL,
      select: {
        id: true,
        path: true,
        src: true,
        referrer: true,
        channel: true,
        device: true,
        country: true,
        isEntry: true,
        isNew: true,
        createdAt: true,
      },
    }),
    prisma.pageView.findFirst({ orderBy: { createdAt: "asc" }, select: { day: true } }),
  ]);

  /* ── Courbe ──
     Les journées sans visite valent zéro : une courbe qui saute les jours creux
     donne une pente flatteuse et fausse. Au-delà d'un mois, les points se
     regroupent par semaine, sinon les dates se chevauchent sous l'axe. */
  const comptesParJour = new Map(parJour.map((r) => [r.day, r._count._all]));
  const jours: { day: string; valeur: number }[] = [];
  for (let i = periode - 1; i >= 0; i--) {
    const day = jourAvant(today, i);
    jours.push({ day, valeur: comptesParJour.get(day) ?? 0 });
  }

  const parSemaine = periode > 30;
  const courbe: number[] = [];
  const etiquettes: string[] = [];
  if (parSemaine) {
    for (let i = 0; i < jours.length; i += 7) {
      const bloc = jours.slice(i, i + 7);
      courbe.push(bloc.reduce((s, j) => s + j.valeur, 0));
      etiquettes.push(etiquetteJour(bloc[0].day));
    }
  } else {
    jours.forEach((j) => {
      courbe.push(j.valeur);
      etiquettes.push(etiquetteJour(j.day));
    });
  }

  // Sept derniers jours, pour le trait discret des tuiles du haut.
  const spark = jours.slice(-7).map((j) => j.valeur);

  const evolution =
    visitesPrecedentes > 0
      ? Math.round(((visites - visitesPrecedentes) / visitesPrecedentes) * 100)
      : null;

  const compteurs: Compteurs = {
    visites,
    pages,
    visiteurs: visiteurs.length,
    nouveaux,
    visitesAujourdhui,
    pagesAujourdhui,
    evolution,
    spark,
    // « 1,8 page par visite » se lit mieux que le rapport brut. La phrase est
    // écrite ici, accord compris : le composant client se contente d'afficher.
    pagesParVisite:
      visites > 0
        ? `${(pages / visites).toFixed(1).replace(".", ",")} page${pages >= visites * 2 ? "s" : ""} par visite`
        : "En attente des premières visites",
  };

  /* ── Par lien ── */
  const liens: LigneLien[] = parLien
    .map((r) => ({
      src: r.src,
      label: libelleSrc(r.src),
      visites: r._count._all,
      part: part(r._count._all, visites),
      marque: r.src !== "",
    }))
    .sort((a, b) => b.visites - a.visites)
    .slice(0, LIGNES_TABLEAU);

  /* ── Par page ── */
  const arrivees = new Map(arriveesParChemin.map((r) => [r.path, r._count._all]));
  const pagesVues: LignePage[] = pagesParChemin
    .map((r) => ({
      path: r.path,
      label: libellePage(r.path),
      pages: r._count._all,
      arrivees: arrivees.get(r.path) ?? 0,
      part: part(r._count._all, pages),
    }))
    .sort((a, b) => b.pages - a.pages)
    .slice(0, LIGNES_TABLEAU);

  /* ── Provenance ── */
  const provenances: LigneProvenance[] = parProvenance
    .map((r) => ({
      referrer: r.referrer,
      canal: CANAL_LABEL[r.channel] ?? r.channel,
      visites: r._count._all,
      part: part(r._count._all, visites),
    }))
    .sort((a, b) => b.visites - a.visites)
    .slice(0, LIGNES_TABLEAU);

  /* ── Répartitions ── */
  const appareils: Repartition[] = ["mobile", "tablette", "ordinateur"].map((d) => ({
    label: APPAREIL_LABEL[d],
    valeur: parAppareil.find((r) => r.device === d)?._count._all ?? 0,
  }));

  const canaux: Repartition[] = Object.keys(CANAL_LABEL)
    .map((c) => ({
      label: CANAL_LABEL[c],
      valeur: parCanal.find((r) => r.channel === c)?._count._all ?? 0,
    }))
    .filter((c) => c.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur);

  /* ── Journal ──
     L'ancienneté est écrite ici : calculée dans le navigateur, elle diffère de
     celle du serveur dès qu'une minute tourne entre les deux, et React jette
     alors tout le tableau pour le refabriquer. */
  const maintenant = new Date();
  const dernieres: LigneJournal[] = journal.map((v) => ({
    id: v.id,
    heure: heureParis(v.createdAt),
    quand: timeAgo(v.createdAt.toISOString(), maintenant),
    page: libellePage(v.path),
    path: v.path,
    src: v.src ? libelleSrc(v.src) : "",
    origine: v.referrer || CANAL_LABEL[v.channel] || "",
    appareil: APPAREIL_LABEL[v.device] ?? v.device,
    pays: v.country,
    entree: v.isEntry,
    nouveau: v.isNew,
  }));

  return (
    <AudienceClient
      periode={periode}
      compteurs={compteurs}
      courbe={courbe}
      etiquettes={etiquettes}
      parSemaine={parSemaine}
      liens={liens}
      pagesVues={pagesVues}
      provenances={provenances}
      appareils={appareils}
      canaux={canaux}
      dernieres={dernieres}
      depuis={premiere ? etiquetteJour(premiere.day) : ""}
    />
  );
}
