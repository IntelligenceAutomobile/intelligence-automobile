// Offre de reprise imprimable, remise au vendeur. Rendu papier A4, noir sur
// blanc, indépendant du thème du back-office.
//
// Ce papier sort de la maison et le vendeur le montrera peut-être à un
// concurrent : il porte l'en-tête complet de la société, mentions légales
// comprises, et non le seul nom comme le mandat d'immatriculation.
//
// Il tient sur une feuille : le document reste court par construction.
import { formatNumber } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import { formatDateFr } from "@/lib/devis";
import {
  CT_STATUS_LABEL, SERVICE_BOOK_LABEL, repriseLabel, validite,
  isCtStatus, isServiceBook,
} from "@/lib/reprises";

export type PrintReprise = {
  reference: string;
  ownerName: string;
  ownerCompany: string;
  ownerEmail: string;
  ownerPhone: string;
  make: string;
  model: string;
  version: string;
  year: number;
  mileageKm: number;
  fuel: string;
  transmission: string;
  color: string;
  plate: string;
  vin: string;
  firstRegDate: string;
  ctDate: string;
  ctStatus: string;
  owners: number;
  serviceBook: string;
  keys: number;
  creditPending: boolean;
  titleInName: boolean;
  condition: string;
  offerCents: number;
  offerDate: string;
  validityDays: number;
};

export type Emetteur = {
  name: string;
  address: string;
  representative: string;
  email: string;
  phone: string;
  siret: string;
  tva: string;
  footnote: string;
};

const SHEET: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "14mm 15mm",
  backgroundColor: "#fff",
  color: "#111",
  fontSize: "10pt",
  lineHeight: 1.38,
  margin: "0 auto",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: "3px 10px 3px 0", verticalAlign: "top", width: "52mm", color: "#555", fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </td>
      <td style={{ padding: "3px 0", verticalAlign: "top", borderBottom: "1px solid #E4E4E4" }}>{value || "—"}</td>
    </tr>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "10pt", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 6px", paddingBottom: 3, borderBottom: "1.5px solid #111" }}>
      {children}
    </h2>
  );
}

