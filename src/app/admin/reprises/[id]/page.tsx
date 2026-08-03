import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, asRole } from "@/lib/roles";
import { parisDay } from "@/lib/vehicules";
import { timeAgo } from "@/lib/format";
import { isRepriseStatus } from "@/lib/reprises";

/** Les photos vivent en JSON : une valeur illisible vaut mieux vide qu'en erreur. */
function lirePhotos(brut: string): string[] {
  try {
    const v = JSON.parse(brut || "[]");
    return Array.isArray(v) ? v.filter((u): u is string => typeof u === "string" && u.trim() !== "") : [];
  } catch {
    return [];
  }
}
import RepriseFiche, { type Reprise, type RepriseEventRow } from "./RepriseFiche";

// Fiche d'une estimation. Les valeurs chiffrées descendent en texte : le champ
// accepte « 118 000 » comme « 118000 », et la lecture se fait à l'enregistrement.
export default async function ReprisePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const r = await prisma.reprise.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: "desc" }, take: 40 } },
  });
  if (!r) notFound();

  // Le rattachement au véhicule est une colonne nue : rien ne garantit que la
  // fiche de parc existe encore, et un lien vers le vide se voit tout de suite.
  const vehiculeExiste = r.vehicleId
    ? (await prisma.vehicle.count({ where: { id: r.vehicleId } })) > 0
    : false;

  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const maintenant = new Date();

  const reprise: Reprise = {
    id: r.id,
    reference: r.reference,
    status: isRepriseStatus(r.status) ? r.status : "brouillon",
    clientId: r.clientId,
    leadId: r.leadId,
    vehicleId: r.vehicleId,
    ownerName: r.ownerName,
    ownerCompany: r.ownerCompany,
    ownerEmail: r.ownerEmail,
    ownerPhone: r.ownerPhone,
    make: r.make,
    model: r.model,
    version: r.version,
    year: r.year > 0 ? String(r.year) : "",
    mileageKm: r.mileageKm > 0 ? String(r.mileageKm) : "",
    fuel: r.fuel,
    transmission: r.transmission,
    color: r.color,
    plate: r.plate,
    vin: r.vin,
    firstRegDate: r.firstRegDate,
    ctDate: r.ctDate,
    ctStatus: r.ctStatus,
    owners: r.owners > 0 ? String(r.owners) : "",
    serviceBook: r.serviceBook,
    keys: r.keys > 0 ? String(r.keys) : "",
    creditPending: r.creditPending,
    creditEuros: r.creditCents > 0 ? String(Math.round(r.creditCents / 100)) : "",
    titleInName: r.titleInName,
    condition: r.condition,
    resaleEuros: r.resaleCents > 0 ? String(Math.round(r.resaleCents / 100)) : "",
    reconditionEuros: r.reconditionCents > 0 ? String(Math.round(r.reconditionCents / 100)) : "",
    offerEuros: r.offerCents > 0 ? String(Math.round(r.offerCents / 100)) : "",
    offerDate: r.offerDate,
    validityDays: String(r.validityDays),
    refusalReason: r.refusalReason,
    nextActionAt: r.nextActionAt,
    nextActionLabel: r.nextActionLabel,
    notes: r.notes,
    photos: lirePhotos(r.photos),
  };

  // L'ancienneté est écrite ici, avec une seule heure de référence : calculée
  // dans le navigateur, elle divergeait de celle du serveur et faisait rejeter
  // le sous-arbre à chaque minute qui tournait entre les deux.
  const evenements: RepriseEventRow[] = r.events.map((e) => ({
    id: e.id,
    type: e.type,
    content: e.content,
    author: e.author,
    createdAt: timeAgo(e.createdAt.toISOString(), maintenant),
  }));

  return (
    <RepriseFiche
      reprise={reprise}
      mode="fiche"
      canDelete={can(asRole(session.admin.role), "delete")}
      today={today}
      evenements={evenements}
      vehiculeExiste={vehiculeExiste}
    />
  );
}
