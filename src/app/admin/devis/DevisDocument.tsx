// Rendu A4 du devis — composant présentiel SANS hook (importable serveur ET client).
// Utilisé tel quel par l'aperçu live (éditeur) et par la page d'impression : rendu identique.
import type { CSSProperties } from "react";
import { COMPANY } from "@/lib/company";
import {
  computeTotals,
  formatEuro,
  formatDateFr,
  validUntilFr,
  lineTotal,
  blockBox,
  type QuoteData,
  type HeaderBlockId,
} from "@/lib/devis";

/* Palette « papier » (sur fond blanc) */
const C = {
  ink: "#16213A",
  accent: "#1E4FA3",
  headBg: "#0E2747",
  muted: "#6B7280",
  border: "#D9DEE8",
  zebra: "#F5F7FB",
};

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
  const logoJustify = b.logoAlign === "center" ? "center" : b.logoAlign === "right" ? "flex-end" : "flex-start";
  const logoFree = b.logoX != null && b.logoY != null;
  const logoCursor = onLogoPointerDown ? "move" : "default";

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
        style={{ position: "absolute", right: "-4px", top: "50%", transform: "translateY(-50%)", width: 9, height: 22, background: C.accent, borderRadius: 2, cursor: "ew-resize", touchAction: "none" }}
      />
    );
  }

  return (
    <div
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

        {/* Bloc DEVIS + métadonnées */}
        <div style={{ ...blockWrap("meta"), textAlign: "right" }} onPointerDown={onBlockPointerDown ? (e) => onBlockPointerDown("meta", e) : undefined}>
          <div style={{ fontSize: "20pt", fontWeight: 300, letterSpacing: "0.18em", color: C.accent }}>DEVIS</div>
          <div style={{ width: 38, height: 2, backgroundColor: C.accent, marginLeft: "auto", marginTop: "2mm", marginBottom: "3mm" }} />
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
              <tr>
                <td style={{ ...labelMini, paddingRight: "4mm", textAlign: "right" }}>Validité</td>
                <td>{validUntilFr(quote.issueDate, quote.validityDays)}</td>
              </tr>
            </tbody>
          </table>
          {resizeHandle("meta")}
        </div>

        {/* Destinataire */}
        <div style={blockWrap("client")} onPointerDown={onBlockPointerDown ? (e) => onBlockPointerDown("client", e) : undefined}>
          <PartyBox label="Client">
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
          <tr style={{ backgroundColor: C.headBg, color: "#FFFFFF" }}>
            <th style={thCell("left")}>Désignation</th>
            <th style={{ ...thCell("right"), width: "14mm" }}>Qté</th>
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
            quote.items.map((it, i) => (
              <tr key={it.id} style={{ backgroundColor: i % 2 ? C.zebra : "transparent" }}>
                <td style={tdCell("left")}>
                  <div style={{ fontWeight: 600 }}>{it.designation || "—"}</div>
                  {it.detail && <div style={{ color: C.muted, fontSize: "8pt", marginTop: "0.5mm", whiteSpace: "pre-line" }}>{it.detail}</div>}
                </td>
                <td style={tdCell("right")}>{it.qty}</td>
                <td style={tdCell("right")}>{formatEuro(it.unitPrice)}</td>
                <td style={{ ...tdCell("right"), fontWeight: 600 }}>{formatEuro(lineTotal(it))}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ── Totaux ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6mm" }}>
        <table style={{ width: "78mm", borderCollapse: "collapse", fontSize: "9.5pt" }}>
          <tbody>
            {showHT ? (
              <>
                <TotalRow label="Total HT" value={formatEuro(t.totalHT)} />
                <TotalRow label={`TVA ${quote.tvaRate} %`} value={formatEuro(t.tvaAmount)} />
                <TotalRow label="Total TTC" value={formatEuro(t.totalTTC)} grand />
              </>
            ) : (
              <>
                <TotalRow label="Total" value={formatEuro(t.totalTTC)} grand />
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
                  label={quote.depositMode === "percent" ? `Acompte (${quote.depositValue} %)` : "Acompte"}
                  value={formatEuro(t.deposit)}
                  spaced
                />
                <TotalRow label="Solde" value={formatEuro(t.balance)} />
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Conditions / notes ── */}
      {(quote.paymentTerms || quote.notes) && (
        <div style={{ marginTop: "9mm" }}>
          <SectionTitle>Conditions</SectionTitle>
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

      {/* ── Signatures ── */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12mm", marginTop: "14mm" }}>
        <SignatureBox title={`Pour ${b.emitterName}`} name={b.emitterRepresentative} />
        <SignatureBox title="Bon pour accord — Le client" hint="Date, signature et cachet" />
      </div>

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
function PartyBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 4, padding: "4mm 5mm" }}>
      <div style={{ ...labelMini, marginBottom: "2mm" }}>{label}</div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...labelMini, color: C.accent, borderBottom: `1px solid ${C.border}`, paddingBottom: "1.5mm" }}>
      {children}
    </div>
  );
}

function TotalRow({ label, value, grand, spaced }: { label: string; value: string; grand?: boolean; spaced?: boolean }) {
  return (
    <tr>
      <td
        style={{
          padding: grand ? "2.5mm 0 0" : "1mm 0",
          paddingTop: spaced ? "4mm" : undefined,
          borderTop: grand ? `2px solid ${C.headBg}` : undefined,
          color: grand ? C.ink : C.muted,
          fontWeight: grand ? 700 : 400,
          fontSize: grand ? "11pt" : undefined,
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: grand ? "2.5mm 0 0" : "1mm 0",
          paddingTop: spaced ? "4mm" : undefined,
          borderTop: grand ? `2px solid ${C.headBg}` : undefined,
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
      <div style={{ ...labelMini, marginBottom: "12mm" }}>
        {title}
        <div style={{ textTransform: "none", letterSpacing: 0, color: C.muted, fontSize: "7.5pt", marginTop: "0.5mm" }}>
          {hint ?? "Date, signature et cachet"}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${C.muted}`, paddingTop: "1.5mm", fontSize: "8pt", color: C.muted, minHeight: "5mm" }}>
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
