// Mandat d'import imprimable, en 13 articles : l'acquisition sécurisée d'un
// véhicule dans l'Union européenne, annonce repérée par le client ou recherche
// confiée. Quatre feuilles A4 paginées à la main, bordereau de rétractation
// détachable en dernière page.
//
// Les verrous du statut d'intermédiaire transparent sont écrits noir sur
// blanc : paiement direct du Client au vendeur étranger, facture d'achat au
// nom du Client, forfait chiffré au contrat (grille arbitrée le 20 août 2026),
// information TVA selon la règle des six mois et 6 000 km.
import { formatNumber } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import { formatDateFr } from "@/lib/devis";
import {
  INDEMNITE_FORFAITAIRE_CENTS, MEDIATEUR, MANDATAIRE_IDENTITE,
  echeanceMandat,
} from "@/lib/mandats";
import type { PrintMandat, Emetteur } from "./MandatDocument";

const SHEET: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "0 0 8mm",
  backgroundColor: "#fff",
  color: "#111",
  fontSize: "8.8pt",
  lineHeight: 1.45,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
};

const BODY: React.CSSProperties = { padding: "5mm 14mm 0", flex: 1 };

function ligne(valeur: string): string {
  return valeur.trim() !== "" ? valeur : "________________";
}

/** Adresse de l'émetteur sur une ligne, sans la mention du pays. */
function adresseLigne(address: string): string {
  return address
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && l.toLowerCase() !== "france")
    .join(", ");
}

