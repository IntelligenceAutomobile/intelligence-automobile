// Rendu A4 du devis — composant présentiel SANS hook (importable serveur ET client).
// Utilisé tel quel par l'aperçu live (éditeur) et par la page d'impression : rendu identique.
import type { CSSProperties } from "react";
import {
  computeTotals,
  formatEuro,
  formatDateIn,
  validUntilIn,
  docTexts,
  docTitleIn,
  lineTotal,
  lineGross,
  lineDiscount,
  blockBox,
  headerHeightFor,
  formatVin,
  formatVat,
  countryNameIn,
  fiscalRegime,
  vehicleBlockFilled,
  mergeVehicleBlock,
  type QuoteData,
  type HeaderBlockId,
  type DocLang,
} from "@/lib/devis";
import { formatNumber } from "@/lib/format";

/* Palette « papier » neutre (sur fond blanc) — l'accent est dérivé du branding. */
const C = {
  ink: "#16213A",
  muted: "#6B7280",
  border: "#D9DEE8",
  hair: "#E7EBF2",
};

// Police du document : celle du site et du back-office, avec un repli sûr sur
// les postes qui ne l'ont pas. « Segoe UI » changeait d'allure d'un ordinateur
// à l'autre, donc d'un client à l'autre.
const DOC_FONT = "'DM Sans', 'DM Sans Fallback', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

// Éclaircit/assombrit une couleur hex (factor < 1 assombrit, > 1 éclaircit).
function shade(hex: string, factor: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const c = (h: string) => clamp(parseInt(h, 16) * factor).toString(16).padStart(2, "0");
  return `#${c(m[1])}${c(m[2])}${c(m[3])}`;
}

// Teinte pastel : mélange la couleur vers le blanc (keep = part de couleur conservée).
function tint(hex: string, keep: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const c = (h: string) => Math.round(parseInt(h, 16) * keep + 255 * (1 - keep)).toString(16).padStart(2, "0");
  return `#${c(m[1])}${c(m[2])}${c(m[3])}`;
}

const labelMini: CSSProperties = {
  fontSize: "7.5pt",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: C.muted,
};

// Chiffres à largeur égale : les virgules s'alignent d'une ligne à l'autre.
const tabular: CSSProperties = { fontVariantNumeric: "tabular-nums" };

