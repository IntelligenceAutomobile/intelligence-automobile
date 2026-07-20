// Documents imprimables d'un dossier d'immatriculation : mandat à faire signer
// par le client, puis fiche récapitulative pour la saisie et le dossier papier.
// Rendu papier A4, en noir sur blanc, indépendant du thème du back-office.
import { formatNumber } from "@/lib/format";
import { formatDateFr } from "@/lib/devis";
import {
  REG_TYPE_LABEL, VAT_REGIME_LABEL, checklistFor, deadlines,
  ARCHIVE_RETENTION_YEARS, type RegType, type VatRegime,
} from "@/lib/immatriculation";

export type PrintDossier = {
  reference: string;
  type: RegType;
  vehicleLabel: string;
  vin: string;
  plateForeign: string;
  plateFinal: string;
  countryOrigin: string;
  firstRegDate: string;
  mileageKm: number;
  holderName: string;
  holderAddress: string;
  acquiredOn: string;
  deliveredOn: string;
  registeredOn: string;
  vatRegime: VatRegime;
  quitusRef: string;
  quitusDate: string;
  sivRef: string;
  documents: string[];
  notes: string;
};

const SHEET: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "18mm 16mm",
  backgroundColor: "#fff",
  color: "#111",
  fontSize: "10.5pt",
  lineHeight: 1.45,
  margin: "0 auto",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: "5px 10px 5px 0", verticalAlign: "top", width: "48mm", color: "#555", fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </td>
      <td style={{ padding: "5px 0", verticalAlign: "top", borderBottom: "1px solid #E4E4E4" }}>{value || "—"}</td>
    </tr>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "10pt", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px", paddingBottom: 4, borderBottom: "1.5px solid #111" }}>
      {children}
    </h2>
  );
}

