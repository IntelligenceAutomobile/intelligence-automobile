// Mandat de vente imprimable, en 16 articles : le modèle validé le 20 août
// 2026, rempli avec les valeurs de la fiche. Quatre feuilles A4 habillées par
// la charte commune des mandats (MandatDocUI), bordereau de rétractation
// détachable en dernière page.
//
// Ce papier engage la société : chaque clause chiffrée (commission, plancher,
// plafond, indemnité forfaitaire) vient de src/lib/mandats.ts, jamais d'un
// nombre posé ici en dur. Les seuls choix qui varient d'un mandat à l'autre
// sont ceux de la fiche : formule d'honoraires, garde, mode de signature,
// exécution immédiate.
import { formatNumber } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import { formatDateFr } from "@/lib/devis";
import { CT_STATUS_LABEL, isCtStatus } from "@/lib/reprises";
import {
  COMMISSION_TAUX_POURCENT, COMMISSION_MIN_CENTS, COMMISSION_PLAFOND_CENTS,
  INDEMNITE_FORFAITAIRE_CENTS, MEDIATEUR, MANDATAIRE_IDENTITE,
  commissionEstimee, echeanceMandat, mandatVehiculeLabel,
} from "@/lib/mandats";
import {
  Feuille, TitreDoc, Barrette, Art, P, Champs, ZoneTexte, Encart, Encarts,
  CocheDoc, Encadre, Signatures, Bordereau, adresseLigne, ligne,
  type Emetteur,
} from "./MandatDocUI";

export type { Emetteur };

// Le fil rouge imprimé en tête de chaque feuille.
const SURTITRE = "Mandat de vente — Revente sur mesure";

export type PrintMandat = {
  reference: string;
  createdOn: string;
  ownerName: string;
  ownerBirthDate: string;
  ownerAddress: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerIdNumber: string;
  rcPolicy: string;
  rcInsurer: string;
  make: string;
  model: string;
  version: string;
  power: string;
  plate: string;
  vin: string;
  firstRegDate: string;
  mileageKm: number;
  fuel: string;
  color: string;
  keys: number;
  ctDate: string;
  ctStatus: string;
  lastServiceKm: string;
  disclosures: string;
  priceCents: number;
  floorCents: number;
  feeFormula: string;
  packCents: number;
  // Recherche et import : le cahier des charges et le forfait convenu.
  searchSpec: string;
  budgetCents: number;
  mileageMaxKm: number;
  regMinYear: number;
  listingUrl: string;
  countryOrigin: string;
  feeCents: number;
  startDate: string;
  durationDays: number;
  custody: string;
  custodyDate: string;
  signMode: string;
  immediateExecution: boolean;
  signPlace: string;
  signedOn: string;
  // Signature en ligne : le cachet remplace la signature manuscrite du Vendeur.
  signerName: string;
  signedAt: string; // horodatage ISO, vide si signé sur papier
  signedIp: string;
};