export default function DevisDocument({
  quote,
  editable = false,
  onLogoPointerDown,
  onBlockPointerDown,
  onBlockResizePointerDown,
}: {
  quote: QuoteData;
  editable?: boolean;
  onLogoPointerDown?: (e: React.PointerEvent<HTMLImageElement>) => void;
  onBlockPointerDown?: (id: HeaderBlockId, e: React.PointerEvent) => void;
  onBlockResizePointerDown?: (id: HeaderBlockId, e: React.PointerEvent) => void;
}) {
  const t = computeTotals(quote);
  const b = quote.branding;
  const addrLines = b.emitterAddress.split("\n").map((l) => l.trim()).filter(Boolean);
  // Les colonnes s'annoncent hors taxe dès que les montants le sont : en
  // livraison intracommunautaire, la TVA n'apparaît pas mais le prix est bien HT.
  const showHT = t.htLabels;
  // Régime de TVA : mention obligatoire à imprimer sous le total.
  const fiscal = fiscalRegime(quote);

  // Langue du document : seule la feuille remise au client bascule, le
  // back-office reste en français.
  const lang: DocLang = quote.docLang === "en" ? "en" : "fr";
  const L = docTexts(lang);
  const jour = (iso: string) => formatDateIn(lang, iso);

  // Type de document (facture vs devis) et libellés associés.
  const docType = quote.docType ?? "devis";
  const factureKind = quote.factureKind ?? "complete";
  const isAvoir = docType === "avoir";
  const isFacture = docType === "facture";
  const isSolde = isFacture && factureKind === "solde";
  const paid = isFacture && quote.paymentStatus === "payee";

  // Titre à taille CONSTANTE : la qualification passe sur une seconde ligne.
  // La taille variable donnait « FACTURE D'ACOMPTE » deux fois plus petit que « DEVIS ».
  const full = docTitleIn(lang, docType, factureKind);
  const title = isAvoir ? L.avoir : isFacture ? L.facture : L.devis;
  const subtitle = full !== title ? full.slice(title.length).trim() : "";

  const logoJustify = b.logoAlign === "center" ? "center" : b.logoAlign === "right" ? "flex-end" : "flex-start";
  const logoFree = b.logoX != null && b.logoY != null;
  const logoCursor = onLogoPointerDown ? "move" : "default";
  const logoSrc = b.logoUrl || "";
  // Réserve blanche : le logo devient une silhouette claire sur fond coloré.
  const logoFilter = b.logoWhite ? "brightness(0) invert(1)" : undefined;

  // Palette dérivée de l'accent + du thème.
  const accent = b.accentColor || "#1E4FA3";
  const theme = b.theme;
  // « Coloré » : bandeau plein sur toute la zone d'en-tête, texte en réserve blanche.
  const onBand = theme === "colored";
  const headInk = onBand ? "#FFFFFF" : C.ink;
  const headMuted = onBand ? "rgba(255,255,255,0.78)" : C.muted;
  const titleColor = onBand ? "#FFFFFF" : accent;

  // Tableau : un seul filet clair, jamais de zébrure en plus.
  const rowRule = theme === "minimal" ? C.hair : C.border;
  const thBg = theme === "colored" ? shade(accent, 0.55) : theme === "minimal" ? "transparent" : shade(accent, 0.38);
  const thFg = theme === "minimal" ? C.ink : "#FFFFFF";
  const thRule = theme === "minimal" ? `1.5pt solid ${accent}` : undefined;

  const headerH = headerHeightFor(quote);
  const dueDate = validUntilIn(lang, quote.issueDate, quote.validityDays);
  // Devis d'avant l'encart : la valeur manque, le repli la remplace par un bloc
  // vide, donc masqué.
  const vehicule = mergeVehicleBlock(quote.vehicle);

  // Style/handlers communs d'un bloc d'en-tête déplaçable + redimensionnable.
  function blockWrap(id: HeaderBlockId): CSSProperties {
    const box = blockBox(b, id);
    return {
      position: "absolute",
      left: `${box.x}mm`,
      top: `${box.y}mm`,
      width: `${box.w}mm`,
      cursor: editable ? "move" : "default",
      outline: editable ? `1px dashed ${onBand ? "rgba(255,255,255,0.45)" : tint(accent, 0.45)}` : undefined,
      outlineOffset: "2px",
      touchAction: "none",
      zIndex: 2,
    };
  }
  function resizeHandle(id: HeaderBlockId) {
    if (!editable || !onBlockResizePointerDown) return null;
    return (
      <div
        onPointerDown={(e) => { e.stopPropagation(); onBlockResizePointerDown(id, e); }}
        style={{ position: "absolute", right: "-4px", top: "50%", transform: "translateY(-50%)", width: 9, height: 22, background: onBand ? "#FFFFFF" : accent, cursor: "ew-resize", touchAction: "none" }}
      />
    );
  }

  return (
    <div
      className="devis-sheet"
      style={{
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#FFFFFF",
        color: C.ink,
        padding: "15mm 16mm",
        boxSizing: "border-box",
        fontFamily: DOC_FONT,
        fontSize: "10pt",
        lineHeight: 1.45,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* ── Zone en-tête : mise en page libre (blocs déplaçables) ── */}
      <div
        style={{
          position: "relative",
          height: `${headerH}mm`,
          marginBottom: "4mm",
          outline: editable ? `1px dashed ${onBand ? "rgba(255,255,255,0.3)" : "rgba(30,79,163,0.18)"}` : undefined,
        }}
      >
        {/* Bandeau plein du thème « Coloré », débordant les marges de la feuille */}
        {onBand && (
          <div
            style={{
              position: "absolute",
              left: "-16mm",
              right: "-16mm",
              top: "-15mm",
              bottom: "-4mm",
              backgroundColor: accent,
              zIndex: 0,
            }}
          />
        )}
        {/* Filet d'accent du thème « Classique » */}
        {theme === "classic" && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "2pt", backgroundColor: accent, zIndex: 1 }} />
        )}

        {/* Logo : position libre (absolue) ou auto (alignée en haut) */}
        {b.logoVisible && logoSrc &&
          (logoFree ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={b.emitterName}
              onPointerDown={onLogoPointerDown}
              draggable={false}
              style={{ position: "absolute", left: `${b.logoX}mm`, top: `${b.logoY}mm`, height: `${b.logoSize}mm`, objectFit: "contain", cursor: logoCursor, userSelect: "none", touchAction: "none", zIndex: 5, filter: logoFilter }}
            />
          ) : (
            <div style={{ display: "flex", justifyContent: logoJustify, position: "relative", zIndex: 5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt={b.emitterName}
                onPointerDown={onLogoPointerDown}
                draggable={false}
                style={{ height: `${b.logoSize}mm`, objectFit: "contain", cursor: logoCursor, userSelect: "none", touchAction: "none", filter: logoFilter }}
              />
            </div>
          ))}

        {/* Émetteur */}
        <div style={blockWrap("emitter")} onPointerDown={onBlockPointerDown ? (e) => onBlockPointerDown("emitter", e) : undefined}>
          <div style={{ fontWeight: 700, fontSize: "11pt", color: headInk }}>{b.emitterName}</div>
          <div style={{ color: headMuted, fontSize: "8.5pt", marginTop: "1.5mm" }}>
            {addrLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
            {b.emitterRepresentative && <div>{b.emitterRepresentative}</div>}
            {b.emitterSiret && <div>SIRET : {b.emitterSiret}</div>}
            {b.emitterTva && <div>TVA : {b.emitterTva}</div>}
            {b.emitterEmail && <div>{b.emitterEmail}</div>}
            {b.emitterPhone && <div>{b.emitterPhone}</div>}
          </div>
          {resizeHandle("emitter")}
        </div>

        {/* Bloc titre + métadonnées */}
        <div style={{ ...blockWrap("meta"), textAlign: "right" }} onPointerDown={onBlockPointerDown ? (e) => onBlockPointerDown("meta", e) : undefined}>
          <div style={{ fontSize: "16pt", fontWeight: 300, letterSpacing: "0.18em", color: titleColor, lineHeight: 1.1 }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: "9pt", fontWeight: 400, letterSpacing: "0.06em", color: onBand ? "rgba(255,255,255,0.85)" : C.muted, marginTop: "0.5mm" }}>
              {subtitle}
            </div>
          )}
          <div style={{ width: 38, height: 2, backgroundColor: onBand ? "#FFFFFF" : accent, marginLeft: "auto", marginTop: "2mm", marginBottom: "3mm" }} />
          <table style={{ marginLeft: "auto", fontSize: "8.5pt", borderCollapse: "collapse" }}>
            <tbody>
              {quote.number && (
                <tr>
                  <td style={{ ...labelMini, color: headMuted, paddingRight: "4mm", textAlign: "right" }}>{L.number}</td>
                  <td style={{ fontWeight: 600, color: headInk, ...tabular }}>{quote.number}</td>
                </tr>
              )}
              <tr>
                <td style={{ ...labelMini, color: headMuted, paddingRight: "4mm", textAlign: "right" }}>{L.date}</td>
                <td style={{ color: headInk }}>{jour(quote.issueDate)}</td>
              </tr>
              {/* Un avoir n'existe que par la facture qu'il corrige : sa
                  référence est une mention attendue par le comptable. */}
              {isAvoir && quote.sourceNumber && (
                <tr>
                  <td style={{ ...labelMini, color: headMuted, paddingRight: "4mm", textAlign: "right" }}>{L.onInvoice}</td>
                  <td style={{ fontWeight: 600, color: headInk, ...tabular }}>{quote.sourceNumber}</td>
                </tr>
              )}
              {quote.validityDays > 0 && (
                <tr>
                  <td style={{ ...labelMini, color: headMuted, paddingRight: "4mm", textAlign: "right" }}>
                    {isFacture ? L.dueDate : L.validity}
                  </td>
                  <td style={{ color: headInk }}>{dueDate}</td>
                </tr>
              )}
            </tbody>
          </table>
          {paid && (
            <div style={{ display: "inline-block", marginTop: "3mm", padding: "1mm 3mm", border: "1.5px solid #0F8A6A", color: "#0F8A6A", backgroundColor: "#FFFFFF", fontSize: "9pt", fontWeight: 700, letterSpacing: "0.12em", transform: "rotate(-4deg)" }}>
              {L.paid}{quote.paidDate ? ` — ${jour(quote.paidDate)}` : ""}
            </div>
          )}
          {resizeHandle("meta")}
        </div>

        {/* Destinataire */}
        <div style={blockWrap("client")} onPointerDown={onBlockPointerDown ? (e) => onBlockPointerDown("client", e) : undefined}>
          <PartyBox label={L.client} accent={accent} onBand={onBand}>
            {quote.clientName || quote.clientCompany ? (
              <>
                {quote.clientCompany && <div style={{ fontWeight: 600, color: headInk }}>{quote.clientCompany}</div>}
                {quote.clientName && <div style={{ fontWeight: quote.clientCompany ? 400 : 600, color: headInk }}>{quote.clientName}</div>}
                <div style={{ color: headMuted, fontSize: "8.5pt", marginTop: "1mm" }}>
                  {quote.clientAddress && <div style={{ whiteSpace: "pre-line" }}>{quote.clientAddress}</div>}
                  {/* Le pays s'imprime dès qu'il sort de France : une adresse
                      belge sans mention de pays ne justifie aucune exonération. */}
                  {quote.clientCountry && quote.clientCountry !== "FR" && <div>{countryNameIn(lang, quote.clientCountry)}</div>}
                  {/* Le numéro de TVA du preneur est une mention obligatoire de
                      la livraison intracommunautaire. */}
                  {quote.clientVatNumber && <div style={{ ...tabular }}>{L.vatNo} {formatVat(quote.clientVatNumber)}</div>}
                  {quote.clientEmail && <div>{quote.clientEmail}</div>}
                  {quote.clientPhone && <div>{quote.clientPhone}</div>}
                </div>
              </>
            ) : (
              <div style={{ color: onBand ? "rgba(255,255,255,0.6)" : "#B9C0CC", fontStyle: "italic", fontSize: "8.5pt" }}>{L.clientPlaceholder}</div>
            )}
          </PartyBox>
          {resizeHandle("client")}
        </div>
      </div>

      {/* ── Véhicule concerné ──
          Un devis d'automobile désigne SA voiture : numéro de série,
          immatriculation, première mise en circulation. Sans cet encart, le
          document annonçait une marque, un modèle et un prix, rien de plus. */}
      {vehicule.show && vehicleBlockFilled(vehicule) && (
        <div
          className="devis-avoid-break"
          style={{
            display: "flex",
            gap: "5mm",
            marginTop: "7mm",
            padding: "4mm",
            border: `1px solid ${C.border}`,
            borderLeft: `2.5px solid ${accent}`,
            backgroundColor: tint(accent, 0.03),
          }}
        >
          {vehicule.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicule.photoUrl}
              alt=""
              style={{ width: "42mm", height: "28mm", objectFit: "cover", flexShrink: 0, border: `1px solid ${C.border}` }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...labelMini, color: accent, marginBottom: "1.5mm" }}>{L.vehicle}</div>
            {vehicule.label && (
              <div style={{ fontWeight: 700, fontSize: "11pt", color: C.ink, marginBottom: "2mm" }}>{vehicule.label}</div>
            )}
            <table style={{ borderCollapse: "collapse", fontSize: "8.5pt", width: "100%" }}>
              <tbody>
                <VehiculeRow label={L.vin} value={vehicule.vin ? formatVin(vehicule.vin) : ""} mono />
                <VehiculeRow label={L.plate} value={vehicule.plate} mono />
                <VehiculeRow label={L.firstReg} value={vehicule.firstRegDate ? jour(vehicule.firstRegDate) : ""} />
                <VehiculeRow label={L.mileage} value={vehicule.mileageKm > 0 ? `${formatNumber(vehicule.mileageKm)} km` : ""} />
                <VehiculeRow label={L.energy} value={vehicule.energy} />
                <VehiculeRow label={L.colour} value={vehicule.color} />
                <VehiculeRow label={L.origin} value={vehicule.origin} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tableau des lignes ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8mm", fontSize: "9pt" }}>
        <thead>
          <tr style={{ backgroundColor: thBg, color: thFg, borderBottom: thRule }}>
            <th style={thCell("left")}>{L.designation}</th>
            <th style={{ ...thCell("right"), width: "16mm" }}>{L.qty}</th>
            <th style={{ ...thCell("right"), width: "30mm" }}>{showHT ? L.unitPriceHT : L.unitPrice}</th>
            <th style={{ ...thCell("right"), width: "32mm" }}>{showHT ? L.lineTotalHT : L.lineTotal}</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ ...tdCell("left", rowRule), color: "#B9C0CC", fontStyle: "italic", textAlign: "center", padding: "8mm" }}>
                {L.emptyLines}
              </td>
            </tr>
          ) : (
            quote.items.map((it) => {
              const disc = lineDiscount(it);
              const net = lineTotal(it);
              const deduction = net < 0;
              return (
                <tr key={it.id}>
                  <td style={{ ...tdCell("left", rowRule), paddingLeft: deduction ? "6mm" : undefined }}>
                    <div style={{ fontWeight: 600, color: deduction ? accent : C.ink }}>{it.designation || "—"}</div>
                    {it.detail && <div style={{ color: C.muted, fontSize: "8pt", marginTop: "0.5mm", whiteSpace: "pre-line" }}>{it.detail}</div>}
                    {disc > 0 && (
                      <div style={{ color: accent, fontSize: "8pt", marginTop: "0.5mm" }}>
                        {L.discount} {it.discountKind === "amount" ? formatEuro(it.discount || 0) : `${it.discount} %`} (−{formatEuro(disc)})
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdCell("right", rowRule), ...tabular }}>
                    {it.qty}
                    {it.unit ? ` ${it.unit}` : ""}
                  </td>
                  <td style={{ ...tdCell("right", rowRule), ...tabular }}>{formatEuro(it.unitPrice)}</td>
                  <td style={{ ...tdCell("right", rowRule), ...tabular, fontWeight: 600, whiteSpace: "nowrap", color: deduction ? accent : C.ink }}>
                    {disc > 0 && <span style={{ display: "block", color: "#AEB6C2", textDecoration: "line-through", fontWeight: 400, fontSize: "8pt" }}>{formatEuro(lineGross(it))}</span>}
                    {formatEuro(net)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* ── Totaux ── */}
      <div className="devis-avoid-break" style={{ display: "flex", justifyContent: "flex-end", marginTop: "6mm" }}>
        <table style={{ width: "84mm", borderCollapse: "collapse", fontSize: "9.5pt" }}>
          <tbody>
            {t.showTva && (
              <>
                <SubRow label={L.totalHT} value={formatEuro(t.totalHT)} />
                <SubRow label={`${L.vat} ${quote.tvaRate} %`} value={formatEuro(t.tvaAmount)} />
              </>
            )}
            {/* Livraison intracommunautaire : la ligne de TVA dit explicitement
                pourquoi elle est à zéro, sinon le client la croit oubliée. */}
            {quote.tvaMode === "intracom" && (
              <SubRow label={L.vatFrance} value="0,00 €" />
            )}
            {/* Le prix domine la page : bloc plein, pas une ligne de plus. */}
            <GrandRow
              label={
                isAvoir
                  ? L.creditAmount
                  : isSolde
                    ? L.balanceToPay
                    : isFacture
                      ? L.netToPay
                      : t.showTva
                        ? L.totalTTC
                        : quote.tvaMode === "intracom"
                          ? L.totalHT
                          : L.total
              }
              value={formatEuro(t.deposit > 0 && isSolde ? t.balance : t.totalTTC)}
              accent={accent}
              minimal={theme === "minimal"}
            />
            {/* Mention obligatoire du régime : sans base légale imprimée, une
                vente sans TVA se requalifie et la TVA retombe sur le vendeur. */}
            {fiscal.mention && (
              <tr>
                <td colSpan={2} style={{ fontSize: "7.5pt", color: C.muted, paddingTop: "1.5mm", lineHeight: 1.4 }}>
                  {/* Document en anglais : la traduction passe devant, la version
                      française reste imprimée car c'est elle qui fait foi. */}
                  {lang === "en" && fiscal.mentionEn ? (
                    <>
                      {fiscal.mentionEn}
                      <span style={{ display: "block", fontStyle: "italic" }}>{fiscal.mention}</span>
                    </>
                  ) : (
                    fiscal.mention
                  )}
                </td>
              </tr>
            )}
            {/* Sur un avoir, le client doit savoir ce que devient ce montant. */}
            {isAvoir && (
              <tr>
                <td colSpan={2} style={{ fontSize: "7.5pt", color: C.muted, paddingTop: "1.5mm", lineHeight: 1.4 }}>
                  {L.creditNote}
                </td>
              </tr>
            )}
            {t.deposit > 0 && !isSolde && (
              <>
                <SubRow
                  label={quote.depositMode === "percent" ? `${L.depositPercent} ${quote.depositValue} %` : L.depositToPay}
                  value={formatEuro(t.deposit)}
                  spaced
                  strong
                />
                <SubRow label={isFacture ? L.remaining : L.balanceOnDelivery} value={formatEuro(t.balance)} />
              </>
            )}
            {t.deposit > 0 && isSolde && (
              <SubRow label={L.depositInvoiced} value={`− ${formatEuro(t.deposit)}`} spaced />
            )}
          </tbody>
        </table>
      </div>

      {/* ── Conditions / notes ── */}
      {(quote.paymentTerms || quote.notes) && (
        <div style={{ marginTop: "9mm" }}>
          <SectionTitle color={accent}>{isAvoir ? L.reason : L.conditions}</SectionTitle>
          {quote.paymentTerms && (
            <div style={{ display: "flex", gap: "5mm", marginTop: "2mm", fontSize: "9pt" }}>
              {/* Sur un avoir, ce champ porte le motif : il n'y a pas de
                  conditions de règlement à énoncer sur un crédit. Le titre de la
                  section le dit déjà, la colonne d'étiquette reste vide. */}
              <div style={{ ...labelMini, width: "32mm", flexShrink: 0 }}>{isAvoir ? "" : L.payment}</div>
              <div style={{ whiteSpace: "pre-line" }}>{quote.paymentTerms}</div>
            </div>
          )}
          {quote.notes && (
            <div style={{ display: "flex", gap: "5mm", marginTop: "2mm", fontSize: "9pt" }}>
              <div style={{ ...labelMini, width: "32mm", flexShrink: 0 }}>{L.notes}</div>
              <div style={{ whiteSpace: "pre-line" }}>{quote.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Mentions obligatoires d'une facture ── */}
      {isFacture && (
        <div className="devis-avoid-break" style={{ marginTop: "6mm", fontSize: "7.5pt", color: C.muted, lineHeight: 1.45 }}>
          {L.lateMention}
        </div>
      )}

      {/* ── Signatures (devis uniquement : ni une facture ni un avoir ne se signent) ── */}
      {!isFacture && !isAvoir && (
        <div className="devis-avoid-break" style={{ display: "flex", justifyContent: "space-between", gap: "12mm", marginTop: "10mm" }}>
          <SignatureBox title={`${L.signatureFor} ${b.emitterName}`} name={b.emitterRepresentative} hint={L.signatureHint} />
          <SignatureBox title={L.agreement} hint={L.signatureHint} />
        </div>
      )}

      {/* ── Pied de page : identité, règlement, mention légale ── */}
      <div
        className="devis-avoid-break"
        style={{
          marginTop: "auto",
          paddingTop: "5mm",
          borderTop: `1.5pt solid ${accent}`,
          color: C.muted,
          fontSize: "7pt",
          lineHeight: 1.45,
          display: "flex",
          gap: "8mm",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ ...labelMini, fontSize: "6.5pt", marginBottom: "1mm" }}>{L.emitter}</div>
          <div style={{ color: C.ink, fontWeight: 600 }}>{b.emitterName}</div>
          {b.emitterSiret && <div>{L.siret} {b.emitterSiret}</div>}
          {b.emitterTva && <div>{L.vatNo} {b.emitterTva}</div>}
        </div>
        {(b.emitterIban || b.emitterBic || b.emitterBank) && (
          <div style={{ flex: 1 }}>
            <div style={{ ...labelMini, fontSize: "6.5pt", marginBottom: "1mm" }}>{L.payment}</div>
            {b.emitterBank && <div>{b.emitterBank}</div>}
            {b.emitterIban && <div style={{ ...tabular, wordSpacing: "0.05em" }}>{L.iban} {b.emitterIban}</div>}
            {b.emitterBic && <div style={tabular}>{L.bic} {b.emitterBic}</div>}
          </div>
        )}
        <div style={{ flex: 1.4 }}>
          <div style={{ ...labelMini, fontSize: "6.5pt", marginBottom: "1mm" }}>{L.legal}</div>
          <div>{b.legalFootnote}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Sous-composants ── */
function PartyBox({ label, accent, onBand, children }: { label: string; accent?: string; onBand?: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${onBand ? "rgba(255,255,255,0.35)" : C.border}`,
        borderLeft: onBand ? "2.5px solid #FFFFFF" : accent ? `2.5px solid ${accent}` : `1px solid ${C.border}`,
        padding: "4mm 5mm",
        backgroundColor: onBand ? "rgba(255,255,255,0.10)" : accent ? tint(accent, 0.035) : undefined,
      }}
    >
      <div style={{ ...labelMini, marginBottom: "2mm", color: onBand ? "rgba(255,255,255,0.85)" : accent ?? C.muted }}>{label}</div>
      {children}
    </div>
  );
}

// Ligne de l'encart véhicule : disparaît quand l'information manque, plutôt que
// d'imprimer une étiquette suivie d'un vide.
function VehiculeRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <tr>
      <td style={{ ...labelMini, fontSize: "7pt", paddingRight: "4mm", paddingBottom: "0.8mm", whiteSpace: "nowrap", verticalAlign: "top", width: "36mm" }}>
        {label}
      </td>
      <td style={{ color: C.ink, paddingBottom: "0.8mm", fontWeight: mono ? 600 : 400, ...(mono ? tabular : {}) }}>{value}</td>
    </tr>
  );
}

function SectionTitle({ children, color = "#1E4FA3" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ ...labelMini, color, borderBottom: `1px solid ${C.border}`, paddingBottom: "1.5mm" }}>
      {children}
    </div>
  );
}

// Ligne secondaire des totaux (HT, TVA, acompte).
function SubRow({ label, value, spaced, strong }: { label: string; value: string; spaced?: boolean; strong?: boolean }) {
  const pad: CSSProperties = { padding: "1mm 2.5mm", paddingTop: spaced ? "3.5mm" : undefined, whiteSpace: "nowrap" };
  return (
    <tr>
      <td style={{ ...pad, color: strong ? C.ink : C.muted, fontWeight: strong ? 600 : 400 }}>{label}</td>
      <td style={{ ...pad, ...tabular, textAlign: "right", color: strong ? C.ink : C.muted, fontWeight: strong ? 700 : 600 }}>{value}</td>
    </tr>
  );
}

// Montant principal : bloc plein, le chiffre le plus gros de la page.
function GrandRow({ label, value, accent, minimal }: { label: string; value: string; accent: string; minimal?: boolean }) {
  const bg = minimal ? "transparent" : accent;
  const fg = minimal ? C.ink : "#FFFFFF";
  const cell: CSSProperties = {
    backgroundColor: bg,
    color: fg,
    padding: "2.5mm 3mm",
    borderTop: minimal ? `2pt solid ${accent}` : undefined,
    borderBottom: minimal ? `2pt solid ${accent}` : undefined,
  };
  return (
    <tr>
      <td style={{ ...cell, ...labelMini, color: minimal ? C.muted : "rgba(255,255,255,0.85)", verticalAlign: "middle" }}>{label}</td>
      <td style={{ ...cell, ...tabular, textAlign: "right", fontSize: "17pt", fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.1 }}>{value}</td>
    </tr>
  );
}

function SignatureBox({ title, name, hint }: { title: string; name?: string; hint?: string }) {
  return (
    <div style={{ width: "45%" }}>
      <div style={{ ...labelMini, marginBottom: "1.5mm" }}>
        {title}
        <div style={{ textTransform: "none", letterSpacing: 0, color: C.muted, fontSize: "7.5pt", marginTop: "0.5mm" }}>
          {hint ?? "Date, signature et cachet"}
        </div>
      </div>
      <div
        style={{
          border: `1px solid ${C.border}`,
          height: "20mm",
          backgroundColor: "#FBFCFE",
          display: "flex",
          alignItems: "flex-end",
          padding: "1.5mm 2.5mm",
          fontSize: "8pt",
          color: C.muted,
        }}
      >
        {name ?? " "}
      </div>
    </div>
  );
}

function thCell(align: "left" | "right"): CSSProperties {
  return { textAlign: align, padding: "2.5mm 3mm", fontSize: "8pt", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 };
}
function tdCell(align: "left" | "right", rule: string): CSSProperties {
  // Hauteur minimale de ligne : le tableau respire même sur des libellés courts.
  return { textAlign: align, padding: "2.8mm 3mm", borderBottom: `1px solid ${rule}`, verticalAlign: "top", height: "9mm" };
}
