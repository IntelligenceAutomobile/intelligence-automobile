"use client";

// Bloc d'acceptation sous le devis public : le client signe d'un bouton, sans
// imprimer, sans scanner et sans compte.
import { useState } from "react";

export default function AccepterForm({
  token,
  number,
  amount,
  deposit,
  validUntil,
  accent,
  emitter,
  emitterEmail,
  emitterPhone,
  accepted,
  refused,
  expired,
  signerName,
  signedAt,
}: {
  token: string;
  number: string;
  amount: string;
  deposit: string;
  validUntil: string;
  accent: string;
  emitter: string;
  emitterEmail: string;
  emitterPhone: string;
  accepted: boolean;
  refused: boolean;
  expired: boolean;
  signerName: string;
  signedAt: string;
}) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(accepted);
  const [doneName, setDoneName] = useState(signerName);
  const [error, setError] = useState("");

  const card: React.CSSProperties = {
    backgroundColor: "#FFFFFF",
    border: "1px solid #D9DEE8",
    borderTop: `2px solid ${accent}`,
    padding: 24,
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

  async function accepter() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/devis/${token}/accepter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: name.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setDoneName(name.trim());
      setDone(true);
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
        <p style={{ ...label, color: "#0F8A6A" }}>Devis accepté</p>
        <p style={{ margin: "0 0 6px", fontSize: 17 }}>
          Merci{doneName ? `, ${doneName}` : ""}. Votre accord sur le devis {number} est enregistré.
        </p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          {emitter} revient vers vous pour la suite.{contact ? ` ${contact}` : ""}
          {signedAt && !doneName ? "" : ""}
        </p>
      </div>
    );
  }

  if (refused) {
    return (
      <div style={card}>
        <p style={label}>Devis clos</p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          Ce devis a été clôturé. {emitter} reste à votre disposition pour en établir un nouveau.{contact ? ` ${contact}` : ""}
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div style={{ ...card, borderTop: "2px solid #C2410C" }}>
        <p style={{ ...label, color: "#C2410C" }}>Devis expiré</p>
        <p style={{ margin: "0 0 6px", fontSize: 15 }}>
          Ce devis était valable jusqu&apos;au {validUntil}.
        </p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          Contactez {emitter} pour obtenir une proposition à jour.{contact ? ` ${contact}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <p style={label}>Bon pour accord</p>
      <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{amount}</p>
      <p style={{ margin: "0 0 20px", color: "#6B7280", fontSize: 14 }}>
        Devis {number}
        {deposit ? ` · acompte de ${deposit} à la commande` : ""}
        {validUntil ? ` · valable jusqu'au ${validUntil}` : ""}
      </p>

      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={label}>Votre nom</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom et nom du signataire"
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

      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20, cursor: "pointer", fontSize: 14, lineHeight: 1.5 }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 1, accentColor: accent, flexShrink: 0 }}
        />
        <span>J&apos;accepte ce devis et les conditions qui y figurent.</span>
      </label>

      {error && <p style={{ color: "#C2410C", fontSize: 14, margin: "0 0 14px" }}>{error}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <button
          type="button"
          onClick={accepter}
          disabled={busy || !agreed || name.trim().length < 2}
          style={{
            backgroundColor: accent,
            color: "#FFFFFF",
            border: "none",
            padding: "14px 28px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: busy || !agreed || name.trim().length < 2 ? "default" : "pointer",
            opacity: busy || !agreed || name.trim().length < 2 ? 0.45 : 1,
            fontFamily: "inherit",
          }}
        >
          {busy ? "Enregistrement…" : "Bon pour accord"}
        </button>
        {emitterEmail && (
          <a
            href={`mailto:${emitterEmail}?subject=${encodeURIComponent(`Devis ${number}`)}`}
            style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, textDecoration: "none" }}
          >
            J&apos;ai une question
          </a>
        )}
      </div>
    </div>
  );
}