export default function RepriseDocument({
  r, emetteur, today,
}: {
  r: PrintReprise;
  emetteur: Emetteur;
  today: string;
}) {
  const v = validite(r.offerDate, r.validityDays, today);
  const vehicule = repriseLabel(r);
  const vendeur = r.ownerCompany || r.ownerName;
  // Le kilométrage plafond protège l'offre : la voiture roule pendant que le
  // vendeur réfléchit, et 500 km de plus changent la cote.
  const kmPlafond = r.mileageKm > 0 ? r.mileageKm + 1000 : 0;

  return (
    <div className="reprise-screen-bg" style={{ backgroundColor: "#0A1628", padding: "24px 0" }}>
      <div className="reprise-sheet" style={SHEET}>

        {/* En-tête : l'émetteur à gauche, l'objet du papier à droite */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 16 }}>
          <div style={{ maxWidth: "95mm" }}>
            <div style={{ fontSize: "13pt", fontWeight: 600, marginBottom: 4 }}>{emetteur.name}</div>
            <div style={{ fontSize: "9pt", color: "#444", whiteSpace: "pre-line", lineHeight: 1.5 }}>
              {emetteur.address}
            </div>
            <div style={{ fontSize: "9pt", color: "#444", marginTop: 4, lineHeight: 1.5 }}>
              {emetteur.siret && <div>SIRET {emetteur.siret}</div>}
              {emetteur.tva && <div>TVA {emetteur.tva}</div>}
              {emetteur.phone && <div>{emetteur.phone}</div>}
              {emetteur.email && <div>{emetteur.email}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "14pt", fontWeight: 600, letterSpacing: "0.02em" }}>Offre de reprise</div>
            <div style={{ fontSize: "10pt", color: "#444", marginTop: 4 }}>{r.reference}</div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: 2 }}>
              Établie le {formatDateFr(r.offerDate || today)}
            </div>
          </div>
        </div>

        {/* Le montant, mis en scène : c'est la raison d'être du papier */}
        <div
          className="reprise-avoid-break"
          style={{ border: "1.5px solid #111", padding: "11px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}
        >
          <div>
            <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.12em", color: "#555" }}>
              Nous vous rachetons ce véhicule
            </div>
            <div style={{ fontSize: "24pt", fontWeight: 600, lineHeight: 1.05, marginTop: 4 }}>
              {r.offerCents > 0 ? formatEuroCents(r.offerCents) : "—"}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "9.5pt", color: "#444", lineHeight: 1.5 }}>
            {v ? (
              <>
                <div>Offre valable jusqu&apos;au</div>
                <div style={{ fontWeight: 600, color: "#111" }}>{formatDateFr(v.echeance)}</div>
                <div style={{ fontSize: "8.5pt", color: "#666" }}>{r.validityDays} jours</div>
              </>
            ) : (
              <div>Durée de validité à préciser</div>
            )}
          </div>
        </div>

        {/* Le vendeur */}
        <div style={{ marginBottom: 13 }}>
          <Heading>Le vendeur</Heading>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <Row label="Nom" value={vendeur} />
              {r.ownerCompany && r.ownerName && <Row label="Représenté par" value={r.ownerName} />}
              <Row label="Téléphone" value={r.ownerPhone} />
              <Row label="Email" value={r.ownerEmail} />
            </tbody>
          </table>
        </div>

        {/* Le véhicule évalué */}
        <div style={{ marginBottom: 13 }}>
          <Heading>Le véhicule évalué</Heading>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <Row label="Véhicule" value={vehicule} />
              <Row label="Immatriculation" value={r.plate} />
              <Row label="Numéro de série" value={r.vin} />
              <Row label="1re mise en circulation" value={r.firstRegDate ? formatDateFr(r.firstRegDate) : ""} />
              <Row label="Kilométrage relevé" value={r.mileageKm > 0 ? `${formatNumber(r.mileageKm)} km` : ""} />
              <Row label="Énergie et boîte" value={[r.fuel, r.transmission].filter(Boolean).join(" · ")} />
              <Row label="Couleur" value={r.color} />
              <Row
                label="Contrôle technique"
                value={[
                  r.ctDate ? formatDateFr(r.ctDate) : "",
                  isCtStatus(r.ctStatus) ? CT_STATUS_LABEL[r.ctStatus] : "",
                ].filter(Boolean).join(" · ")}
              />
              <Row
                label="Entretien et clés"
                value={[
                  isServiceBook(r.serviceBook) ? SERVICE_BOOK_LABEL[r.serviceBook] : "",
                  r.owners > 0 ? `${r.owners} propriétaire${r.owners > 1 ? "s" : ""}` : "",
                  r.keys > 0 ? `${r.keys} clé${r.keys > 1 ? "s" : ""}` : "",
                ].filter(Boolean).join(" · ")}
              />
            </tbody>
          </table>
        </div>

        {/* L'état retenu */}
        {r.condition && (
          <div style={{ marginBottom: 13 }} className="reprise-avoid-break">
            <Heading>L&apos;état constaté</Heading>
            <p style={{ margin: 0, whiteSpace: "pre-line", fontSize: "10pt" }}>{r.condition}</p>
          </div>
        )}

        {/* Les conditions */}
        <div style={{ marginBottom: 14 }} className="reprise-avoid-break">
          <Heading>Les conditions de l&apos;offre</Heading>
          <ul style={{ margin: 0, paddingLeft: "5mm", fontSize: "9pt", lineHeight: 1.45, listStyle: "disc outside" }}>
            <li>
              Ce prix vaut pour un véhicule conforme à l&apos;état constaté ci-dessus, présenté avec ses
              documents et ses clés.
            </li>
            {kmPlafond > 0 && (
              <li>
                Le kilométrage au jour de la reprise reste inférieur à {formatNumber(kmPlafond)} km.
              </li>
            )}
            <li>
              La cession demande la carte grise barrée, datée et signée par le titulaire, un certificat
              de situation administrative de moins de quinze jours, et un contrôle technique en cours de
              validité.
            </li>
            {r.creditPending && (
              <li>
                Le solde du crédit en cours se règle directement à l&apos;organisme prêteur le jour de
                l&apos;achat, sur présentation du décompte de remboursement.
              </li>
            )}
            {!r.titleInName && (
              <li>
                La carte grise portant le nom d&apos;un tiers, sa signature est requise au moment de la
                cession.
              </li>
            )}
            <li>Le règlement intervient par virement sous 48 heures après la remise du véhicule.</li>
          </ul>
        </div>

        {/* Les signatures */}
        <div
          className="reprise-avoid-break"
          style={{ display: "flex", gap: 14, marginTop: 16 }}
        >
          {[
            { titre: emetteur.name, mention: emetteur.representative },
            { titre: "Le vendeur", mention: `${vendeur}${r.plate ? ` · ${r.plate}` : ""}` },
          ].map((bloc) => (
            <div key={bloc.titre} style={{ flex: 1, border: "1px solid #CFCFCF", padding: "9px 11px", minHeight: "24mm" }}>
              <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.1em", color: "#555" }}>
                {bloc.titre}
              </div>
              {bloc.mention && <div style={{ fontSize: "9pt", color: "#777", marginTop: 2 }}>{bloc.mention}</div>}
              <div style={{ fontSize: "8.5pt", color: "#999", marginTop: 8 }}>Date et signature</div>
            </div>
          ))}
        </div>

        {emetteur.footnote && (
          <p style={{ fontSize: "8pt", color: "#777", marginTop: 12, lineHeight: 1.4 }}>{emetteur.footnote}</p>
        )}
      </div>
    </div>
  );
}
