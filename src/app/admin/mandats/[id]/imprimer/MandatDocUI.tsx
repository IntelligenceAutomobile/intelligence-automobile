// Direction artistique des mandats : le papier de la maison.
//
// Un seul jeu de briques pour les trois contrats (vente, recherche, import),
// et pour les deux usages : l'aperçu en direct de la fiche et la page
// d'impression. Un mandat sort de la maison et se relit des années plus tard,
// il porte donc l'identité complète, comme les offres de reprise.
//
// Composant présentiel SANS hook, importable côté serveur ET côté client.
//
// Choix d'ensemble :
//   — le bandeau bleu nuit du site, monogramme compris, en tête de chaque
//     feuille : plein cadre sur la première, en rappel sur les suivantes ;
//   — l'encre bleu nuit des devis plutôt qu'un noir pur, et un bleu roi
//     lisible à l'impression pour les repères ;
//   — DM Sans, la police du site et des devis, avec un repli sûr ;
//   — des articles numérotés dans une pastille, une barrette d'identité sous
//     le titre, et un encart pour le chiffre qui engage.
import type { CSSProperties } from "react";

/* ── Palette papier ──
   Pensée pour le blanc et pour une imprimante : le bleu roi reste lisible en
   noir et blanc, le voile ne bave pas, l'encre évite le noir pur qui durcit
   le texte. */
export const D = {
  nuit: "#0A1628",
  encre: "#16213A",
  accent: "#1E4FA3",
  accentClair: "#6B9FEE",
  gris: "#6B7280",
  filet: "#C9D2E2",
  filetClair: "#E7EBF2",
  voile: "#EFF4FC",
  blanc: "#FFFFFF",
} as const;

// Police du document : celle du site et des devis, avec un repli sûr sur les
// postes qui ne l'ont pas.
const DOC_FONT = "'DM Sans', 'DM Sans Fallback', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

// Les aplats de couleur doivent survivre à l'impression : sans cette paire,
// le navigateur imprime le bandeau en blanc.
const ENCRE_FIDELE: CSSProperties = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" };

/* ── Monogramme ──
   Le fichier du logo porte de larges marges transparentes : le glyphe visible
   occupe x 630→1102 et y 239→622 d'une image de 1536×1024 (mesure reprise de
   l'en-tête du site). La vignette recadre donc l'image pour qu'un seul réglage,
   la hauteur voulue du glyphe, suffise à le poser. */
const MARK_SRC = "/Logo/v9%20Logo%20Sans%20texte.png";
const MARK_W = 1536, MARK_H = 1024;
const GLYPHE_X0 = 630 / MARK_W, GLYPHE_X1 = 1102 / MARK_W;
const GLYPHE_Y0 = 239 / MARK_H, GLYPHE_Y1 = 622 / MARK_H;

export function Monogramme({ hauteurMm }: { hauteurMm: number }) {
  const imgH = hauteurMm / (GLYPHE_Y1 - GLYPHE_Y0);
  const imgW = imgH * (MARK_W / MARK_H);
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        position: "relative",
        overflow: "hidden",
        width: `${imgW * (GLYPHE_X1 - GLYPHE_X0)}mm`,
        height: `${hauteurMm}mm`,
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MARK_SRC}
        alt=""
        style={{
          position: "absolute",
          width: `${imgW}mm`,
          height: `${imgH}mm`,
          left: `${-imgW * GLYPHE_X0}mm`,
          top: `${-imgH * GLYPHE_Y0}mm`,
          maxWidth: "none",
        }}
      />
    </span>
  );
}

/* ── La feuille ── */
export const SHEET: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  padding: "0 0 8mm",
  backgroundColor: D.blanc,
  color: D.encre,
  fontFamily: DOC_FONT,
  fontSize: "8.8pt",
  lineHeight: 1.45,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
};

const BODY: CSSProperties = { padding: "5mm 14mm 0", flex: 1 };

/** Adresse de l'émetteur sur une ligne, sans la mention du pays. */
export function adresseLigne(address: string): string {
  return address
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && l.toLowerCase() !== "france")
    .join(", ");
}

/** Un trait d'écriture : la valeur si elle existe, une ligne à compléter sinon. */
export function ligne(valeur: string): string {
  return valeur.trim() !== "" ? valeur : "________________";
}

export type Emetteur = {
  name: string;
  address: string;
  representative: string;
  email: string;
  phone: string;
  siret: string;
  tva: string;
};

/* ── Le bandeau de tête ──
   Plein cadre sur la première feuille (monogramme, nom déployé, nature du
   document), en rappel sur les suivantes pour qu'une feuille égarée se
   rattache d'un regard à son contrat. */