export default function MandatDocument({ m, emetteur }: { m: PrintMandat; emetteur: Emetteur }) {
  const e = echeanceMandat(m.startDate, m.durationDays, m.startDate || m.createdOn);
  const commission = commissionEstimee(m.priceCents);
  const vehicule = mandatVehiculeLabel(m);
  const indemnite = formatEuroCents(INDEMNITE_FORFAITAIRE_CENTS);
  const aDomicile = m.signMode !== "distance";

  const feuille = (page: number, children: React.ReactNode) => (
    <Feuille key={page} emetteur={emetteur} surtitre={SURTITRE} reference={m.reference} page={page} total={4}>
      {children}
    </Feuille>
  );

  return (
    <div className="mandat-screen-bg" style={{ backgroundColor: "#0A1628", padding: "24px 0", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Feuille 1 : les parties et le véhicule confié ── */}
      {feuille(1, (
        <>
          <TitreDoc
            titre="MANDAT DE VENTE"
            sousTitre="Mandat d’entremise sans pouvoir de conclure ni d’encaisser"
          />
          <Barrette
            items={[
              { label: "Mandat n°", value: m.reference },
              { label: "Établi le", value: m.createdOn ? formatDateFr(m.createdOn) : "" },
              { label: "Durée", value: `${m.durationDays} jours` },
              { label: "Régime", value: "Exclusif" },
            ]}
          />

          <Art n={1} titre="Les parties">
            <P><strong>Le mandant</strong> — ci-après «&nbsp;le Vendeur&nbsp;»</P>
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
              {`Le Vendeur confie au mandataire, qui l’accepte, un mandat d’entremise en vue de la vente du véhicule désigné à l’article 3. Le mandataire agit en qualité d’intermédiaire : `}
              <strong>il n’est ni propriétaire ni acquéreur du véhicule, n’a pas le pouvoir de conclure la vente au nom du Vendeur, et ne reçoit aucun fonds pour le compte de celui-ci.</strong>
              {` La vente est conclue directement entre le Vendeur et l’acquéreur, et le prix est réglé directement au Vendeur dans les conditions de l’article 10.`}
            </P>
          </Art>

          <Art n={3} titre="Désignation du véhicule">
            <Champs items={[
              { label: "Marque", value: m.make, span: 2 },
              { label: "Modèle et version", value: [m.model, m.version].filter(Boolean).join(" "), span: 2 },
              { label: "Puissance", value: m.power, span: 2 },
              { label: "Numéro d’immatriculation", value: m.plate, span: 2 },
              { label: "Numéro VIN", value: m.vin, span: 2 },
              { label: "1re mise en circulation", value: m.firstRegDate ? formatDateFr(m.firstRegDate) : "", span: 2 },
              { label: "Kilométrage relevé ce jour", value: m.mileageKm > 0 ? `${formatNumber(m.mileageKm)} km` : "", span: 2 },
              { label: "Énergie", value: m.fuel, span: 1 },
              { label: "Couleur", value: m.color, span: 1 },
              { label: "Nombre de clés", value: m.keys > 0 ? String(m.keys) : "", span: 2 },
              { label: "Dernier contrôle technique du", value: m.ctDate ? formatDateFr(m.ctDate) : "", span: 2 },
              { label: "Résultat", value: isCtStatus(m.ctStatus) ? CT_STATUS_LABEL[m.ctStatus] : "", span: 2 },
              { label: "Dernier entretien à (km)", value: m.lastServiceKm, span: 2 },
            ]} />
            <P>
              <strong>Déclarations du Vendeur.</strong>
              {` Le Vendeur déclare être le seul propriétaire du véhicule, celui-ci étant libre de tout gage, opposition, location avec option d’achat ou crédit en cours. Il certifie l’exactitude du kilométrage porté ci-dessus, déclare n’avoir connaissance d’aucun sinistre ni d’aucune avarie non mentionnés, et remet au mandataire l’ensemble des documents énumérés à l’article 12. Toute inexactitude engage sa seule responsabilité.`}
            </P>
            <ZoneTexte
              label="Sinistres, réparations ou particularités déclarés par le Vendeur"
              valeur={m.disclosures}
            />
          </Art>


        </>
      ))}

      {/* ── Feuille 2 : prix, rémunération, durée, vie du mandat ── */}
      {feuille(2, (
        <>
          <Art n={4} titre="Prix de vente et prix plancher">
            <Encarts>
              <Encart
                label="Prix de vente affiché à l’annonce"
                valeur={m.priceCents > 0 ? `${formatEuroCents(m.priceCents)} TTC` : ""}
                mention="Le prix porté sur l’annonce et les supports de diffusion."
              />
              <Encart
                label="Prix plancher net vendeur"
                valeur={m.floorCents > 0 ? formatEuroCents(m.floorCents) : ""}
                mention="Le montant que le Vendeur percevra au minimum."
                ton="neutre"
              />
            </Encarts>
            <P>
              {`Le `}<strong>prix plancher net vendeur</strong>{` est le montant que le Vendeur percevra au minimum. Le mandataire ne peut consentir aucune remise conduisant à un montant inférieur sans l’accord écrit préalable du Vendeur. Toute modification du prix affiché fait l’objet d’un avenant signé des deux parties.`}
            </P>
          </Art>

          <Art n={5} titre="Rémunération du mandataire">
            <P>{`La rémunération du mandataire n’est due qu’en cas de vente effective du véhicule. Les parties retiennent la formule suivante :`}</P>
            <CocheDoc checked={m.feeFormula === "acquereur"}>
              <strong>Formule A — frais à la charge du seul acquéreur.</strong>
              {` Le Vendeur ne verse aucune rémunération au mandataire. L’acquéreur règle directement au mandataire les frais d’intermédiation correspondant au pack de livraison qu’il retient, soit un montant de ${m.packCents > 0 ? formatEuroCents(m.packCents) : "__________ €"} TTC.`}
            </CocheDoc>
            <CocheDoc checked={m.feeFormula === "vendeur"}>
              <strong>Formule B — commission à la charge du Vendeur.</strong>
              {` Le Vendeur verse au mandataire une commission de ${COMMISSION_TAUX_POURCENT} % du prix de vente réalisé, avec un minimum de ${formatEuroCents(COMMISSION_MIN_CENTS)} TTC et un plafond de ${formatEuroCents(COMMISSION_PLAFOND_CENTS)} TTC, soit un montant estimé de ${m.feeFormula === "vendeur" && commission > 0 ? formatEuroCents(commission) : "__________ €"} TTC. L’acquéreur règle en outre le pack de livraison qu’il retient.`}
            </CocheDoc>
            <P>
              {`Hors les cas prévus aux articles 7 et 8, aucune somme n’est due par le Vendeur si le véhicule n’est pas vendu, quelle qu’en soit la raison et quelle que soit la durée de mise en vente. Les frais de préparation, de reportage photographique et de diffusion sont intégralement pris en charge par le mandataire.`}
            </P>
          </Art>

          <Art n={6} titre="Durée et exclusivité">
            <Champs items={[
              { label: "Le mandat prend effet le", value: m.startDate ? formatDateFr(m.startDate) : "", span: 3 },
              { label: "Et expire le", value: e ? formatDateFr(e.echeance) : "", span: 3 },
            ]} />
            <P>
              {`Le mandat est consenti pour une durée de ${m.durationDays} jours à compter de sa date d’effet, renouvelable par accord écrit des parties. Il est conclu à titre `}
              <strong>exclusif</strong>
              {` : pendant toute sa durée, le Vendeur s’interdit de confier le véhicule à un autre professionnel et de diffuser toute annonce le concernant, sur quelque support que ce soit. La vente directe reste possible dans le seul cadre de l’article 7.`}
            </P>
          </Art>
          <Art n={7} titre="Faculté de vente directe par le Vendeur">
            <P>
              {`Le Vendeur conserve la faculté de vendre lui-même son véhicule à un acquéreur qui ne lui a pas été présenté par le mandataire. Dans ce cas, `}
              <strong>aucune commission n’est due</strong>
              {` ; seule une indemnité forfaitaire de ${indemnite} TTC est versée au mandataire au titre des frais de préparation, de reportage et de diffusion effectivement engagés. Le Vendeur informe le mandataire de la vente dans les quarante-huit heures.`}
            </P>
          </Art>

          <Art n={8} titre="Retrait du véhicule en cours de mandat">
            <P>
              {`En cas de retrait du véhicule de la vente par le Vendeur avant l’expiration du mandat, pour quelque motif que ce soit, une indemnité forfaitaire de ${indemnite} TTC est due au mandataire au même titre. Cette indemnité n’est pas due lorsque le retrait résulte d’un cas de force majeure ou de l’exercice du droit de rétractation prévu à l’article 14.`}
            </P>
          </Art>

          <Art n={9} titre="Acquéreurs présentés — clause de survie">
            <P>
              {`La rémunération prévue à l’article 5 reste due si la vente intervient dans les six (6) mois suivant l’expiration du mandat au profit d’un acquéreur que le mandataire a présenté au Vendeur pendant sa durée. Est réputé présenté tout acquéreur ayant visité ou essayé le véhicule, ou ayant formulé une offre, par l’intermédiaire du mandataire. La `}
              <strong>liste nominative des acquéreurs présentés</strong>
              {` est remise au Vendeur à l’expiration du mandat ; à défaut de remise, la présente clause est inopposable au Vendeur.`}
            </P>
          </Art>

        </>
      ))}

      {/* ── Feuille 3 : règlement, prestations, garde, rétractation ── */}
      {feuille(3, (
        <>
          <Art n={10} titre="Modalités de règlement de la vente">
            <P>
              {`Le règlement s’opère par `}
              <strong>deux virements distincts émis par l’acquéreur avant la remise des clés</strong>
              {` : le prix net vendeur sur le compte du Vendeur, et les frais d’intermédiation sur le compte du mandataire. Le montant total de la cession figure en clair sur l’acte de vente. Le mandataire ne détient à aucun moment les fonds du Vendeur. Aucune clé, aucun document ni aucune remise du véhicule n’intervient avant réception effective des deux virements. À la demande de l’une ou l’autre des parties, la transaction peut être placée sous séquestre auprès d’un tiers de confiance, aux frais du demandeur.`}
            </P>
          </Art>

          <Art n={11} titre="Prestations du mandataire">
            <P>
              {`Le mandataire s’engage à réaliser, à ses frais : l’estimation argumentée du véhicule et la définition de la stratégie de prix ; la préparation esthétique intérieure et extérieure ; le reportage photographique ; la constitution du dossier historique ; la rédaction et la diffusion de l’annonce sur les principaux supports ; la réception et la qualification de l’ensemble des contacts ; l’organisation et l’accompagnement des visites et des essais ; la vérification de l’identité et de la solvabilité de l’acquéreur ; la rédaction des documents de cession et la déclaration en ligne. Il rend compte au Vendeur de l’avancement de la mise en vente au moins une fois par mois.`}
            </P>
          </Art>

          <Art n={12} titre="Garde du véhicule, documents et essais">
            <P><strong>Garde du véhicule pendant le mandat :</strong></P>
            <CocheDoc checked={m.custody !== "mandataire"}>
              {`Le véhicule demeure en la possession du Vendeur, qui en conserve la garde et l’assurance.`}
            </CocheDoc>
            <CocheDoc checked={m.custody === "mandataire"}>
              {`Le véhicule est confié au mandataire à compter du ${m.custody === "mandataire" && m.custodyDate ? formatDateFr(m.custodyDate) : "............................"} Un état des lieux photographique contradictoire est établi à la remise et à la restitution.`}
            </CocheDoc>
            <P>
              <strong>Documents remis par le Vendeur :</strong>
              {` certificat d’immatriculation, contrôle technique de moins de six mois, carnet d’entretien, factures d’entretien, notice, et l’intégralité des clés et télécommandes. Le Vendeur informe sans délai le mandataire de tout événement affectant le véhicule ou son droit de propriété.`}
            </P>
            <P>
              <strong>Essais.</strong>
              {` Aucun essai n’a lieu hors la présence du mandataire. L’identité et le permis de conduire de tout essayeur sont vérifiés et conservés. L’itinéraire est défini préalablement. Les essais sont réalisés sous couvert de l’assurance du véhicule et de la responsabilité civile professionnelle du mandataire, dans les limites et franchises des polices en vigueur.`}
            </P>
          </Art>

          <Art n={13} titre="Responsabilité et obligation d'information">
            <P>
              {`Le mandataire est tenu d’une obligation de moyens. Il ne garantit ni la vente du véhicule, ni son prix, ni son délai de commercialisation. Le Vendeur demeure seul tenu, à l’égard de l’acquéreur, de la garantie des vices cachés et de l’obligation d’information sur l’état réel du véhicule. Le mandataire porte à la connaissance de l’acquéreur l’ensemble des informations que le Vendeur lui a communiquées, et l’informe de ce que la vente est conclue avec un particulier.`}
            </P>
          </Art>
          <Art n={14} titre="Droit de rétractation">
            <Encadre>
              <P>
                <strong>
                  {aDomicile
                    ? "Le présent mandat étant conclu hors établissement, le Vendeur dispose d’un délai de quatorze (14) jours à compter de sa signature pour se rétracter, sans avoir à motiver sa décision ni à supporter de frais."
                    : "Le présent mandat étant conclu à distance, le Vendeur dispose d’un délai de quatorze (14) jours à compter de sa signature pour se rétracter, sans avoir à motiver sa décision ni à supporter de frais."}
                </strong>
              </P>
              <P>
                {`Pour exercer ce droit, il notifie sa décision au moyen du bordereau détachable joint au présent mandat, ou par toute déclaration dénuée d’ambiguïté adressée à ${emetteur.name}, ${adresseLigne(emetteur.address)}${emetteur.email ? `, ou à ${emetteur.email}` : ""}.`}
              </P>
              {aDomicile && (
                <P>
                  {`Conformément à l’article L. 221-10 du code de la consommation, aucun paiement ne peut être exigé du Vendeur avant l’expiration d’un délai de sept jours à compter de la signature.`}
                </P>
              )}
            </Encadre>
            <CocheDoc checked={m.immediateExecution}>
              {`Le Vendeur demande expressément l’exécution du mandat avant la fin du délai de rétractation. Il reconnaît qu’en cas de rétractation postérieure, il devra régler le montant des prestations effectivement fournies au prorata, dans la limite de ${indemnite} TTC, et que si la vente du véhicule est conclue avant la fin du délai, le mandat est alors pleinement exécuté et il renonce expressément à son droit de rétractation (article L. 221-28, 1°, du code de la consommation).`}
            </CocheDoc>
          </Art>

        </>
      ))}

      {/* ── Feuille 4 : données, litiges, signatures, bordereau détachable ── */}
      {feuille(4, (
        <>
          <Art n={15} titre="Données personnelles">
            <P>
              {`Les données collectées sont traitées par ${emetteur.name} aux seules fins d’exécution du présent mandat et conservées trois ans après son terme. Le Vendeur dispose d’un droit d’accès, de rectification, d’effacement et d’opposition${emetteur.email ? `, exerçable à ${emetteur.email}` : ""}, ainsi que du droit d’introduire une réclamation auprès de la CNIL.`}
            </P>
          </Art>

          <Art n={16} titre="Réclamations, médiation et litiges">
            <P>
              {`Toute réclamation est adressée à ${emetteur.name}, ${adresseLigne(emetteur.address)}. À défaut de solution amiable, le Vendeur peut recourir gratuitement au médiateur de la consommation dont relève le mandataire : ${MEDIATEUR.nom}, ${MEDIATEUR.adresse} — ${MEDIATEUR.site}. Le présent mandat est soumis au droit français.`}
            </P>
          </Art>

          <P>
            {`Fait en deux exemplaires originaux, dont un remis au Vendeur au moment de la signature, accompagné du bordereau de rétractation.`}
          </P>
          <Champs items={[
            { label: "À", value: m.signPlace, span: 3 },
            { label: "Le", value: m.signedOn ? formatDateFr(m.signedOn) : "", span: 3 },
          ]} />

          <Signatures
            emetteur={emetteur}
            roleClient="Le Vendeur"
            signerName={m.signerName}
            signedAt={m.signedAt}
            signedIp={m.signedIp}
          />

          <Bordereau
            emetteur={emetteur}
            phrase={`Je vous notifie par la présente ma rétractation du mandat de vente n° ${m.reference} signé le __________ portant sur le véhicule ${vehicule}${m.plate ? ` immatriculé ${m.plate}` : ""}.`}
          />
        </>
      ))}
    </div>
  );
}
