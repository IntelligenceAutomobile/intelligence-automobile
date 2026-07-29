// Compte rendu A4 — composant présentiel SANS hook (importable serveur ET client).
// Même recette que DevisDocument : une seule définition du document, réutilisable
// par l'impression et par tout aperçu à venir.
import type { CSSProperties } from "react";
import { formatEuro, formatDateFr } from "@/lib/devis";
import { formatNumber } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import { KIND_LABEL, isMeetingKind, meetingTitle, type MeetingAttachment, type MeetingSnapshot } from "@/lib/reunions";

/* Palette « papier » neutre (sur fond blanc) — identique au devis. */
const C = {
  ink: "#16213A",
  muted: "#6B7280",
  border: "#D9DEE8",
  hair: "#E7EBF2",
};

const DOC_FONT = "'DM Sans', 'DM Sans Fallback', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

const labelMini: CSSProperties = {
  fontSize: "7.5pt",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: C.muted,
};

const tabular: CSSProperties = { fontVariantNumeric: "tabular-nums" };

// Assombrit une couleur hex (même recette que DevisDocument). L'accent du
// back-office est un bleu clair pensé pour un fond sombre : posé tel quel sur du
// papier blanc, les titres et l'en-tête du tableau ressortaient délavés.
function shade(hex: string, factor: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const c = (h: string) => clamp(parseInt(h, 16) * factor).toString(16).padStart(2, "0");
  return `#${c(m[1])}${c(m[2])}${c(m[3])}`;
}

export type DocumentMeeting = {
  date: string;
  title: string;
  kind: string;
  attendees: string[];
  location: string;
  summary: string;
  author: string;
  snapshot: MeetingSnapshot | null;
  attachments: MeetingAttachment[];
  items: { id: string; type: string; content: string; owner: string; dueDate: string; status: string; doneAt: string }[];
};

