import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { parisDay } from "@/lib/vehicules";
import { tachesDuJour } from "@/lib/crm-taches";
import ClientsClient, { type ClientRow } from "./ClientsClient";

// La page lisait TOUS les clients avec TOUTES leurs opportunités, sans limite,
// et rejouait la requête à chaque déplacement de carte. À quelques dizaines de
// fiches ça passe ; à cinq cents la page met plusieurs secondes et le
// défilement devient poussif. Les deux listes sont donc bornées, et l'écran
// annonce ce qu'il ne montre pas.
const FICHES_AFFICHEES = 60;

export default async function ClientsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const [clients, total, vehicles, taches] = await Promise.all([
    prisma.client.findMany({
      // Tri sur l'activité commerciale réelle, avec repli sur la date de fiche
      // pour les enregistrements d'avant la migration.
      orderBy: [{ lastActivityAt: "desc" }, { updatedAt: "desc" }],
      take: FICHES_AFFICHEES,
      include: {
        leads: {
          orderBy: { updatedAt: "desc" },
          // La date de la carte mesurait le dernier clic et non le dernier
          // échange : déplacer une carte le matin faisait passer pour vivante
          // une affaire sans nouvelles depuis trois semaines. On remonte la date
          // du dernier événement du journal, qui est la seule qui parle.
          include: { events: { take: 1, orderBy: { createdAt: "desc" }, select: { createdAt: true } } },
        },
      },
    }),
    prisma.client.count(),
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, make: true, model: true, year: true },
    }),
    tachesDuJour(),
  ]);

  // Une seule heure de référence pour toute la page, et les ancienneté écrites
  // ici plutôt que dans le navigateur : voir le commentaire de timeAgo.
  const maintenant = new Date();
  const aujourdhui = parisDay(maintenant).toISOString().slice(0, 10);

  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    ago: timeAgo((c.lastActivityAt ?? c.updatedAt).toISOString(), maintenant),
    leads: c.leads.map((l) => {
      const dernierEchange = l.events[0]?.createdAt ?? l.updatedAt;
      return {
        id: l.id,
        title: l.title,
        stage: l.stage,
        source: l.source,
        vehicleId: l.vehicleId,
        budget: l.budget,
        updatedAt: l.updatedAt.toISOString(),
        lastExchangeAgo: timeAgo(dernierEchange.toISOString(), maintenant),
        joursSansEchange: Math.floor((maintenant.getTime() - dernierEchange.getTime()) / 86_400_000),
        // Ancienneté de la dernière écriture, pour les fenêtres « conclu il y a
        // moins de 90 jours » et « gagné sur 30 jours ». Calculée ici : lue dans
        // le rendu, l'heure courante rendrait le composant instable.
        joursDepuisMaj: Math.floor((maintenant.getTime() - l.updatedAt.getTime()) / 86_400_000),
        nextActionAt: l.nextActionAt,
        nextActionLabel: l.nextActionLabel,
        closedAt: l.closedAt,
        lostReason: l.lostReason,
      };
    }),
  }));

  return (
    <ClientsClient clients={rows} vehicles={vehicles} total={total} aujourdhui={aujourdhui} taches={taches} />
  );
}