export function Bandeau({
  emetteur, surtitre, reference, principal = false,
}: {
  emetteur: Emetteur;
  /** « Mandat de vente — Revente sur mesure » */
  surtitre: string;
  reference: string;
  principal?: boolean;
}) {
  const marque = emetteur.name.replace(/^SASU\s+/i, "");
  return (
    <div style={{ backgroundColor: D.nuit, color: D.blanc, ...ENCRE_FIDELE }}>
      <div
        style={{
          padding: principal ? "8mm 14mm 6mm" : "4mm 14mm 3.4mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: principal ? "flex-end" : "center",
          gap: "8mm",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: principal ? "4mm" : "2.6mm" }}>
          <Monogramme hauteurMm={principal ? 11 : 6} />
          {principal ? (
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: "13pt", fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Intelligence
              </div>
              <div style={{ fontSize: "9pt", fontWeight: 400, letterSpacing: "0.38em", textTransform: "uppercase", color: D.accentClair, marginTop: "0.6mm" }}>
                Automobile
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "8.5pt", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              {marque}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", lineHeight: 1.35 }}>
          <div
            style={{
              fontSize: principal ? "7.4pt" : "6.8pt",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: D.accentClair,
            }}
          >
            {surtitre}
          </div>
          {reference !== "" && (
            <div
              style={{
                fontSize: principal ? "9pt" : "7.4pt",
                fontWeight: 600,
                letterSpacing: "0.06em",
                marginTop: principal ? "1mm" : "0.4mm",
              }}
            >
              {reference}
            </div>
          )}
        </div>
      </div>
      {/* Le filet dégradé du site, signature discrète de la maison. */}
      <div
        style={{
          height: principal ? "1.2mm" : "0.7mm",
          background: `linear-gradient(to right, ${D.accentClair}, rgba(107,159,238,0.05))`,
          ...ENCRE_FIDELE,
        }}
      />
    </div>
  );
}

/* ── Le pied de page ── */
export function Pied({ emetteur, page, total }: { emetteur: Emetteur; page: number; total: number }) {
  return (
    <div
      style={{
        margin: "5mm 14mm 0",
        paddingTop: "2mm",
        borderTop: `1px solid ${D.filetClair}`,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        fontSize: "6.6pt",
        color: D.gris,
      }}
    >
      <span>
        {emetteur.name} · {adresseLigne(emetteur.address)}
        {emetteur.siret ? ` · SIRET ${emetteur.siret}` : ""}
        {emetteur.tva ? ` · TVA ${emetteur.tva}` : ""}
      </span>
      <span style={{ whiteSpace: "nowrap" }}>
        Page {page} / {total} — paraphes : ______ / ______
      </span>
    </div>
  );
}

/** Une feuille complète : bandeau, corps, pied. */
export function Feuille({
  emetteur, surtitre, reference, page, total, children,
}: {
  emetteur: Emetteur;
  surtitre: string;
  reference: string;
  page: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mandat-sheet" style={SHEET}>
      <Bandeau emetteur={emetteur} surtitre={surtitre} reference={reference} principal={page === 1} />
      <div style={BODY}>{children}</div>
      <Pied emetteur={emetteur} page={page} total={total} />
    </div>
  );
}

/* ── Le titre du document ── */
export function TitreDoc({ titre, sousTitre }: { titre: string; sousTitre: string }) {
  return (
    <div style={{ textAlign: "center", margin: "4mm 0 3mm" }}>
      <h1 style={{ fontSize: "16pt", fontWeight: 800, letterSpacing: "0.05em", margin: 0, color: D.encre }}>
        {titre}
      </h1>
      <div style={{ color: D.gris, fontSize: "8pt", marginTop: "1.4mm" }}>{sousTitre}</div>
    </div>
  );
}

/* ── La barrette d'identité ──
   Les repères qu'on cherche en reprenant le contrat : numéro, date, durée,
   régime. Ils tenaient dans deux champs perdus en haut de page. */
export function Barrette({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div
      className="mandat-avoid-break"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        border: `1px solid ${D.filet}`,
        backgroundColor: D.voile,
        marginBottom: "1mm",
        ...ENCRE_FIDELE,
      }}
    >
      {items.map((c, i) => (
        <div
          key={c.label}
          style={{
            padding: "1.9mm 3mm",
            borderLeft: i === 0 ? "none" : `1px solid ${D.filet}`,
          }}
        >
          <div style={{ fontSize: "6.2pt", letterSpacing: "0.14em", textTransform: "uppercase", color: D.gris }}>
            {c.label}
          </div>
          <div style={{ fontSize: "9.5pt", fontWeight: 700, color: D.encre, marginTop: "0.5mm" }}>
            {c.value || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Un article ──
   Le numéro dans une pastille : l'œil retrouve « l'article 7 » sans lire. */
export function Art({ n, titre, children }: { n: number; titre: string; children: React.ReactNode }) {
  return (
    <div className="mandat-avoid-break" style={{ marginTop: "3.1mm" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2.4mm",
          borderBottom: `1px solid ${D.filetClair}`,
          paddingBottom: "1mm",
          marginBottom: "1.3mm",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "5.2mm",
            height: "5.2mm",
            backgroundColor: D.accent,
            color: D.blanc,
            fontSize: "7.4pt",
            fontWeight: 700,
            flexShrink: 0,
            ...ENCRE_FIDELE,
          }}
        >
          {n}
        </span>
        <h2
          style={{
            fontSize: "8.6pt",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: 0,
            color: D.encre,
          }}
        >
          {titre}
        </h2>
      </div>
      {children}
    </div>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 1.4mm", textAlign: "justify" }}>{children}</p>;
}

/* ── Grille de champs : libellé gris, valeur soulignée ── */
export function Champs({ items }: { items: { label: string; value: string; span?: number }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", columnGap: "5mm", rowGap: "1.5mm", margin: "0.8mm 0 1.4mm" }}>
      {items.map((c) => (
        <div key={c.label} style={{ gridColumn: `span ${c.span ?? 2}` }}>
          <div style={{ fontSize: "6.4pt", textTransform: "uppercase", letterSpacing: "0.1em", color: D.gris }}>
            {c.label}
          </div>
          <div
            style={{
              borderBottom: `1px solid ${D.filet}`,
              padding: "0.5mm 0 0.7mm",
              fontWeight: 600,
              minHeight: "4.2mm",
              overflowWrap: "anywhere",
            }}
          >
            {c.value.trim() !== "" ? c.value : " "}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Zone d'écriture libre : un intitulé gris et des lignes à remplir. */
export function ZoneTexte({ label, valeur, hauteurMm = 8 }: { label: string; valeur: string; hauteurMm?: number }) {
  return (
    <div style={{ marginBottom: "1.8mm" }}>
      <div style={{ fontSize: "6.4pt", textTransform: "uppercase", letterSpacing: "0.1em", color: D.gris }}>
        {label}
      </div>
      <div
        style={{
          borderBottom: `1px solid ${D.filet}`,
          minHeight: `${hauteurMm}mm`,
          padding: "0.7mm 0",
          whiteSpace: "pre-line",
        }}
      >
        {valeur}
      </div>
    </div>
  );
}

/* ── L'encart du chiffre qui engage ──
   Le montant se lit d'abord, comme le prix sur une offre de reprise. */
export function Encart({
  label, valeur, mention, ton = "accent",
}: {
  label: string;
  valeur: string;
  mention?: string;
  ton?: "accent" | "neutre";
}) {
  const bord = ton === "accent" ? D.accent : D.filet;
  return (
    <div
      className="mandat-avoid-break"
      style={{
        flex: 1,
        border: `1px solid ${D.filet}`,
        borderLeft: `1.4mm solid ${bord}`,
        backgroundColor: ton === "accent" ? D.voile : D.blanc,
        padding: "2mm 2.8mm",
        ...ENCRE_FIDELE,
      }}
    >
      <div style={{ fontSize: "6.4pt", letterSpacing: "0.14em", textTransform: "uppercase", color: D.gris }}>
        {label}
      </div>
      <div style={{ fontSize: "13pt", fontWeight: 800, color: D.encre, lineHeight: 1.15, marginTop: "0.6mm" }}>
        {valeur || "—"}
      </div>
      {mention && (
        <div style={{ fontSize: "7pt", color: D.gris, marginTop: "0.8mm" }}>{mention}</div>
      )}
    </div>
  );
}

/** Deux encarts côte à côte. */
export function Encarts({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: "4mm", margin: "0.8mm 0 1.6mm" }}>{children}</div>;
}

/* ── Case contractuelle, imprimée cochée ou vide selon la fiche ── */
export function CocheDoc({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <div
      className="mandat-avoid-break"
      style={{
        display: "flex",
        gap: "2.6mm",
        alignItems: "flex-start",
        border: `1px solid ${checked ? D.accent : D.filet}`,
        backgroundColor: checked ? D.voile : D.blanc,
        padding: "1.8mm 2.6mm",
        margin: "0 0 1.3mm",
        ...ENCRE_FIDELE,
      }}
    >
      <span
        aria-hidden
        style={{
          width: "3.6mm",
          height: "3.6mm",
          border: `1.2px solid ${checked ? D.accent : D.encre}`,
          backgroundColor: checked ? D.accent : D.blanc,
          color: D.blanc,
          flexShrink: 0,
          marginTop: "0.4mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "7.4pt",
          fontWeight: 700,
          lineHeight: 1,
          ...ENCRE_FIDELE,
        }}
      >
        {checked ? "✕" : ""}
      </span>
      <span style={{ textAlign: "justify" }}>{children}</span>
    </div>
  );
}

/* ── L'encadré de la loi ──
   Ce que le client doit lire avant de signer : rétractation, délais. */
export function Encadre({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mandat-avoid-break"
      style={{
        borderLeft: `1.2mm solid ${D.nuit}`,
        backgroundColor: D.voile,
        padding: "2mm 2.8mm",
        marginBottom: "1.3mm",
        ...ENCRE_FIDELE,
      }}
    >
      {children}
    </div>
  );
}

/* ── Les signatures ──
   Signé en ligne, le cachet horodaté remplace la main : nom tapé, instant
   précis, adresse d'origine. */
export function Signatures({
  emetteur, roleClient, signerName, signedAt, signedIp,
}: {
  emetteur: Emetteur;
  /** « Le Vendeur » pour la vente, « Le Client » pour la recherche et l'import. */
  roleClient: string;
  signerName: string;
  signedAt: string;
  signedIp: string;
}) {
  const enLigne = signedAt !== "" && signerName !== "";
  const quand = enLigne
    ? new Date(signedAt).toLocaleString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
      })
    : "";

  const cadre: CSSProperties = { flex: 1, border: `1px solid ${D.filet}` };
  const titre: CSSProperties = {
    backgroundColor: D.voile,
    borderBottom: `1px solid ${D.filet}`,
    padding: "1.6mm 2.8mm",
    fontSize: "7pt",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: D.accent,
    ...ENCRE_FIDELE,
  };

  return (
    <div className="mandat-avoid-break" style={{ display: "flex", gap: "5mm", marginTop: "3mm" }}>
      <div style={cadre}>
        <div style={titre}>{roleClient}</div>
        <div style={{ padding: "2.2mm 2.8mm", minHeight: "23mm" }}>
          {enLigne ? (
            <div style={{ fontSize: "7.6pt", lineHeight: 1.6 }}>
              <div style={{ fontSize: "10pt", fontWeight: 700, color: D.encre }}>{signerName}</div>
              <div>Signé en ligne le {quand}</div>
              {signedIp !== "" && <div style={{ color: D.gris }}>Adresse IP : {signedIp}</div>}
              <div style={{ color: D.gris }}>
                Mention «&nbsp;Lu et approuvé, bon pour mandat&nbsp;» validée en ligne
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "7.2pt", color: D.gris }}>
              Signature précédée de la mention manuscrite «&nbsp;Lu et approuvé, bon pour mandat&nbsp;»
            </div>
          )}
        </div>
      </div>
      <div style={cadre}>
        <div style={titre}>Le Mandataire</div>
        <div style={{ padding: "2.2mm 2.8mm", minHeight: "26mm", fontSize: "7.6pt", color: D.gris }}>
          {emetteur.name}
          <br />
          {emetteur.representative}, président
        </div>
      </div>
    </div>
  );
}

/* ── Le bordereau de rétractation détachable ── */
export function Bordereau({
  emetteur, phrase,
}: {
  emetteur: Emetteur;
  /** « Je vous notifie par la présente ma rétractation du mandat … » */
  phrase: string;
}) {
  return (
    <>
      <div style={{ margin: "5mm 0 2mm", borderTop: `1.5px dashed ${D.filet}`, position: "relative" }}>
        <span
          style={{
            position: "absolute",
            top: "-2.6mm",
            left: 0,
            backgroundColor: D.blanc,
            paddingRight: "2mm",
            fontSize: "7pt",
            color: D.gris,
          }}
        >
          ✂
        </span>
      </div>
      <div className="mandat-avoid-break">
        <h2
          style={{
            fontSize: "10pt",
            fontWeight: 800,
            letterSpacing: "0.06em",
            margin: "2mm 0 1mm",
            color: D.encre,
          }}
        >
          BORDEREAU DE RÉTRACTATION
        </h2>
        <P>
          <span style={{ color: D.gris, fontSize: "7.6pt" }}>
            À compléter et renvoyer uniquement si vous souhaitez vous rétracter du mandat, dans un
            délai de quatorze jours à compter de sa signature.
          </span>
        </P>
        <P>
          {`À l'attention de : ${emetteur.name}, ${adresseLigne(emetteur.address)}${emetteur.email ? ` — ${emetteur.email}` : ""}`}
        </P>
        <P>{phrase}</P>
        <Champs
          items={[
            { label: "Nom et prénom du client", value: "", span: 4 },
            { label: "Date", value: "", span: 2 },
            { label: "Adresse", value: "", span: 6 },
            { label: "Signature", value: "", span: 3 },
          ]}
        />
      </div>
    </>
  );
}