export default function MeetingDocument({
  meeting,
  brand,
}: {
  meeting: DocumentMeeting;
  brand: { name: string; tagline: string; accent: string };
}) {
  // Version « papier » de l'accent : lisible en noir sur blanc comme sur le devis.
  const accent = shade(brand.accent || "#1E4FA3", 0.62);
  const decisions = meeting.items.filter((i) => i.type === "decision");
  const actions = meeting.items.filter((i) => i.type === "action");
  const kindLabel = isMeetingKind(meeting.kind) ? KIND_LABEL[meeting.kind] : meeting.kind;
  const snap = meeting.snapshot;

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
      {/* ── En-tête ── */}
      <div className="devis-avoid-break" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8mm" }}>
        <div>
          {/* Le vrai logo, comme sur le devis : un compte rendu remis à la banque
              se présente avec la même identité que les documents commerciaux. */}
          {COMPANY.logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={COMPANY.logoSrc} alt={brand.name} style={{ height: "14mm", width: "auto", display: "block" }} />
          ) : (
            <div style={{ fontSize: "12pt", letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600 }}>
              {brand.name}
            </div>
          )}
          {/* La signature du back-office (« Back-office ») reste à l'écran : sur
              un papier remis à la banque, seule l'identité de l'émetteur compte. */}
          <div style={{ ...labelMini, marginTop: "2mm" }}>{COMPANY.legalName}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "14pt", letterSpacing: "0.08em", textTransform: "uppercase", color: accent, fontWeight: 600 }}>
            Compte rendu
          </div>
          <div style={{ ...labelMini, marginTop: "1mm" }}>de réunion</div>
        </div>
      </div>

      <div style={{ height: "1.5pt", backgroundColor: accent, margin: "4mm 0 6mm" }} />

      {/* ── Objet et métadonnées ── */}
      <div className="devis-avoid-break">
        <h1 style={{ fontSize: "15pt", fontWeight: 400, letterSpacing: "-0.01em", margin: 0 }}>
          {meetingTitle(meeting)}
        </h1>

        <table style={{ width: "100%", marginTop: "4mm", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <Meta label="Date" value={formatDateFr(meeting.date)} />
              <Meta label="Type" value={kindLabel} />
              <Meta label="Lieu" value={meeting.location || "—"} />
            </tr>
            <tr>
              <td colSpan={3} style={{ paddingTop: "3mm", verticalAlign: "top" }}>
                <div style={labelMini}>Participants</div>
                <div style={{ marginTop: "1mm" }}>
                  {meeting.attendees.length > 0 ? meeting.attendees.join(", ") : "—"}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Situation au jour de la réunion ── */}
      {snap && (
        <div
          className="devis-avoid-break"
          style={{ marginTop: "6mm", border: `1px solid ${C.border}`, padding: "4mm 5mm", backgroundColor: "#FBFCFE" }}
        >
          <div style={labelMini}>Situation de l&apos;agence au {formatDateFr(snap.takenOn || meeting.date)}</div>
          <table style={{ width: "100%", marginTop: "3mm", borderCollapse: "collapse", fontSize: "9pt" }}>
            <tbody>
              <tr>
                <Figure label="Véhicules en stock" value={formatNumber(snap.stockCount)} />
                <Figure label="Valeur du stock" value={formatEuro(snap.stockValue)} />
                <Figure label="Devis en attente" value={formatEuro(snap.quotesPending)} />
                <Figure label="Encours impayé" value={formatEuro(snap.unpaid)} />
                <Figure label="Leads actifs" value={formatNumber(snap.activeLeads)} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Décisions ──
          Une section vide reste en dehors du document : un compte rendu remis à
          la banque annonce ce qui a eu lieu, plutôt que ce qui manque. */}
      {decisions.length > 0 && (
        <Section title="Décisions" accent={accent}>
          <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {decisions.map((d, i) => (
              <li key={d.id} className="devis-avoid-break" style={{ display: "flex", gap: "4mm", marginBottom: "2.5mm" }}>
                <span style={{ ...labelMini, ...tabular, color: accent, flexShrink: 0, paddingTop: "0.6mm" }}>
                  D{i + 1}
                </span>
                <span style={{ borderLeft: `1.5pt solid ${accent}`, paddingLeft: "3mm" }}>{d.content}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ── Actions ── */}
      {actions.length > 0 && (
        <Section title="Actions à mener" accent={accent}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th accent={accent}>Action</Th>
                <Th accent={accent} width="32mm">Responsable</Th>
                <Th accent={accent} width="26mm">Échéance</Th>
                <Th accent={accent} width="20mm">État</Th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id}>
                  <Td>{a.content}</Td>
                  <Td>{a.owner || "—"}</Td>
                  <Td style={tabular}>{a.dueDate ? formatDateFr(a.dueDate) : "—"}</Td>
                  <Td>{a.status === "fait" ? "☑ Fait" : "☐ À faire"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* ── Synthèse ── */}
      {meeting.summary.trim() && (
        <Section title="Synthèse" accent={accent}>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{meeting.summary}</p>
        </Section>
      )}

      {/* ── Documents joints ── */}
      {meeting.attachments.length > 0 && (
        <Section title="Documents joints" accent={accent}>
          <ul style={{ margin: 0, paddingLeft: "5mm" }}>
            {meeting.attachments.map((a) => (
              <li key={a.url}>{a.label}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── Pied de page ── */}
      <div style={{ marginTop: "auto", paddingTop: "8mm" }}>
        <div style={{ height: "0.5pt", backgroundColor: C.hair, marginBottom: "3mm" }} />
        <div style={{ ...labelMini, display: "flex", justifyContent: "space-between", gap: "6mm" }}>
          <span>
            {decisions.length} décision{decisions.length > 1 ? "s" : ""} · {actions.length} action
            {actions.length > 1 ? "s" : ""}
          </span>
          <span>{meeting.author ? `Compte rendu établi par ${meeting.author}` : brand.name}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Fragments ── */
function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "7mm" }}>
      <div
        className="devis-avoid-break"
        style={{
          ...labelMini,
          color: accent,
          borderBottom: `0.5pt solid ${C.border}`,
          paddingBottom: "1.5mm",
          marginBottom: "3mm",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <td style={{ verticalAlign: "top", paddingRight: "6mm", width: "33%" }}>
      <div style={labelMini}>{label}</div>
      <div style={{ marginTop: "1mm" }}>{value}</div>
    </td>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <td style={{ verticalAlign: "top", paddingRight: "4mm" }}>
      <div style={{ ...labelMini, fontSize: "6.5pt" }}>{label}</div>
      <div style={{ ...tabular, marginTop: "0.8mm", fontSize: "10pt" }}>{value}</div>
    </td>
  );
}

function Th({ children, accent, width }: { children: React.ReactNode; accent: string; width?: string }) {
  return (
    <th
      style={{
        ...labelMini,
        color: "#FFFFFF",
        backgroundColor: accent,
        textAlign: "left",
        padding: "1.8mm 2.5mm",
        width,
        fontWeight: 500,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <td style={{ padding: "2mm 2.5mm", borderBottom: `0.5pt solid ${C.border}`, verticalAlign: "top", ...style }}>
      {children}
    </td>
  );
}
