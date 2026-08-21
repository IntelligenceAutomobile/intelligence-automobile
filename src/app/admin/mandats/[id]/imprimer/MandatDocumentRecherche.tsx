// Mandat de recherche imprimable, en 12 articles : la recherche personnalisée
// du site, contractualisée. Trois feuilles A4 paginées à la main, bordereau de
// rétractation détachable en dernière page, mêmes conventions que le mandat de
// vente : chiffres tirés de src/lib/mandats.ts, jamais posés ici en dur.
//
// Le contrat suit le modèle d'entremise validé le 20 août 2026 : intermédiaire
// sans pouvoir de conclure ni d'encaisser, honoraires dus uniquement au succès
// (grille arbitrée le même jour), exclusivité avec clause de survie de six
// mois adossée à une liste nominative.
import { formatNumber } from "@/lib/format";
import { formatEuroCents } from "@/lib/comptes";
import { formatDateFr } from "@/lib/devis";
import {
  INDEMNITE_FORFAITAIRE_CENTS, MEDIATEUR, MANDATAIRE_IDENTITE,
  echeanceMandat,
} from "@/lib/mandats";
import type { PrintMandat, Emetteur } from "./MandatDocument";

import {
  Feuille, TitreDoc, Barrette, Art, P, Champs, ZoneTexte, Encart, Encarts,
  CocheDoc, Encadre, Signatures, Bordereau, adresseLigne, ligne,
} from "./MandatDocUI";

// Le fil rouge imprimé en tête de chaque feuille.
const SURTITRE = "Mandat de recherche — Recherche personnalisée";

