"use client";

// Bloc d'acceptation sous le devis public : le client signe d'un bouton, sans
// imprimer, sans scanner et sans compte.
import { useState } from "react";


// Textes de la page d'acceptation, dans la langue du devis. Un document en
// anglais suivi d'un bouton « Bon pour accord » laisse le client deviner.
function textes(lang: "fr" | "en") {
  if (lang === "en") {
    return {
      acceptedLabel: "Quotation accepted",
      thanks: (n: string, num: string) => `Thank you${n ? `, ${n}` : ""}. Your approval of quotation ${num} has been recorded.`,
      followUp: (e: string) => `${e} will get back to you shortly.`,
      closedLabel: "Quotation closed",
      closed: (e: string) => `This quotation has been closed. ${e} remains at your disposal to prepare a new one.`,
      expiredLabel: "Quotation expired",
      expiredUntil: (d: string) => `This quotation was valid until ${d}.`,
      expiredAsk: (e: string) => `Please contact ${e} for an up-to-date proposal.`,
      approveLabel: "Approval",
      quotation: "Quotation",
      depositLine: (d: string) => ` · ${d} deposit on order`,
      validLine: (d: string) => ` · valid until ${d}`,
      yourName: "Your name",
      namePlaceholder: "First and last name of the signatory",
      agree: "I accept this quotation and the terms set out in it.",
      submit: "Approve",
      submitting: "Saving…",
      question: "I have a question",
      failed: "Saving failed. Please try again in a moment.",
    };
  }
  return {
    acceptedLabel: "Devis accepté",
    thanks: (n: string, num: string) => `Merci${n ? `, ${n}` : ""}. Votre accord sur le devis ${num} est enregistré.`,
    followUp: (e: string) => `${e} revient vers vous pour la suite.`,
    closedLabel: "Devis clos",
    closed: (e: string) => `Ce devis a été clôturé. ${e} reste à votre disposition pour en établir un nouveau.`,
    expiredLabel: "Devis expiré",
    expiredUntil: (d: string) => `Ce devis était valable jusqu'au ${d}.`,
    expiredAsk: (e: string) => `Contactez ${e} pour obtenir une proposition à jour.`,
    approveLabel: "Bon pour accord",
    quotation: "Devis",
    depositLine: (d: string) => ` · acompte de ${d} à la commande`,
    validLine: (d: string) => ` · valable jusqu'au ${d}`,
    yourName: "Votre nom",
    namePlaceholder: "Prénom et nom du signataire",
    agree: "J'accepte ce devis et les conditions qui y figurent.",
    submit: "Bon pour accord",
    submitting: "Enregistrement…",
    question: "J'ai une question",
    failed: "L'enregistrement a échoué. Réessayez dans un instant.",
  };
}

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
  lang = "fr",
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
  /** Langue du devis : la page suit le document. */
  lang?: "fr" | "en";
}) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(accepted);
  const [doneName, setDoneName] = useState(signerName);
  const [error, setError] = useState("");
  const L = textes(lang);

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
      setError(e instanceof Error && e.message ? e.message : L.failed);
    } finally {
      setBusy(false);
    }
  }

  const contact = [emitterEmail, emitterPhone].filter(Boolean).join(" · ");

  if (done) {
    return (
      <div style={{ ...card, borderTop: "2px solid #0F8A6A" }}>
        <p style={{ ...label, color: "#0F8A6A" }}>{L.acceptedLabel}</p>
        <p style={{ margin: "0 0 6px", fontSize: 17 }}>{L.thanks(doneName, number)}</p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          {L.followUp(emitter)}{contact ? ` ${contact}` : ""}
        </p>
      </div>
    );
  }

  if (refused) {
    return (
      <div style={card}>
        <p style={label}>{L.closedLabel}</p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          {L.closed(emitter)}{contact ? ` ${contact}` : ""}
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div style={{ ...card, borderTop: "2px solid #C2410C" }}>
        <p style={{ ...label, color: "#C2410C" }}>{L.expiredLabel}</p>
        <p style={{ margin: "0 0 6px", fontSize: 15 }}>{L.expiredUntil(validUntil)}</p>
        <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>
          {L.expiredAsk(emitter)}{contact ? ` ${contact}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <p style={label}>{L.approveLabel}</p>
      <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{amount}</p>
      <p style={{ margin: "0 0 20px", color: "#6B7280", fontSize: 14 }}>
        {L.quotation} {number}
        {deposit ? L.depositLine(deposit) : ""}
        {validUntil ? L.validLine(validUntil) : ""}
      </p>

      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={label}>{L.yourName}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L.namePlaceholder}
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
        <span>{L.agree}</span>
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
          {busy ? L.submitting : L.submit}
        </button>
        {emitterEmail && (
          <a
            href={`mailto:${emitterEmail}?subject=${encodeURIComponent(`${L.quotation} ${number}`)}`}
            style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, textDecoration: "none" }}
          >
            {L.question}
          </a>
        )}
      </div>
    </div>
  );
}
