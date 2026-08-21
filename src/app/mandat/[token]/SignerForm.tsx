"use client";

// Bloc de signature sous le mandat public : le vendeur lit les quatre pages,
// tape son nom, valide la mention et choisit l'exécution immédiate. Même
// esprit que l'acceptation d'un devis, avec les cases que le contrat exige.
import { useState } from "react";

const ACCENT = "#1E4FA3";

export default function SignerForm({
  token,
  reference,
  typeDe,
  vehicule,
  echeance,
  immediateExecution,
  signe,
  clos,
  expire,
  signerName,
  signedOn,
  emitter,
  emitterEmail,
  emitterPhone,
}: {
  token: string;
  reference: string;
  /** « de vente », « de recherche », « d'import » : les textes suivent le contrat. */
  typeDe: string;
  vehicule: string;
  echeance: string;
  /** Choix posé sur la fiche, que le vendeur confirme ou décoche lui-même. */
  immediateExecution: boolean;
  signe: boolean;
  clos: boolean;
  expire: boolean;
  signerName: string;
  signedOn: string;
  emitter: string;
  emitterEmail: string;
  emitterPhone: string;
}) {
  const [name, setName] = useState("");
  const [approuve, setApprouve] = useState(false);
  const [immediate, setImmediate] = useState(immediateExecution);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(signe);
  const [doneName, setDoneName] = useState(signerName);
  const [error, setError] = useState("");

  const card: React.CSSProperties = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #D9DEE8",
    borderTop: `2px solid ${ACCENT}`,
    padding: 24,
    marginTop: 24,
    fontFamily: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
    color: "#16213A",
  };
  const label: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#6B7280",
    display: "block",
    marginBottom: 8,
  };
  const caseStyle: React.CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 14,
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1.55,
  };

  async function signer() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/mandat/${token}/signer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: name.trim(), approuve, immediateExecution: immediate }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setDoneName(name.trim());
      setDone(true);
      // La page se recharge pour que le cachet apparaisse sur le document.
      setTimeout(() => window.location.reload(), 1800);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "L'enregistrement a échoué. Réessayez dans un instant.");
    } finally {
      setBusy(false);
    }
  }

  const contact = [emitterEmail, emitterPhone].filter(Boolean).join(" · ");

  if (done) {
    return (
      <div style={{ ...card, borderTop: "2px solid #0F8A6A" }}>
        <p style={{ ...label, color: "#0F8A6A" }}>Mandat signé</p>
        <p style={{ margin: "0 0 6px", fontSize: 17 }}>
          Merci{doneName ? `, ${doneName}` : ""}. Votre signature du mandat {reference} est enregistrée
          {signedOn ? "" : " à l'instant"}.
        </p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          Un exemplaire reste consultable à cette adresse, avec le cachet de signature sur la dernière
          page. Vous disposez de quatorze jours pour vous rétracter, le bordereau figure au bas du
          document. {emitter} revient vers vous pour la suite.{contact ? ` ${contact}` : ""}
        </p>
      </div>
    );
  }

  if (clos) {
    return (
      <div style={card}>
        <p style={label}>Mandat clos</p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          Ce mandat a été clôturé. {emitter} reste à votre disposition pour en établir un nouveau.
          {contact ? ` ${contact}` : ""}
        </p>
      </div>
    );
  }

  if (expire) {
    return (
      <div style={{ ...card, borderTop: "2px solid #C2410C" }}>
        <p style={{ ...label, color: "#C2410C" }}>Mandat échu</p>
        <p style={{ margin: "0 0 6px", fontSize: 15 }}>
          Ce mandat était proposé jusqu&apos;au {echeance}.
        </p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          Contactez {emitter} pour recevoir un contrat à jour.{contact ? ` ${contact}` : ""}
        </p>
      </div>
    );
  }

  const pret = approuve && name.trim().length >= 2;

  return (
    <div style={card}>
      <p style={label}>Signature du mandat</p>
      <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600 }}>{vehicule}</p>
      <p style={{ margin: "0 0 20px", color: "#6B7280", fontSize: 14 }}>
        Mandat {reference}
        {echeance ? ` · valable jusqu'au ${echeance}` : ""}
      </p>

      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={label}>Votre nom</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom et nom du signataire"
          autoComplete="name"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 15,
            border: "1px solid #D9DEE8",
            backgroundColor: "#FBFCFE",
            color: "#16213A",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </label>

      <label style={caseStyle}>
        <input
          type="checkbox"
          checked={approuve}
          onChange={(e) => setApprouve(e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 1, accentColor: ACCENT, flexShrink: 0 }}
        />
        <span>
          J&apos;ai lu le mandat {typeDe}, l&apos;ensemble de ses articles et son bordereau de
          rétractation, et je l&apos;approuve. <strong>Lu et approuvé, bon pour mandat.</strong>
        </span>
      </label>

      <label style={caseStyle}>
        <input
          type="checkbox"
          checked={immediate}
          onChange={(e) => setImmediate(e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 1, accentColor: ACCENT, flexShrink: 0 }}
        />
        <span>
          Je demande expressément l&apos;exécution du mandat avant la fin du délai de rétractation,
          dans les conditions de l&apos;article correspondant du contrat. En laissant cette case
          décochée, la mission démarre après le délai de quatorze jours.
        </span>
      </label>

      <p style={{ color: "#6B7280", fontSize: 12.5, margin: "4px 0 18px", lineHeight: 1.55 }}>
        En signant, votre nom, la date et l&apos;adresse de connexion sont enregistrés et apposés sur
        le document. Vous disposez d&apos;un délai de rétractation de quatorze jours, le bordereau
        figure au bas du contrat.
      </p>

      {error && <p style={{ color: "#C2410C", fontSize: 14, margin: "0 0 14px" }}>{error}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <button
          type="button"
          onClick={signer}
          disabled={busy || !pret}
          style={{
            backgroundColor: ACCENT,
            color: "#FFFFFF",
            border: "none",
            padding: "14px 28px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: busy || !pret ? "default" : "pointer",
            opacity: busy || !pret ? 0.45 : 1,
            fontFamily: "inherit",
          }}
        >
          {busy ? "Enregistrement…" : "Signer le mandat"}
        </button>
        {emitterEmail && (
          <a
            href={`mailto:${emitterEmail}?subject=${encodeURIComponent(`Mandat ${reference}`)}`}
            style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: ACCENT, textDecoration: "none" }}
          >
            J&apos;ai une question
          </a>
        )}
      </div>
    </div>
  );
}