export default function DossierDocument({ d, emitter, today }: { d: PrintDossier; emitter: string; today: string }) {
  const specs = checklistFor(d.type, d.vatRegime);
  const provided = new Set(d.documents);
  const dls = deadlines(
    { type: d.type, acquiredOn: d.acquiredOn, deliveredOn: d.deliveredOn, registeredOn: d.registeredOn, quitusDate: d.quitusDate },
    today,
  );

  const vehicleLine = [d.vehicleLabel, d.vin ? `VIN ${d.vin}` : "", d.plateForeign ? `immatriculé ${d.plateForeign}` : ""]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="dossier-screen-bg" style={{ backgroundColor: "#2A3244", padding: "24px 0" }}>
      {/* ── Feuille 1 : mandat à signer ── */}
      <section className="dossier-sheet" style={SHEET}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: "12pt", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{emitter}</div>
            <div style={{ fontSize: "9pt", color: "#555", marginTop: 2 }}>Professionnel habilité au SIV</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "9pt", color: "#555" }}>
            <div>Dossier {d.reference}</div>
            <div>{formatDateFr(today)}</div>
          </div>
        </header>

        <h1 style={{ fontSize: "15pt", margin: "0 0 4px", letterSpacing: "0.02em" }}>Mandat d&apos;immatriculation</h1>
        <p style={{ fontSize: "9.5pt", color: "#555", margin: "0 0 22px" }}>
          Autorisation d&apos;accomplir les démarches d&apos;immatriculation par télétransmission dans le SIV
        </p>

        <Heading>Le mandant</Heading>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 22 }}>
          <tbody>
            <Row label="Nom et prénom" value={d.holderName} />
            <Row label="Adresse" value={d.holderAddress} />
          </tbody>
        </table>

        <Heading>Le véhicule</Heading>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 22 }}>
          <tbody>
            <Row label="Désignation" value={d.vehicleLabel} />
            <Row label="Numéro de série (VIN)" value={d.vin} />
            <Row label="Immatriculation d'origine" value={d.plateForeign} />
            <Row label="Pays de provenance" value={d.countryOrigin} />
            <Row label="1re mise en circulation" value={d.firstRegDate ? formatDateFr(d.firstRegDate) : ""} />
          </tbody>
        </table>

        <Heading>Objet du mandat</Heading>
        <p style={{ margin: "0 0 10px", textAlign: "justify" }}>
          Le mandant donne pouvoir à <strong>{emitter}</strong>, professionnel habilité à télétransmettre dans le Système
          d&apos;Immatriculation des Véhicules, à l&apos;effet d&apos;accomplir en son nom la démarche suivante :{" "}
          <strong>{REG_TYPE_LABEL[d.type].toLowerCase()}</strong> pour le véhicule désigné ci-dessus.
        </p>
        <p style={{ margin: "0 0 10px", textAlign: "justify" }}>
          Ce pouvoir couvre la constitution du dossier, la transmission des pièces justificatives, la déclaration des
          informations auprès de l&apos;administration et, le cas échéant, le règlement des taxes et redevances dues au titre du
          certificat d&apos;immatriculation.
        </p>
        <p style={{ margin: "0 0 26px", textAlign: "justify" }}>
          Le mandant certifie l&apos;exactitude des informations communiquées et reconnaît demeurer responsable de leur
          sincérité. Le présent mandat prend fin à la délivrance du certificat d&apos;immatriculation.
        </p>

        <Heading>Pièces remises par le mandant</Heading>
        <ul style={{ margin: "0 0 26px", paddingLeft: 16 }}>
          {specs.map((s) => (
            <li key={s.key} style={{ marginBottom: 3 }}>
              <span style={{ display: "inline-block", width: 12 }}>{provided.has(s.key) ? "☑" : "☐"}</span>
              {s.label}
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", gap: "16mm", marginTop: 8 }} className="dossier-avoid-break">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "9pt", color: "#555", marginBottom: 2 }}>Le mandant</div>
            <div style={{ fontSize: "8.5pt", color: "#777", marginBottom: 4 }}>Précédé de la mention « bon pour pouvoir »</div>
            <div style={{ height: "26mm", border: "1px solid #CFCFCF" }} />
            <div style={{ fontSize: "8.5pt", color: "#777", marginTop: 4 }}>{d.holderName || "Nom, date et signature"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "9pt", color: "#555", marginBottom: 2 }}>Le mandataire</div>
            <div style={{ fontSize: "8.5pt", color: "#777", marginBottom: 4 }}>Cachet de l&apos;établissement</div>
            <div style={{ height: "26mm", border: "1px solid #CFCFCF" }} />
            <div style={{ fontSize: "8.5pt", color: "#777", marginTop: 4 }}>{emitter}</div>
          </div>
        </div>
      </section>

      {/* ── Feuille 2 : récapitulatif du dossier ── */}
      <section className="dossier-sheet" style={{ ...SHEET, marginTop: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: "14pt", margin: 0 }}>Récapitulatif du dossier</h1>
            <div style={{ fontSize: "9.5pt", color: "#555", marginTop: 2 }}>
              {d.reference} · {REG_TYPE_LABEL[d.type]}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "9pt", color: "#555" }}>
            <div>{emitter}</div>
            <div>{formatDateFr(today)}</div>
          </div>
        </header>

        <Heading>Véhicule</Heading>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <tbody>
            <Row label="Désignation" value={vehicleLine} />
            <Row label="Pays de provenance" value={d.countryOrigin} />
            <Row label="1re mise en circulation" value={d.firstRegDate ? formatDateFr(d.firstRegDate) : ""} />
            <Row label="Kilométrage à l'acquisition" value={d.mileageKm > 0 ? `${formatNumber(d.mileageKm)} km` : ""} />
            <Row label="Immatriculation française" value={d.plateFinal} />
          </tbody>
        </table>

        <Heading>Titulaire</Heading>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <tbody>
            <Row label="Nom" value={d.holderName} />
            <Row label="Adresse" value={d.holderAddress} />
          </tbody>
        </table>

        <Heading>Situation fiscale et administrative</Heading>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <tbody>
            <Row label="Régime" value={VAT_REGIME_LABEL[d.vatRegime]} />
            <Row label="Date d'acquisition" value={d.acquiredOn ? formatDateFr(d.acquiredOn) : ""} />
            <Row label="Date de livraison" value={d.deliveredOn ? formatDateFr(d.deliveredOn) : ""} />
            <Row label="Quitus fiscal" value={[d.quitusRef, d.quitusDate ? `du ${formatDateFr(d.quitusDate)}` : ""].filter(Boolean).join(" ")} />
            <Row label="Dossier SIV" value={d.sivRef} />
            <Row label="Date d'immatriculation" value={d.registeredOn ? formatDateFr(d.registeredOn) : ""} />
          </tbody>
        </table>

        {dls.length > 0 && (
          <>
            <Heading>Échéances</Heading>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <tbody>
                {dls.map((x) => (
                  <Row key={x.key} label={x.label} value={formatDateFr(x.date)} />
                ))}
              </tbody>
            </table>
          </>
        )}

        <Heading>Pièces du dossier</Heading>
        <ul style={{ margin: "0 0 20px", paddingLeft: 16 }}>
          {specs.map((s) => (
            <li key={s.key} style={{ marginBottom: 3 }}>
              <span style={{ display: "inline-block", width: 12 }}>{provided.has(s.key) ? "☑" : "☐"}</span>
              {s.label}
            </li>
          ))}
        </ul>

        {d.notes && (
          <>
            <Heading>Notes</Heading>
            <p style={{ margin: "0 0 20px", whiteSpace: "pre-wrap" }}>{d.notes}</p>
          </>
        )}

        <p style={{ fontSize: "8.5pt", color: "#777", marginTop: 28, paddingTop: 8, borderTop: "1px solid #E4E4E4" }}>
          Dossier à conserver {ARCHIVE_RETENTION_YEARS} ans à compter de la date d&apos;immatriculation, dans un système
          d&apos;archivage électronique conforme à la norme NF Z 42-020.
        </p>
      </section>
    </div>
  );
}
