import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { voitMandats } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { parisDay } from "@/lib/vehicules";
import {
  echeanceMandat, isMandatFilter, isMandatStatus, isMandatType,
  mandatVehiculeLabel, mandatSearchText,
} from "@/lib/mandats";
import MandatsClient, { type MandatRow, type Pilotage } from "./MandatsClient";

// La page charge les 80 mandats les plus récents et annonce le reste, comme
// les reprises : la recherche sert de porte d'entrée bien avant la centième
// ligne.
const LIGNES_AFFICHEES = 80;

// Fenêtre des chiffres de pilotage : assez large pour lisser un mois creux,
// assez courte pour parler de l'activité d'aujourd'hui.
const JOURS_PILOTAGE = 90;

export default async function MandatsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // Lancement nominatif du 21 août 2026 : Fab, puis César à 16 h.
  const collab = await getCollabSession();
  if (!voitMandats(session.admin.email, collab?.name)) redirect("/admin");

  const sp = await searchParams;

  // Jour civil à Paris : le runtime tourne en UTC, et un mandat signé le soir
  // perdrait sinon un jour d'échéance, définitivement.
  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const debutFenetre = new Date(Date.parse(`${today}T00:00:00Z`) - JOURS_PILOTAGE * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [mandats, total, enCours, conclus] = await Promise.all([
    prisma.mandat.findMany({
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      take: LIGNES_AFFICHEES,
      // Les déclarations, notes et pièces restent en base : la liste ne les
      // affiche pas, et les transporter alourdirait chaque chargement.
      select: {
        id: true, reference: true, type: true, status: true, clientId: true,
        make: true, model: true, version: true, plate: true, vin: true,
        ownerName: true, mileageKm: true,
        priceCents: true, floorCents: true,
        startDate: true, durationDays: true, signedOn: true, createdAt: true,
      },
    }),
    prisma.mandat.count(),
    // Les chiffres de pilotage se calculent sur TOUTE la table, jamais sur les
    // 80 lignes chargées.
    prisma.mandat.findMany({
      where: { status: "signe" },
      select: { priceCents: true, startDate: true, durationDays: true },
    }),
    prisma.mandat.findMany({
      where: { decidedOn: { gte: debutFenetre }, status: { in: ["vendu", "retire", "sans_suite", "retracte"] } },
      select: { status: true, soldPriceCents: true, feeFinalCents: true },
    }),
  ]);

  // Une seule heure de référence pour toute la page.
  const maintenant = new Date();

  const lignes: MandatRow[] = mandats.map((m) => {
    const e = echeanceMandat(m.startDate, m.durationDays, today);
    const enExecution = m.status === "signe";
    return {
      id: m.id,
      reference: m.reference,
      type: isMandatType(m.type) ? m.type : "vente",
      status: isMandatStatus(m.status) ? m.status : "brouillon",
      clientId: m.clientId,
      vehicule: mandatVehiculeLabel(m),
      vendeur: m.ownerName,
      plate: m.plate,
      mileageKm: m.mileageKm,
      priceCents: m.priceCents,
      floorCents: m.floorCents,
      signe: m.signedOn !== "",
      // L'échéance voyage déjà calculée : le composant client cesse de faire
      // du métier, et le jour de référence reste celui du serveur.
      expiree: enExecution && e ? e.expiree : false,
      echeanceProche: enExecution && e ? e.proche : false,
      phraseEcheance: e ? e.phrase : "",
      texteRecherche: mandatSearchText(m),
      anciennete: timeAgo((m.startDate ? new Date(`${m.startDate}T12:00:00Z`) : m.createdAt).toISOString(), maintenant),
    };
  });

  let enCoursCents = 0;
  let aEcheance = 0;
  let echus = 0;
  for (const m of enCours) {
    enCoursCents += m.priceCents;
    const e = echeanceMandat(m.startDate, m.durationDays, today);
    if (e?.expiree) {
      echus++;
      aEcheance++;
    } else if (e?.proche) {
      aEcheance++;
    }
  }

  let vendusCents = 0;
  let vendus = 0;
  for (const m of conclus) {
    if (m.status !== "vendu") continue;
    vendus++;
    vendusCents += m.soldPriceCents;
  }

  const pilotage: Pilotage = {
    enCours: enCours.length,
    enCoursCents,
    aEcheance,
    echus,
    vendus,
    vendusCents,
    conclus: conclus.length,
    jours: JOURS_PILOTAGE,
  };

  return (
    <MandatsClient
      mandats={lignes}
      total={total}
      pilotage={pilotage}
      filtreInitial={isMandatFilter(sp.statut) ? sp.statut : "all"}
      rechercheInitiale={typeof sp.q === "string" ? sp.q : ""}
    />
  );
}
