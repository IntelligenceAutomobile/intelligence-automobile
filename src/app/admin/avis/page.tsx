import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { can, asRole } from "@/lib/roles";
import { daysSince, addDays } from "@/lib/relances";
import { blockedByRedList, ajoutsListeRouge } from "@/lib/mailer";
import { etatAvis, lienAvisComptoir, motifAffiche, pretLe, rappelDu, texteSms } from "@/lib/avis";
import { achatsParClient } from "@/lib/avis-server";
import { formatNumber } from "@/lib/format";
import AvisClient from "./AvisClient";
import { type AvisLogView, type AvisTuile, type AvisView } from "./presentation";

/** Origine du site, pour les liens que le client suivra depuis son téléphone. */
async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function AvisPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  // Jour civil de Paris, comme le centre de relances : le runtime tourne en UTC
  // et les deux écrans divergeaient d'un jour en soirée.
  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const debutFenetre = addDays(today, -90);

  const [theme, achats, logs] = await Promise.all([
    prisma.brandTheme.findUnique({ where: { id: "default" }, select: { name: true, reviewLink: true } }),
    achatsParClient(),
    // Journal des gestes : « est-ce que l'invitation est partie ? » se répond
    // ici, y compris pour un client sorti de la liste.
    prisma.avisLog.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
  ]);

  const clients = achats.size
    ? await prisma.client.findMany({
        where: { id: { in: [...achats.keys()] } },
        select: {
          id: true,
          name: true,
          company: true,
          email: true,
          reviewRequestedAt: true,
          reviewCount: true,
          reviewSnoozeUntil: true,
          reviewOutcome: true,
          reviewOutcomeNote: true,
          reviewClickedAt: true,
        },
      })
    : [];

  // Liste rouge : la ligne annonce l'envoi impossible au lieu de le découvrir
  // au clic, comme le fait déjà le centre de relances.
  const ajoutsRouge = await ajoutsListeRouge();

  const rows: AvisView[] = clients.map((c) => {
    const achat = achats.get(c.id);
    const requestedAt = c.reviewRequestedAt;
    const reasonDate = achat?.date ?? "";
    const etat = etatAvis({ requestedAt, reasonDate, outcome: c.reviewOutcome }, today);
    return {
      id: c.id,
      name: c.company || c.name,
      email: c.email,
      kind: achat?.kind ?? "vente",
      reason: achat ? motifAffiche(achat.kind, achat.reason, etat) : "Vente conclue",
      reasonDate,
      vehicle: achat?.vehicle ?? "",
      requestedAt,
      count: c.reviewCount,
      snoozeUntil: c.reviewSnoozeUntil,
      note: c.reviewOutcomeNote,
      clickedAt: c.reviewClickedAt,
      // Une ligne traitée compte depuis son envoi, une ligne à faire depuis l'achat.
      sinceDays: daysSince(requestedAt || reasonDate, today),
      etat,
      readyOn: reasonDate ? pretLe(reasonDate) : "",
      rappelDu: rappelDu({ requestedAt, count: c.reviewCount, snoozeUntil: c.reviewSnoozeUntil }, today),
      blocked: Boolean(c.email) && blockedByRedList(c.email, process.env, ajoutsRouge).length > 0,
    };
  });

  // Les ventes les plus fraîches en tête : c'est là que la demande porte.
  const parAchat = (a: AvisView, b: AvisView) => b.reasonDate.localeCompare(a.reasonDate);
  const parEnvoi = (a: AvisView, b: AvisView) => b.requestedAt.localeCompare(a.requestedAt);

  const prets = rows.filter((r) => r.etat === "pret").sort(parAchat);
  // Les livraisons à venir se rapprochent : la plus proche d'abord.
  const bientot = rows.filter((r) => r.etat === "bientot").sort((a, b) => a.readyOn.localeCompare(b.readyOn));
  const anciennes = rows.filter((r) => r.etat === "ancien").sort(parAchat);
  // Le rappel dû passe devant : c'est la seule ligne du bloc qui appelle un geste.
  const attente = rows
    .filter((r) => r.etat === "attente")
    .sort((a, b) => Number(b.rappelDu) - Number(a.rappelDu) || parEnvoi(a, b));
  const avis = rows.filter((r) => r.etat === "avis").sort(parEnvoi);
  const ecartes = rows.filter((r) => r.etat === "ecarte" || r.etat === "stop").sort(parAchat);

  const journal: AvisLogView[] = logs.map((l) => ({
    id: l.id,
    clientId: l.clientId,
    clientName: l.clientName,
    action: l.action,
    channel: l.channel,
    step: l.step,
    detail: l.detail,
    author: l.author,
    at: l.createdAt.toISOString(),
    href: `/admin/clients/${l.clientId}`,
  }));

  /* ── Les quatre chiffres de tête ── */
  const envois90 = logs.filter(
    (l) => ["invitation", "rappel", "manuel"].includes(l.action) && l.sentDay >= debutFenetre,
  );
  const rappels90 = envois90.filter((l) => l.action === "rappel").length;
  const invites = rows.filter((r) => r.requestedAt).length;
  const ouverts = rows.filter((r) => r.clickedAt).length;
  const tauxClic = invites > 0 ? Math.round((ouverts / invites) * 100) : 0;
  const aFaire = prets.length + anciennes.length;

  const tuiles: AvisTuile[] = [
    {
      cle: "pret",
      label: "Prêts à solliciter",
      valeur: formatNumber(aFaire),
      hint: bientot.length > 0 ? `${formatNumber(bientot.length)} à venir` : "fenêtre de 3 à 60 jours après la livraison",
      filtrable: aFaire > 0,
    },
    {
      cle: "envois",
      label: "Invitations · 90 jours",
      valeur: formatNumber(envois90.length),
      hint: rappels90 > 0 ? `dont ${formatNumber(rappels90)} rappel${rappels90 > 1 ? "s" : ""}` : "invitations et rappels",
    },
    {
      cle: "clics",
      label: "Clics sur le lien",
      valeur: invites > 0 ? `${formatNumber(tauxClic)} %` : "—",
      hint: invites > 0 ? `${formatNumber(ouverts)} pour ${formatNumber(invites)} invitations` : "en attente d'un premier envoi",
    },
    {
      cle: "avis",
      label: "Avis obtenus",
      valeur: formatNumber(avis.length),
      hint: `objectif ${formatNumber(20)}`,
      filtrable: avis.length > 0,
    },
  ];

  /* ── Les supports : QR code, lien court, texte de SMS ── */
  const origin = await siteOrigin();
  const lienComptoir = lienAvisComptoir(origin);
  const marque = theme?.name || "Intelligence Automobile";
  // Le QR se dessine ici, une fois : la page reste servie sans dépendance
  // extérieure, et l'image voyage dans le HTML.
  const qr = await QRCode.toDataURL(lienComptoir, {
    width: 512,
    margin: 1,
    color: { dark: "#070F1E", light: "#FFFFFF" },
  }).catch(() => "");

  // Le bandeau menait tout le monde vers Réglages, page réservée au patron :
  // un vendeur y était renvoyé sans un mot. Il lit désormais à qui s'adresser.
  const peutRegler = can(asRole(session.admin.role), "settings");

  return (
    <AvisClient
      prets={prets}
      bientot={bientot}
      anciennes={anciennes}
      attente={attente}
      avis={avis}
      ecartes={ecartes}
      journal={journal}
      tuiles={tuiles}
      supports={{ lien: lienComptoir, qr, sms: texteSms(marque, "", lienComptoir) }}
      reviewLinkSet={Boolean(theme?.reviewLink)}
      canSettings={peutRegler}
    />
  );
}
