// Rendu A4 du devis — composant présentiel SANS hook (importable serveur ET client).
// Utilisé tel quel par l'aperçu live (éditeur) et par la page d'impression : rendu identique.
import type { CSSProperties } from "react";
import { COMPANY } from "@/lib/company";
import {
  computeTotals,
  formatEuro,
  formatDateFr,
  validUntilFr,
  docTitle,
  lineTotal,
  lineGross,
  lineDiscount,
  blockBox,
  type QuoteData,
  type HeaderBlockId,
} from "@/lib/devis";

/* Palette « papier » neutre (sur fond blanc) — l'accent est dérivé du branding. */
const C = {
  ink: "#16213A",
  muted: "#6B7280",
  border: "#D9DEE8",
  zebra: "#F5F7FB",
};

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
  const showHT = t.showTva;

  // Type de document (facture vs devis) et libellés associés.
  const docType = quote.docType ?? "devis";
  const factureKind = quote.factureKind ?? "complete";
  const isFacture = docType === "facture";
  const isSolde = isFacture && factureKind === "solde";
  const paid = isFacture && quote.paymentStatus === "payee";
  const title = docTitle(docType, factureKind);
  const titleFont = title.length > 8 ? "12.5pt" : "20pt"; // « FACTURE D'ACOMPTE » tient sur une ligne
  const titleSpacing = title.length > 8 ? "0.08em" : "0.18em";
  const logoJustify = b.logoAlign === "center" ? "center" : b.logoAlign === "right" ? "flex-end" : "flex-start";
  const logoFree = b.logoX != null && b.logoY != null;
  const logoCursor = onLogoPointerDown ? "move" : "default";

  // Palette dérivée de l'accent + du thème.
  const accent = b.accentColor || "#1E4FA3";
  const headBg = b.theme === "colored" ? accent : b.theme === "minimal" ? "transparent" : shade(accent, 0.38);
  const headFg = b.theme === "minimal" ? C.ink : "#FFFFFF";
  const headBorder = b.theme === "minimal" ? `2px solid ${accent}` : undefined;
  const zebra = b.theme === "minimal" ? "transparent" : C.zebra;

  // Style/handlers communs d'un bloc d'en-tête déplaçable + redimensionnable.
  function blockWrap(id: HeaderBlockId): CSSProperties {
    const box = blockBox(b, id);
    return {
      position: "absolute",
      left: `${box.x}mm`,
      top: `${box.y}mm`,
      width: `${box.w}mm`,
      cursor: editable ? "move" : "default",
      outline: editable ? "1px dashed rgba(30,79,163,0.35)" : undefined,
      outlineOffset: "2px",
      touchAction: "none",
    };
  }
  function resizeHandle(id: HeaderBlockId) {
    if (!editable || !onBlockResizePointerDown) return null;
    return (
      <div
        onPointerDown={(e) => { e.stopPropagation(); onBlockResizePointerDown(id, e); }}
        style={{ position: "absolute", right: "-4px", top: "50%", transform: "translateY(-50%)", width: 9, height: 22, background: accent, borderRadius: 2, cursor: "ew-resize", touchAction: "none" }}
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
        fontFamily: "'Segoe UI', system-ui, -apple-system, Arial, sans-serif",
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
          height: `${b.headerHeight}mm`,
          marginBottom: "4mm",
          outline: editable ? "1px dashed rgba(30,79,163,0.18)" : undefined,
        }}
      >
        {/* Logo : position libre (absolue) ou auto (alignée en haut) */}
        {b.logoVisible &&
          (logoFree ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={COMPANY.logoSrc}
              alt={b.emitterName}
              onPointerDown={onLogoPointerDown}
              draggable={false}
              style={{ position: "absolute", left: `${b.logoX}mm`, top: `${b.logoY}mm`, height: `${b.logoSize}mm`, objectFit: "contain", cursor: logoCursor, userSelect: "none", touchAction: "none", zIndex: 5 }}
            />
          ) : (
            <div style={{ display: "flex", justifyContent: logoJustify }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={COMPANY.logoSrc}
                alt={b.emitterName}
                onPointerDown={onLogoPointerDown}
                draggable={false}
                style={{ height: `${b.logoSize}mm`, objectFit: "contain", cursor: logoCursor, userSelect: "none", touchAction: "none" }}
              />
            </div>
          ))}

        {/* Émetteur */}
        <div style={blockWrap("emitter")} onPointerDown={onBlockPointerDown ? (e) => onBlockPointerDown("emitter", e) : undefined}>
          <div style={{ fontWeight: 700, fontSize: "11pt" }}>{b.emitterName}</div>
          <div style={{ color: C.muted, fontSize: "8.5pt", marginTop: "1.5mm" }}>
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
          <div style={{ fontSize: titleFont, fontWeight: 300, letterSpacing: titleSpacing, color: accent }}>{title}</div>
          <div style={{ width: 38, height: 2, backgroundColor: accent, marginLeft: "auto", marginTop: "2mm", marginBottom: "3mm" }} />
          <table style={{ marginLeft: "auto", fontSize: "8.5pt", borderCollapse: "collapse" }}>
            <tbody>
              {quote.number && (
                <tr>
                  <td style={{ ...labelMini, paddingRight: "4mm", textAlign: "right" }}>N°</td>
                  <td style={{ fontWeight: 600 }}>{quote.number}</td>
                </tr>
              )}
              <tr>
                <td style={{ ...labelMini, paddingRight: "4mm", textAlign: "right" }}>Date</td>
                <td>{formatDateFr(quote.issueDate)}</td>
              </tr>
              {!isFacture && (
                <tr>
                  <td style={{ ...labelMini, paddingRight: "4mm", textAlign: "right" }}>Validité</td>
                  <td>{validUntilFr(quote.issueDate, quote.validityDays)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {paid && (
            <div style={{ display: "inline-block", marginTop: "3mm", padding: "1mm 3mm", border: "1.5px solid #0F8A6A", color: "#0F8A6A", fontSize: "9pt", fontWeight: 700, letterSpacing: "0.12em", transform: "rotate(-4deg)" }}>
              PAYÉE{quote.paidDate ? ` — ${formatDateFr(quote.paidDate)}` : ""}
            </div>
          )}
          {resizeHandle("meta")}
        </div>

        {/* Destinataire */}
        <div style={blockWrap("client")} onPointerDown={onBlockPointerDown ? (e) => onBlockPointerDown("client", e) : undefined}>
          <PartyBox label="Client" accent={accent}>
            {quote.clientName || quote.clientCompany ? (
              <>
                {quote.clientCompany && <div style={{ fontWeight: 600 }}>{quote.clientCompany}</div>}
                {quote.clientName && <div style={{ fontWeight: quote.clientCompany ? 400 : 600 }}>{quote.clientName}</div>}
                <div style={{ color: C.muted, fontSize: "8.5pt", marginTop: "1mm" }}>
                  {quote.clientAddress && <div style={{ whiteSpace: "pre-line" }}>{quote.clientAddress}</div>}
                  {quote.clientEmail && <div>{quote.clientEmail}</div>}
                  {quote.clientPhone && <div>{quote.clientPhone}</div>}
                </div>
              </>
            ) : (
              <div style={{ color: "#B9C0CC", fontStyle: "italic", fontSize: "8.5pt" }}>Coordonnées du client…</div>
            )}
          </PartyBox>
          {resizeHandle("client")}
        </div>
      </div>

      {/* ── Tableau des lignes ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8mm", fontSize: "9pt" }}>
        <thead>
          <tr style={{ backgroundColor: headBg, color: headFg, borderBottom: headBorder }}>
            <th style={thCell("left")}>Désignation</th>
            <th style={{ ...thCell("right"), width: "16mm" }}>Qté</th>
            <th style={{ ...thCell("right"), width: "30mm" }}>{showHT ? "P.U. HT" : "P.U."}</th>
            <th style={{ ...thCell("right"), width: "32mm" }}>{showHT ? "Total HT" : "Total"}</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ ...tdCell("left"), color: "#B9C0CC", fontStyle: "italic", textAlign: "center", padding: "8mm" }}>
                Ajoutez une ligne (véhicule du stock ou prestation libre)…
              </td>
            </tr>
          ) : (
            quote.items.map((it, i) => {
              const disc = lineDiscount(it);
              return (
                <tr key={it.id} style={{ backgroundColor: i % 2 ? zebra : "transparent" }}>
                  <td style={tdCell("left")}>
                    <div style={{ fontWeight: 600 }}>{it.designation || "—"}</div>
                    {it.detail && <div style={{ color: C.muted, fontSize: "8pt", marginTop: "0.5mm", whiteSpace: "pre-line" }}>{it.detail}</div>}
                    {disc > 0 && (
                      <div style={{ color: accent, fontSize: "8pt", marginTop: "0.5mm" }}>
                        Remise {it.discountKind === "amount" ? formatEuro(it.discount || 0) : `${it.discount} %`} (−{formatEuro(disc)})
                      </div>
                    )}
                  </td>
                  <td style={tdCell("right")}>
                    {it.qty}
                    {it.unit ? ` ${it.unit}` : ""}
                  </td>
                  <td style={tdCell("right")}>{formatEuro(it.unitPrice)}</td>
                  <td style={{ ...tdCell("right"), fontWeight: 600, whiteSpace: "nowrap" }}>
                    {disc > 0 && <span style={{ display: "block", color: "#AEB6C2", textDecoration: "line-through", fontWeight: 400, fontSize: "8pt" }}>{formatEuro(lineGross(it))}</span>}
                    {formatEuro(lineTotal(it))}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* ── Totaux ── */}
      <div className="devis-avoid-break" style={{ display: "flex", justifyContent: "flex-end", marginTop: "6mm" }}>
        <table style={{ width: "78mm", borderCollapse: "collapse", fontSize: "9.5pt" }}>
          <tbody>
            {showHT ? (
              <>
                <TotalRow label="Total HT" value={formatEuro(t.totalHT)} />
                <TotalRow label={`TVA ${quote.tvaRate} %`} value={formatEuro(t.tvaAmount)} />
                <TotalRow label="Total TTC" value={formatEuro(t.totalTTC)} grand barColor={accent} />
              </>
            ) : (
              <>
                <TotalRow label="Total" value={formatEuro(t.totalTTC)} grand barColor={accent} />
                <tr>
                  <td colSpan={2} style={{ fontSize: "7.5pt", color: C.muted, paddingTop: "1mm" }}>
                    {quote.tvaMode === "marge"
                      ? "TVA sur marge — non récupérable (art. 297 A du CGI)."
                      : "Opération exonérée de TVA."}
                  </td>
                </tr>
              </>
            )}
            {t.deposit > 0 && (
              <>
                <TotalRow
                  label={
                    isSolde
                      ? "Acompte déjà facturé"
                      : quote.depositMode === "percent"
                        ? `Acompte (${quote.depositValue} %)`
                        : "Acompte"
                  }
                  value={isSolde ? `− ${formatEuro(t.deposit)}` : formatEuro(t.deposit)}
                  spaced
                />
                <TotalRow label={isSolde ? "Solde à payer" : isFacture ? "Net à payer" : "Solde"} value={formatEuro(t.balance)} grand={isSolde} barColor={accent} />
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Conditions / notes ── */}
      {(quote.paymentTerms || quote.notes) && (
        <div style={{ marginTop: "9mm" }}>
          <SectionTitle color={accent}>Conditions</SectionTitle>
          {quote.paymentTerms && (
            <div style={{ display: "flex", gap: "5mm", marginTop: "2mm", fontSize: "9pt" }}>
              <div style={{ ...labelMini, width: "32mm", flexShrink: 0 }}>Règlement</div>
              <div style={{ whiteSpace: "pre-line" }}>{quote.paymentTerms}</div>
            </div>
          )}
          {quote.notes && (
            <div style={{ display: "flex", gap: "5mm", marginTop: "2mm", fontSize: "9pt" }}>
              <div style={{ ...labelMini, width: "32mm", flexShrink: 0 }}>Notes</div>
              <div style={{ whiteSpace: "pre-line" }}>{quote.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Signatures (devis uniquement : une facture ne se signe pas) ── */}
      {!isFacture && (
        <div className="devis-avoid-break" style={{ display: "flex", justifyContent: "space-between", gap: "12mm", marginTop: "10mm" }}>
          <SignatureBox title={`Pour ${b.emitterName}`} name={b.emitterRepresentative} />
          <SignatureBox title="Bon pour accord — Le client" hint="Date, signature et cachet" />
        </div>
      )}

      {/* ── Pied de page légal ── */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "6mm",
          borderTop: `1px solid ${C.border}`,
          color: C.muted,
          fontSize: "7pt",
          lineHeight: 1.4,
        }}
      >
        {COMPANY.legalFootnote}
      </div>
    </div>
  );
}

/* ── Sous-composants ── */
function PartyBox({ label, accent, children }: { label: string; accent?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${C.border}`,
        borderLeft: accent ? `2.5px solid ${accent}` : `1px solid ${C.border}`,
        borderRadius: 4,
        padding: "4mm 5mm",
        backgroundColor: accent ? tint(accent, 0.035) : undefined,
      }}
    >
      <div style={{ ...labelMini, marginBottom: "2mm", color: accent ?? C.muted }}>{label}</div>
      {children}
    </div>
  );
}

function SectionTitle({ children, color = "#1E4FA3" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ ...labelMini, color, borderBottom: `1px solid ${C.border}`, paddingBottom: "1.5mm" }}>
      {children}
    </div>
  );
}

function TotalRow({ label, value, grand, spaced, barColor = "#0E2747" }: { label: string; value: string; grand?: boolean; spaced?: boolean; barColor?: string }) {
  // Le total principal ressort sur une bande teintée à la couleur de l'accent.
  const grandBg = grand ? tint(barColor, 0.07) : undefined;
  return (
    <tr>
      <td
        style={{
          padding: grand ? "2mm 2.5mm" : "1mm 0",
          paddingTop: spaced ? "4mm" : undefined,
          borderTop: grand ? `2px solid ${barColor}` : undefined,
          backgroundColor: grandBg,
          color: grand ? C.ink : C.muted,
          fontWeight: grand ? 700 : 400,
          fontSize: grand ? "11pt" : undefined,
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: grand ? "2mm 2.5mm" : "1mm 0",
          paddingTop: spaced ? "4mm" : undefined,
          borderTop: grand ? `2px solid ${barColor}` : undefined,
          backgroundColor: grandBg,
          textAlign: "right",
          fontWeight: grand ? 700 : 600,
          fontSize: grand ? "11pt" : undefined,
        }}
      >
        {value}
      </td>
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
          borderRadius: 4,
          height: "20mm",
          backgroundColor: "#FBFCFE",
          display: "flex",
          alignItems: "flex-end",
          padding: "1.5mm 2.5mm",
          fontSize: "8pt",
          color: C.muted,
        }}
      >
        {name ?? " "}
      </div>
    </div>
  );
}

function thCell(align: "left" | "right"): CSSProperties {
  return { textAlign: align, padding: "2.5mm 3mm", fontSize: "7.5pt", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 };
}
function tdCell(align: "left" | "right"): CSSProperties {
  return { textAlign: align, padding: "2.5mm 3mm", borderBottom: `1px solid ${C.border}`, verticalAlign: "top" };
}
