import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCollabSession } from "@/lib/collab-auth";
import { prisma } from "@/lib/prisma";
import { can, asRole, voitMandats } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import { timeAgo } from "@/lib/format";
import { isMandatStatus, isMandatType, lireDocuments } from "@/lib/mandats";
import { REG_STATUS_LABEL, type RegStatus } from "@/lib/immatriculation";
import { formatDateFr } from "@/lib/devis";
import MandatFiche, { type Mandat, type MandatEventRow, type SignatureInfo } from "./MandatFiche";

// Fiche d'un mandat. Les valeurs chiffrées descendent en texte : le champ
// accepte « 15 490 » comme « 15490 », et la lecture se fait à l'enregistrement.
export default async function MandatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // Lancement nominatif du 21 août 2026 : Fab, puis César à 16 h.
  const collabSession = await getCollabSession();
  if (!voitMandats(session.admin.email, collabSession?.name)) redirect("/admin");

  const { id } = await params;
  const m = await prisma.mandat.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: "desc" }, take: 40 } },
  });
  if (!m) notFound();

  // Le rattachement au véhicule est une colonne nue : rien ne garantit que la
  // fiche de stock existe encore, et un lien vers le vide se voit tout de suite.
  const vehiculeExiste = m.vehicleId
    ? (await prisma.vehicle.count({ where: { id: m.vehicleId } })) > 0
    : false;

  // Le dossier d'immatriculation d'un import : même règle de colonne nue.
  const reg = m.registrationId
    ? await prisma.registration.findUnique({
        where: { id: m.registrationId },
        select: { id: true, reference: true, status: true },
      })
    : null;
  const regInfo = reg
    ? {
        id: reg.id,
        reference: reg.reference,
        statusLabel: REG_STATUS_LABEL[reg.status as RegStatus] ?? reg.status,
      }
    : null;

  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const maintenant = new Date();

  const mandat: Mandat = {
    id: m.id,
    reference: m.reference,
    type: isMandatType(m.type) ? m.type : "vente",
    status: isMandatStatus(m.status) ? m.status : "brouillon",
    clientId: m.clientId,
    leadId: m.leadId,
    vehicleId: m.vehicleId,
    ownerName: m.ownerName,
    ownerBirthDate: m.ownerBirthDate,
    ownerAddress: m.ownerAddress,
    ownerEmail: m.ownerEmail,
    ownerPhone: m.ownerPhone,
    ownerIdNumber: m.ownerIdNumber,
    rcPolicy: m.rcPolicy,
    rcInsurer: m.rcInsurer,
    make: m.make,
    model: m.model,
    version: m.version,
    power: m.power,
    plate: m.plate,
    vin: m.vin,
    firstRegDate: m.firstRegDate,
    mileageKm: m.mileageKm > 0 ? String(m.mileageKm) : "",
    fuel: m.fuel,
    color: m.color,
    keys: m.keys > 0 ? String(m.keys) : "",
    ctDate: m.ctDate,
    ctStatus: m.ctStatus,
    lastServiceKm: m.lastServiceKm,
    disclosures: m.disclosures,
    priceEuros: m.priceCents > 0 ? String(Math.round(m.priceCents / 100)) : "",
    floorEuros: m.floorCents > 0 ? String(Math.round(m.floorCents / 100)) : "",
    feeFormula: m.feeFormula,
    packEuros: m.packCents > 0 ? String(Math.round(m.packCents / 100)) : "",
    searchSpec: m.searchSpec,
    budgetEuros: m.budgetCents > 0 ? String(Math.round(m.budgetCents / 100)) : "",
    mileageMaxKm: m.mileageMaxKm > 0 ? String(m.mileageMaxKm) : "",
    regMinYear: m.regMinYear > 0 ? String(m.regMinYear) : "",
    listingUrl: m.listingUrl,
    countryOrigin: m.countryOrigin,
    feeEuros: m.feeCents > 0 ? String(Math.round(m.feeCents / 100)) : "",
    registrationId: m.registrationId,
    startDate: m.startDate,
    durationDays: String(m.durationDays),
    custody: m.custody,
    custodyDate: m.custodyDate,
    signMode: m.signMode,
    immediateExecution: m.immediateExecution,
    signPlace: m.signPlace,
    signedOn: m.signedOn,
    soldOn: m.soldOn,
    soldPriceEuros: m.soldPriceCents > 0 ? String(Math.round(m.soldPriceCents / 100)) : "",
    feeFinalEuros: m.feeFinalCents > 0 ? String(Math.round(m.feeFinalCents / 100)) : "",
    outcomeNote: m.outcomeNote,
    notes: m.notes,
    documents: lireDocuments(m.documents),
  };

  // L'ancienneté est écrite ici, avec une seule heure de référence : calculée
  // dans le navigateur, elle divergerait de celle du serveur.
  const evenements: MandatEventRow[] = m.events.map((e) => ({
    id: e.id,
    type: e.type,
    content: e.content,
    author: e.author,
    createdAt: timeAgo(e.createdAt.toISOString(), maintenant),
  }));

  // L'état de la signature en ligne voyage déjà écrit : dates relatives du
  // serveur, jeton pour recomposer le lien, cachet complet une fois signé.
  const signature: SignatureInfo = {
    sentAt: m.sentAt,
    sentAgo: m.sentAt ? timeAgo(m.sentAt, maintenant) : "",
    firstViewedAgo: m.firstViewedAt ? timeAgo(m.firstViewedAt, maintenant) : "",
    viewCount: m.viewCount,
    token: m.publicToken,
    signerName: m.signerName,
    signedAtFr: m.signedAt
      ? new Date(m.signedAt).toLocaleString("fr-FR", {
          day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
        })
      : m.signedOn
        ? formatDateFr(m.signedOn)
        : "",
    signedIp: m.signedIp,
  };

  return (
    <MandatFiche
      mandat={mandat}
      mode="fiche"
      canDelete={can(asRole(session.admin.role), "delete")}
      today={today}
      evenements={evenements}
      vehiculeExiste={vehiculeExiste}
      signature={signature}
      regInfo={regInfo}
    />
  );
}