function Bandeau({ emetteur, page }: { emetteur: Emetteur; page: number }) {
  return (
    <div
      style={{
        backgroundColor: "#0A1628",
        color: "#FFFFFF",
        padding: page === 1 ? "7mm 14mm" : "4.5mm 14mm",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div style={{ fontSize: page === 1 ? "12pt" : "9.5pt", fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase" }}>
        {emetteur.name.replace(/^SASU\s+/i, "")}
      </div>
      <div style={{ fontSize: "7pt", letterSpacing: "0.14em", textTransform: "uppercase", color: "#9FB3D4", textAlign: "right" }}>
        Mandat d’import — Union européenne
      </div>
    </div>
  );
}

function Pied({ emetteur, page }: { emetteur: Emetteur; page: number }) {
  return (
    <div
      style={{
        margin: "5mm 14mm 0",
        paddingTop: "2mm",
        borderTop: "1px solid #DDD",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: "6.8pt",
        color: "#777",
      }}
    >
      <span>
        {emetteur.name} · {adresseLigne(emetteur.address)}
        {emetteur.siret ? ` · SIRET ${emetteur.siret}` : ""}
        {emetteur.tva ? ` · TVA ${emetteur.tva}` : ""}
      </span>
      <span style={{ whiteSpace: "nowrap" }}>Page {page} / 4 — paraphes : ______ / ______</span>
    </div>
  );
}

function Art({ n, titre, children }: { n: number; titre: string; children: React.ReactNode }) {
  return (
    <div className="mandat-avoid-break" style={{ marginTop: "3.6mm" }}>
      <h2 style={{ fontSize: "8.8pt", fontWeight: 700, margin: "0 0 1.2mm", letterSpacing: "0.02em" }}>
        ARTICLE {n} — {titre.toUpperCase()}
      </h2>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 1.6mm", textAlign: "justify" }}>{children}</p>;
}

function Champs({ items }: { items: { label: string; value: string; span?: number }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", columnGap: "5mm", rowGap: "1.6mm", margin: "1mm 0 1.6mm" }}>
      {items.map((c) => (
        <div key={c.label} style={{ gridColumn: `span ${c.span ?? 2}` }}>
          <div style={{ fontSize: "6.6pt", textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" }}>{c.label}</div>
          <div style={{ borderBottom: "1px solid #BBB", padding: "0.4mm 0 0.6mm", fontWeight: 600, minHeight: "4mm", overflowWrap: "anywhere" }}>
            {c.value.trim() !== "" ? c.value : " "}
          </div>
        </div>
      ))}
    </div>
  );
}

function CocheDoc({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <div
      className="mandat-avoid-break"
      style={{
        display: "flex",
        gap: "2.4mm",
        alignItems: "flex-start",
        border: "1px solid #C9D2E2",
        backgroundColor: checked ? "#EFF4FC" : "#FFFFFF",
        padding: "1.8mm 2.6mm",
        margin: "0 0 1.6mm",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <span
        aria-hidden
        style={{
          width: "3.4mm",
          height: "3.4mm",
          border: "1.2px solid #111",
          flexShrink: 0,
          marginTop: "0.5mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "7.5pt",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {checked ? "✕" : ""}
      </span>
      <span style={{ textAlign: "justify" }}>{children}</span>
    </div>
  );
}

function Signatures({ m, emetteur }: { m: PrintMandat; emetteur: Emetteur }) {
  const enLigne = m.signedAt !== "" && m.signerName !== "";
  const quand = enLigne
    ? new Date(m.signedAt).toLocaleString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
      })
    : "";
  return (
    <div className="mandat-avoid-break" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5mm", marginTop: "3mm" }}>
      <div style={{ border: "1px solid #BBB", minHeight: "30mm", padding: "2mm 2.6mm" }}>
        <div style={{ fontWeight: 700 }}>Le Client</div>
        {enLigne ? (
          <div style={{ fontSize: "7.6pt", marginTop: "1mm", lineHeight: 1.55 }}>
            <div style={{ fontSize: "9.5pt", fontWeight: 700 }}>{m.signerName}</div>
            <div>Signé en ligne le {quand}</div>
            {m.signedIp !== "" && <div style={{ color: "#666" }}>Adresse IP : {m.signedIp}</div>}
            <div style={{ color: "#666" }}>Mention «&nbsp;Lu et approuvé, bon pour mandat&nbsp;» validée en ligne</div>
          </div>
        ) : (
          <div style={{ fontSize: "7.2pt", color: "#666" }}>
            Signature précédée de la mention manuscrite «&nbsp;Lu et approuvé, bon pour mandat&nbsp;»
          </div>
        )}
      </div>
      <div style={{ border: "1px solid #BBB", minHeight: "30mm", padding: "2mm 2.6mm" }}>
        <div style={{ fontWeight: 700 }}>Le Mandataire</div>
        <div style={{ fontSize: "7.2pt", color: "#666" }}>
          {emetteur.name} — {emetteur.representative}, président
        </div>
      </div>
    </div>
  );
}

export default function MandatDocumentImport({ m, emetteur }: { m: PrintMandat; emetteur: Emetteur }) {
  const e = echeanceMandat(m.startDate, m.durationDays, m.startDate || m.createdOn);
  const indemnite = formatEuroCents(INDEMNITE_FORFAITAIRE_CENTS);
  const aDomicile = m.signMode !== "distance";
  const cible = [m.make, m.model, m.version].filter((s) => s.trim() !== "").join(" ");

  const feuille = (page: number, children: React.ReactNode) => (
    <div key={page} className="mandat-sheet" style={SHEET}>
      <Bandeau emetteur={emetteur} page={page} />
      <div style={BODY}>{children}</div>
      <Pied emetteur={emetteur} page={page} />
    </div>
  );

  return (
    <div className="mandat-screen-bg" style={{ backgroundColor: "#0A1628", padding: "24px 0", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Feuille 1 : parties, objet, véhicule visé ── */}
      {feuille(1, (
        <>
          <div style={{ textAlign: "center", margin: "3mm 0 1mm" }}>
            <h1 style={{ fontSize: "15pt", fontWeight: 800, letterSpacing: "0.04em", margin: 0 }}>MANDAT D’IMPORT</h1>
            <div style={{ color: "#555", fontSize: "8pt", marginTop: "0.8mm" }}>
              Acquisition d’un véhicule dans l’Union européenne — mandat d’entremise sans pouvoir de conclure ni d’encaisser
            </div>
          </div>
          <Champs items={[
            { label: "Mandat n°", value: m.reference, span: 3 },
            { label: "Établi le", value: m.createdOn ? formatDateFr(m.createdOn) : "", span: 3 },
          ]} />

          <Art n={1} titre="Les parties">
            <P><strong>Le mandant</strong> — ci-après «&nbsp;le Client&nbsp;»</P>
            <Champs items={[
              { label: "Nom et prénom", value: m.ownerName, span: 4 },
              { label: "Né(e) le", value: m.ownerBirthDate ? formatDateFr(m.ownerBirthDate) : "", span: 2 },
              { label: "Adresse complète", value: m.ownerAddress, span: 6 },
              { label: "Téléphone", value: m.ownerPhone, span: 2 },
              { label: "Courriel", value: m.ownerEmail, span: 2 },
              { label: "Pièce d’identité n°", value: m.ownerIdNumber, span: 2 },
            ]} />
            <P>
              <strong>Le mandataire</strong> — {MANDATAIRE_IDENTITE}{" "}
              {`Assurance de responsabilité civile professionnelle : police n° ${ligne(m.rcPolicy)}, souscrite auprès de ${ligne(m.rcInsurer)}.`}
            </P>
          </Art>

          <Art n={2} titre="Objet du mandat">
            <P>
              {`Le Client confie au mandataire, qui l’accepte, un mandat d’entremise en vue de l’acquisition d’un véhicule dans l’Union européenne : soit l’annonce repérée par le Client et désignée à l’article 3, soit un véhicule recherché par le mandataire selon le même cahier des charges. Le mandataire agit en qualité d’intermédiaire : `}
              <strong>il n’est ni vendeur ni acquéreur du véhicule, n’a pas le pouvoir de conclure l’achat au nom du Client, et ne reçoit aucun fonds pour le compte de celui-ci.</strong>
              {` L’achat est conclu directement entre le Client et le vendeur du véhicule.`}
            </P>
          </Art>

          <Art n={3} titre="Le véhicule visé">
            <Champs items={[
              { label: "Annonce repérée par le Client (lien)", value: m.listingUrl, span: 6 },
              { label: "Pays d’achat visé", value: m.countryOrigin, span: 2 },
              { label: "Marque", value: m.make, span: 2 },
              { label: "Modèle", value: m.model, span: 2 },
              { label: "Version, finition", value: m.version, span: 2 },
              { label: "Énergie", value: m.fuel, span: 2 },
              { label: "Budget d’achat maximal (€ TTC)", value: m.budgetCents > 0 ? formatEuroCents(m.budgetCents) : "", span: 2 },
              { label: "Kilométrage plafond", value: m.mileageMaxKm > 0 ? `${formatNumber(m.mileageMaxKm)} km` : "", span: 3 },
              { label: "1re mise en circulation à partir de", value: m.regMinYear > 0 ? String(m.regMinYear) : "", span: 3 },
            ]} />
            <div style={{ fontSize: "6.6pt", textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" }}>
              Critères libres convenus avec le Client
            </div>
            <div style={{ borderBottom: "1px solid #BBB", minHeight: "8mm", padding: "0.6mm 0", whiteSpace: "pre-line", marginBottom: "1.6mm" }}>
              {m.searchSpec}
            </div>
            <P>
              {`Le budget s’entend toutes taxes comprises, hors TVA française éventuelle de l’article 6. Toute proposition qui le dépasse demande l’accord écrit du Client.`}
            </P>
          </Art>
        </>
      ))}

      {/* ── Feuille 2 : forfait, paiement, TVA, durée ── */}
      {feuille(2, (
        <>
          <Art n={4} titre="Le forfait d'import">
            <P>
              {`Les honoraires du mandataire sont convenus à la somme forfaitaire de `}
              <strong>{m.feeCents > 0 ? `${formatEuroCents(m.feeCents)} TTC` : "__________ € TTC"}</strong>
              {`, due au jour où le Client conclut l’achat du véhicule et réglée au plus tard à la livraison. Le forfait couvre l’ensemble des diligences de l’article 8, y compris la demande de certificat fiscal et l’immatriculation française. Le transport du véhicule est refacturé à prix coûtant, sur justificatifs. Le certificat de conformité européen (COC), s’il est requis, est refacturé au tarif du constructeur. `}
              <strong>Le forfait s’applique de la même façon lorsque l’annonce est apportée par le Client.</strong>
              {` Sans véhicule acquis, aucune somme n’est due ; aucun acompte n’est demandé à la signature.`}
            </P>
          </Art>

          <Art n={5} titre="Paiement du véhicule">
            <P>
              {`Le prix du véhicule est réglé `}
              <strong>directement par le Client au vendeur, et la facture d’achat est établie au nom du Client.</strong>
              {` Le mandataire ne détient à aucun moment les fonds du Client ; il vérifie, avant tout règlement, l’identité du vendeur, la cohérence des documents du véhicule et les coordonnées bancaires communiquées.`}
            </P>
          </Art>

          <Art n={6} titre="TVA et fiscalité de l'import">
            <P>
              {`Tout véhicule acquis dans l’Union européenne demande un certificat fiscal (quitus) avant son immatriculation en France ; le mandataire en fait la demande pour le compte du Client. Un véhicule livré moins de six mois après sa première mise en circulation, ou totalisant moins de 6 000 kilomètres, est fiscalement neuf : `}
              <strong>la TVA française de 20 % est alors due par le Client en France</strong>
              {`, en sus du prix payé au vendeur. Au-delà de ces deux seuils, le véhicule est fiscalement d’occasion et le quitus est délivré sans versement. Le mandataire informe le Client par écrit du régime applicable avant tout engagement d’achat.`}
            </P>
          </Art>

          <Art n={7} titre="Durée et exclusivité">
            <Champs items={[
              { label: "Le mandat prend effet le", value: m.startDate ? formatDateFr(m.startDate) : "", span: 3 },
              { label: "Et expire le", value: e ? formatDateFr(e.echeance) : "", span: 3 },
            ]} />
            <P>
              {`Le mandat est consenti pour une durée de ${m.durationDays} jours à compter de sa date d’effet, renouvelable par accord écrit des parties. Il est conclu à titre `}
              <strong>exclusif</strong>
              {` : pendant toute sa durée, le Client s’interdit de confier la même mission à un autre professionnel et de conclure lui-même l’achat de l’annonce désignée à l’article 3. Les honoraires restent dus si le Client achète, dans les six (6) mois suivant l’expiration, un véhicule présenté par le mandataire, la liste nominative des véhicules présentés lui étant remise à l’expiration ; à défaut de remise, la présente clause lui est inopposable.`}
            </P>
          </Art>
        </>
      ))}

      {/* ── Feuille 3 : prestations, obligations, responsabilité, rétractation ── */}
      {feuille(3, (
        <>
          <Art n={8} titre="Prestations du mandataire">
            <P>
              {`Le mandataire s’engage à réaliser : la vérification de l’annonce, du vendeur et de l’historique accessible du véhicule ; le contrôle documentaire (carnet, factures, situation administrative dans le pays d’origine) ; la négociation du prix et des conditions ; l’assistance au règlement direct de l’article 5 ; l’organisation du transport assuré jusqu’au lieu convenu avec le Client ; les plaques provisoires si elles sont requises ; la demande de certificat fiscal ; le dépôt de la demande d’immatriculation française jusqu’à la carte grise définitive. Il rend compte au Client à chaque étape franchie. Délai indicatif entre l’accord d’achat et la livraison : deux à six semaines.`}
            </P>
          </Art>

          <Art n={9} titre="Obligations du Client">
            <P>
              {`Le Client garantit la disponibilité des fonds annoncés. Il répond aux propositions et demandes de pièces dans un délai de cinq jours ouvrés, et fournit les justificatifs requis pour l’immatriculation (pièce d’identité, justificatif de domicile). Pendant le mandat et la période de survie de l’article 7, il traite avec les vendeurs présentés par l’intermédiaire du mandataire.`}
            </P>
          </Art>

          <Art n={10} titre="Responsabilité">
            <P>
              {`Le mandataire est tenu d’une obligation de moyens. Il ne garantit ni la disponibilité du véhicule visé, ni un prix, ni un délai, les délais des administrations restant indicatifs. Le vendeur du véhicule demeure seul tenu des garanties attachées à la vente : garantie légale de conformité s’il est professionnel, garantie des vices cachés. Le mandataire porte à la connaissance du Client l’ensemble des informations recueillies.`}
            </P>
          </Art>

          <Art n={11} titre="Droit de rétractation">
            <div
              className="mandat-avoid-break"
              style={{
                borderLeft: "2.5px solid #0A1628",
                backgroundColor: "#F2F5FB",
                padding: "2mm 3mm",
                marginBottom: "1.6mm",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              <P>
                <strong>
                  {aDomicile
                    ? "Le présent mandat étant conclu hors établissement, le Client dispose d’un délai de quatorze (14) jours à compter de sa signature pour se rétracter, sans avoir à motiver sa décision ni à supporter de frais."
                    : "Le présent mandat étant conclu à distance, le Client dispose d’un délai de quatorze (14) jours à compter de sa signature pour se rétracter, sans avoir à motiver sa décision ni à supporter de frais."}
                </strong>
              </P>
              <P>
                {`Pour exercer ce droit, il notifie sa décision au moyen du bordereau détachable joint au présent mandat, ou par toute déclaration dénuée d’ambiguïté adressée à ${emetteur.name}, ${adresseLigne(emetteur.address)}${emetteur.email ? `, ou à ${emetteur.email}` : ""}.`}
              </P>
              {aDomicile && (
                <P>
                  {`Conformément à l’article L. 221-10 du code de la consommation, aucun paiement ne peut être exigé du Client avant l’expiration d’un délai de sept jours à compter de la signature.`}
                </P>
              )}
            </div>
            <CocheDoc checked={m.immediateExecution}>
              {`Le Client demande expressément l’exécution du mandat avant la fin du délai de rétractation. Il reconnaît qu’en cas de rétractation postérieure, il devra régler le montant des prestations effectivement fournies au prorata, dans la limite de ${indemnite} TTC, et que si l’achat du véhicule est conclu avant la fin du délai, le mandat est alors pleinement exécuté et il renonce expressément à son droit de rétractation (article L. 221-28, 1°, du code de la consommation).`}
            </CocheDoc>
          </Art>
        </>
      ))}

      {/* ── Feuille 4 : données, litiges, signatures, bordereau détachable ── */}
      {feuille(4, (
        <>
          <Art n={12} titre="Données personnelles">
            <P>
              {`Les données collectées sont traitées par ${emetteur.name} aux seules fins d’exécution du présent mandat, des demandes de certificat fiscal et d’immatriculation, et conservées trois ans après son terme, hors obligations d’archivage propres aux dossiers d’immatriculation. Le Client dispose d’un droit d’accès, de rectification, d’effacement et d’opposition${emetteur.email ? `, exerçable à ${emetteur.email}` : ""}, ainsi que du droit d’introduire une réclamation auprès de la CNIL.`}
            </P>
          </Art>

          <Art n={13} titre="Réclamations, médiation et litiges">
            <P>
              {`Toute réclamation est adressée à ${emetteur.name}, ${adresseLigne(emetteur.address)}. À défaut de solution amiable, le Client peut recourir gratuitement au médiateur de la consommation dont relève le mandataire : ${MEDIATEUR.nom}, ${MEDIATEUR.adresse} — ${MEDIATEUR.site}. Le présent mandat est soumis au droit français.`}
            </P>
          </Art>

          <P>
            {`Fait en deux exemplaires originaux, dont un remis au Client au moment de la signature, accompagné du bordereau de rétractation.`}
          </P>
          <Champs items={[
            { label: "À", value: m.signPlace, span: 3 },
            { label: "Le", value: m.signedOn ? formatDateFr(m.signedOn) : "", span: 3 },
          ]} />

          <Signatures m={m} emetteur={emetteur} />

          <div style={{ margin: "5mm 0 2mm", borderTop: "1.5px dashed #999", position: "relative" }}>
            <span style={{ position: "absolute", top: "-2.6mm", left: 0, backgroundColor: "#fff", paddingRight: "2mm", fontSize: "7pt", color: "#777" }}>✂</span>
          </div>

          <div className="mandat-avoid-break">
            <h2 style={{ fontSize: "10pt", fontWeight: 800, letterSpacing: "0.04em", margin: "2mm 0 1mm" }}>BORDEREAU DE RÉTRACTATION</h2>
            <P>
              <span style={{ color: "#555", fontSize: "7.6pt" }}>
                {`À compléter et renvoyer uniquement si vous souhaitez vous rétracter du mandat, dans un délai de quatorze jours à compter de sa signature.`}
              </span>
            </P>
            <P>
              {`À l’attention de : ${emetteur.name}, ${adresseLigne(emetteur.address)}${emetteur.email ? ` — ${emetteur.email}` : ""}`}
            </P>
            <P>
              {`Je vous notifie par la présente ma rétractation du mandat d’import n° ${m.reference} signé le __________${cible ? `, portant sur l’acquisition d’un véhicule ${cible}` : ""}.`}
            </P>
            <Champs items={[
              { label: "Nom et prénom du Client", value: "", span: 4 },
              { label: "Date", value: "", span: 2 },
              { label: "Adresse", value: "", span: 6 },
              { label: "Signature", value: "", span: 3 },
            ]} />
          </div>
        </>
      ))}
    </div>
  );
}
