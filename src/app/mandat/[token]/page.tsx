// Page publique d'un mandat : le vendeur l'ouvre depuis son email, sans compte.
// Il lit les quatre pages du contrat telles qu'elles s'imprimeront, puis signe
// en bas : nom tapé, mention approuvée, choix de l'exécution immédiate.
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parisDay } from "@/lib/vehicules";
import { COMPANY } from "@/lib/company";
import {
  MANDAT_TYPE_LABEL, MANDAT_TYPE_DE, echeanceMandat, isMandatStatus, isMandatType,
  mandatVehiculeLabel, type MandatStatus,
} from "@/lib/mandats";
import { formatDateFr } from "@/lib/devis";
import MandatDocument, { type PrintMandat, type Emetteur } from "@/app/admin/mandats/[id]/imprimer/MandatDocument";
import MandatDocumentRecherche from "@/app/admin/mandats/[id]/imprimer/MandatDocumentRecherche";
import MandatDocumentImport from "@/app/admin/mandats/[id]/imprimer/MandatDocumentImport";
import DocAdapte from "@/app/admin/mandats/[id]/imprimer/DocAdapte";
import SignerForm from "./SignerForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await prisma.mandat.findUnique({ where: { publicToken: token }, select: { reference: true } });
  return {
    title: row ? `Mandat ${row.reference}` : "Mandat",
    // Un contrat nominatif reste hors des moteurs de recherche.
    robots: { index: false, follow: false },
  };
}

export default async function MandatPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await prisma.mandat.findUnique({ where: { publicToken: token } });
  if (!row) notFound();

  // Suivi de lecture : la première ouverture dit au mandataire que le contrat
  // est arrivé sous les yeux du vendeur.
  await prisma.mandat.update({
    where: { id: row.id },
    data: {
      viewCount: { increment: 1 },
      ...(row.firstViewedAt ? {} : { firstViewedAt: new Date().toISOString() }),
    },
  });

  const emetteur: Emetteur = {
    name: COMPANY.legalName,
    address: COMPANY.addressLines.join("\n"),
    representative: COMPANY.representative,
    email: COMPANY.email,
    phone: COMPANY.phone,
    siret: COMPANY.siret,
    tva: COMPANY.tvaNumber,
  };

  const m: PrintMandat = {
    reference: row.reference,
    createdOn: parisDay(row.createdAt).toISOString().slice(0, 10),
    ownerName: row.ownerName,
    ownerBirthDate: row.ownerBirthDate,
    ownerAddress: row.ownerAddress,
    ownerEmail: row.ownerEmail,
    ownerPhone: row.ownerPhone,
    ownerIdNumber: row.ownerIdNumber,
    rcPolicy: row.rcPolicy,
    rcInsurer: row.rcInsurer,
    make: row.make,
    model: row.model,
    version: row.version,
    power: row.power,
    plate: row.plate,
    vin: row.vin,
    firstRegDate: row.firstRegDate,
    mileageKm: row.mileageKm,
    fuel: row.fuel,
    color: row.color,
    keys: row.keys,
    ctDate: row.ctDate,
    ctStatus: row.ctStatus,
    lastServiceKm: row.lastServiceKm,
    disclosures: row.disclosures,
    priceCents: row.priceCents,
    floorCents: row.floorCents,
    feeFormula: row.feeFormula,
    packCents: row.packCents,
    searchSpec: row.searchSpec,
    budgetCents: row.budgetCents,
    mileageMaxKm: row.mileageMaxKm,
    regMinYear: row.regMinYear,
    listingUrl: row.listingUrl,
    countryOrigin: row.countryOrigin,
    feeCents: row.feeCents,
    startDate: row.startDate,
    durationDays: row.durationDays,
    custody: row.custody,
    custodyDate: row.custodyDate,
    signMode: row.signMode,
    immediateExecution: row.immediateExecution,
    signPlace: row.signPlace,
    signedOn: row.signedOn,
    signerName: row.signerName,
    signedAt: row.signedAt,
    signedIp: row.signedIp,
  };

  const type = isMandatType(row.type) ? row.type : "vente";
  const status: MandatStatus = isMandatStatus(row.status) ? row.status : "brouillon";
  const today = parisDay(new Date()).toISOString().slice(0, 10);
  const e = echeanceMandat(row.startDate, row.durationDays, today);
  // Un mandat encore en préparation attend une signature ; échu avant
  // signature, il demande un contrat à jour plutôt qu'un accord périmé.
  const signe = row.signedAt !== "" || status === "signe";
  const clos = status === "vendu" || status === "retire" || status === "sans_suite" || status === "retracte";
  const expire = !signe && !clos && e !== null && e.expiree;

  return (
    <main style={{ backgroundColor: "#0A1628", minHeight: "100vh", paddingBottom: 64 }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 0" }}>
        <div
          style={{
            color: "#C8D8EE",
            fontFamily: "system-ui, sans-serif",
            padding: "4px 4px 16px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 8,
            fontSize: 13,
          }}
        >
          <span>
            <span style={{ color: "#6B9FEE", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 10, display: "block" }}>
              {MANDAT_TYPE_LABEL[type]}
            </span>
            {row.reference} · {mandatVehiculeLabel(row)}
          </span>
          <span style={{ color: "#7C92B5" }}>
            {signe
              ? `Signé${row.signedOn ? ` le ${formatDateFr(row.signedOn)}` : ""}`
              : "Lisez le contrat, la signature se trouve en bas"}
          </span>
        </div>
      </div>

      <DocAdapte>
        {type === "recherche" ? (
          <MandatDocumentRecherche m={m} emetteur={emetteur} />
        ) : type === "import" ? (
          <MandatDocumentImport m={m} emetteur={emetteur} />
        ) : (
          <MandatDocument m={m} emetteur={emetteur} />
        )}
      </DocAdapte>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>
        <SignerForm
          token={token}
          reference={row.reference}
          typeDe={MANDAT_TYPE_DE[type]}
          vehicule={mandatVehiculeLabel(row)}
          echeance={e ? formatDateFr(e.echeance) : ""}
          immediateExecution={row.immediateExecution}
          signe={signe}
          clos={clos}
          expire={expire}
          signerName={row.signerName}
          signedOn={row.signedOn}
          emitter={COMPANY.brandName}
          emitterEmail={COMPANY.email}
          emitterPhone={COMPANY.phone}
        />
      </div>
    </main>
  );
}