export default function MandatDocumentRecherche({ m, emetteur }: { m: PrintMandat; emetteur: Emetteur }) {
  const e = echeanceMandat(m.startDate, m.durationDays, m.startDate || m.createdOn);
  const indemnite = formatEuroCents(INDEMNITE_FORFAITAIRE_CENTS);
  const aDomicile = m.signMode !== "distance";
  const cible = [m.make, m.model, m.version].filter((s) => s.trim() !== "").join(" ");

  const feuille = (page: number, children: React.ReactNode) => (
    <Feuille key={page} emetteur={emetteur} surtitre={SURTITRE} reference={m.reference} page={page} total={4}>
      {children}
    </Feuille>
  );

  return (
    <div className="mandat-screen-bg" style={{ backgroundColor: "#0A1628", padding: "24px 0", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Feuille 1 : les parties, l'objet et le cahier des charges ── */}
      {feuille(1, (
        <>
          <TitreDoc
            titre="MANDAT DE RECHERCHE"
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
              {`Le Client confie au mandataire, qui l’accepte, un mandat d’entremise en vue de la recherche et de la négociation d’un véhicule répondant au cahier des charges de l’article 3, en France ou dans l’Union européenne. Le mandataire agit en qualité d’intermédiaire : `}
              <strong>il n’est ni vendeur ni acquéreur du véhicule, n’a pas le pouvoir de conclure l’achat au nom du Client, et ne reçoit aucun fonds pour le compte de celui-ci.</strong>
              {` L’achat est conclu directement entre le Client et le vendeur du véhicule, et le prix est réglé directement par le Client à ce vendeur.`}
            </P>
          </Art>

          <Art n={3} titre="Le cahier des charges">
            <Champs items={[
              { label: "Marque souhaitée", value: m.make, span: 2 },
              { label: "Modèle", value: m.model, span: 2 },
              { label: "Version, finition", value: m.version, span: 2 },
              { label: "Énergie", value: m.fuel, span: 2 },
              { label: "Budget d’achat maximal (€ TTC)", value: m.budgetCents > 0 ? formatEuroCents(m.budgetCents) : "", span: 2 },
              { label: "Kilométrage plafond", value: m.mileageMaxKm > 0 ? `${formatNumber(m.mileageMaxKm)} km` : "", span: 2 },
              { label: "1re mise en circulation à partir de", value: m.regMinYear > 0 ? String(m.regMinYear) : "", span: 3 },
            ]} />
            <ZoneTexte
              label="Critères libres convenus avec le Client"
              valeur={m.searchSpec}
            />
            <P>
              {`Le budget s’entend toutes taxes comprises, frais de mise à disposition inclus. Toute proposition qui le dépasse, et toute modification du cahier des charges, demandent l’accord écrit du Client.`}
            </P>
          </Art>

        </>
      ))}

      {/* ── Feuille 2 : honoraires, durée, clause de survie, prestations ── */}
      {feuille(2, (
        <>
          <Art n={4} titre="Honoraires — dus uniquement au succès">
            <Encarts>
              <Encart
                label="Honoraires convenus"
                valeur={m.feeCents > 0 ? `${formatEuroCents(m.feeCents)} TTC` : ""}
                mention="Dus uniquement au succès : véhicule trouvé et acheté."
              />
              <Encart
                label="Budget d’achat maximal"
                valeur={m.budgetCents > 0 ? `${formatEuroCents(m.budgetCents)} TTC` : ""}
                mention="Le plafond convenu avec le Client."
                ton="neutre"
              />
            </Encarts>
            <P>
              {`Les honoraires du mandataire sont convenus à la somme forfaitaire de `}
              <strong>{m.feeCents > 0 ? `${formatEuroCents(m.feeCents)} TTC` : "__________ € TTC"}</strong>
              {`. Ils sont dus au jour où le Client conclut l’achat d’un véhicule présenté par le mandataire, et sont réglés au plus tard à la livraison. `}
              <strong>Sans véhicule trouvé et acheté, aucune somme n’est due</strong>
              {`, quelle que soit la durée de la recherche. Aucun acompte n’est demandé à la signature ; les frais engagés pour la recherche restent à la charge du mandataire.`}
            </P>
          </Art>

          <Art n={5} titre="Durée et exclusivité">
            <Champs items={[
              { label: "Le mandat prend effet le", value: m.startDate ? formatDateFr(m.startDate) : "", span: 3 },
              { label: "Et expire le", value: e ? formatDateFr(e.echeance) : "", span: 3 },
            ]} />
            <P>
              {`Le mandat est consenti pour une durée de ${m.durationDays} jours à compter de sa date d’effet, renouvelable par accord écrit des parties. Il est conclu à titre `}
              <strong>exclusif</strong>
              {` : pendant toute sa durée, le Client s’interdit de confier la même recherche à un autre professionnel. Il conserve la faculté d’acheter par lui-même un véhicule trouvé par ses propres moyens, sans honoraires ; il en informe le mandataire dans les quarante-huit heures.`}
            </P>
          </Art>

          <Art n={6} titre="Véhicules présentés — clause de survie">
            <P>
              {`Les honoraires de l’article 4 restent dus si le Client achète, dans les six (6) mois suivant l’expiration du mandat, un véhicule que le mandataire lui a présenté pendant sa durée. La `}
              <strong>liste nominative des véhicules présentés</strong>
              {` (marque, modèle, numéro de série ou immatriculation) est remise au Client à l’expiration du mandat ; à défaut de remise, la présente clause lui est inopposable.`}
            </P>
          </Art>

          <Art n={7} titre="Prestations du mandataire">
            <P>
              {`Le mandataire s’engage à réaliser, à ses frais : la recherche sur le marché français et européen ; la présentation d’une sélection commentée sous quinze jours ouvrés ; la vérification, pour tout véhicule proposé, de l’historique accessible, du kilométrage et du vendeur ; la négociation du prix et des conditions ; l’accompagnement du Client jusqu’à la signature du contrat de vente édité par le vendeur. Il rend compte au Client de l’avancement de la recherche au moins tous les quinze jours.`}
            </P>
          </Art>

        </>
      ))}

      {/* ── Feuille 3 : obligations, responsabilité, rétractation ── */}
      {feuille(3, (
        <>
          <Art n={8} titre="Obligations du Client">
            <P>
              {`Le Client garantit la sincérité de son besoin et la disponibilité de son budget. Il répond aux propositions du mandataire dans un délai de cinq jours ouvrés. Pendant le mandat et la période de l’article 6, il traite avec les vendeurs présentés par l’intermédiaire du mandataire.`}
            </P>
          </Art>

          <Art n={9} titre="Responsabilité">
            <P>
              {`Le mandataire est tenu d’une obligation de moyens. Il ne garantit ni la découverte d’un véhicule conforme, ni un prix, ni un délai. Le vendeur du véhicule demeure seul tenu des garanties attachées à la vente : garantie légale de conformité s’il est professionnel, garantie des vices cachés. Le mandataire porte à la connaissance du Client l’ensemble des informations recueillies sur le véhicule et son vendeur.`}
            </P>
          </Art>

          <Art n={10} titre="Droit de rétractation">
            <Encadre>
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
            </Encadre>
            <CocheDoc checked={m.immediateExecution}>
              {`Le Client demande expressément l’exécution du mandat avant la fin du délai de rétractation. Il reconnaît qu’en cas de rétractation postérieure, il devra régler le montant des prestations effectivement fournies au prorata, dans la limite de ${indemnite} TTC, et que si l’achat du véhicule est conclu avant la fin du délai, le mandat est alors pleinement exécuté et il renonce expressément à son droit de rétractation (article L. 221-28, 1°, du code de la consommation).`}
            </CocheDoc>
          </Art>
        </>
      ))}

      {/* ── Feuille 4 : données, litiges, signatures, bordereau détachable ── */}
      {feuille(4, (
        <>
          <Art n={11} titre="Données personnelles">
            <P>
              {`Les données collectées sont traitées par ${emetteur.name} aux seules fins d’exécution du présent mandat et conservées trois ans après son terme. Le Client dispose d’un droit d’accès, de rectification, d’effacement et d’opposition${emetteur.email ? `, exerçable à ${emetteur.email}` : ""}, ainsi que du droit d’introduire une réclamation auprès de la CNIL.`}
            </P>
          </Art>

          <Art n={12} titre="Réclamations, médiation et litiges">
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

          <Signatures
            emetteur={emetteur}
            roleClient="Le Client"
            signerName={m.signerName}
            signedAt={m.signedAt}
            signedIp={m.signedIp}
          />

          <Bordereau
            emetteur={emetteur}
            phrase={`Je vous notifie par la présente ma rétractation du mandat de recherche n° ${m.reference} signé le __________${cible ? `, portant sur la recherche d’un véhicule ${cible}` : ""}.`}
          />

        </>
      ))}
    </div>
  );
}
