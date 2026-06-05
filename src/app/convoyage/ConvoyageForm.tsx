"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

const ANNEES = Array.from({ length: 25 }, (_, i) => 2025 - i);

const fieldStyle: React.CSSProperties = {
  backgroundColor: "#071428",
  border: "1px solid #2A4878",
  color: "#F0F5FF",
  outline: "none",
  width: "100%",
  padding: "14px 16px",
  fontSize: "1rem",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  marginBottom: "12px",
  color: "#AABFDA",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-5 space-y-5"
      style={{ backgroundColor: "#0A1628", border: "1px solid #2A4878" }}
    >
      <p
        className="text-[11px] tracking-[0.2em] uppercase pb-4"
        style={{ color: "#6B9FEE", borderBottom: "1px solid #2A4878" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

export default function ConvoyageForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const d = new FormData(form);

    const message = `CONVOYAGE

Trajet :
— Lieu de prise en charge : ${d.get("depart")}
— Lieu de livraison : ${d.get("arrivee")}
— Date souhaitée : ${d.get("date") || "Non précisée"}

Véhicule :
— Marque : ${d.get("marque")}
— Modèle : ${d.get("modele")}
— Année : ${d.get("annee") || "Non précisée"}

Notes : ${d.get("notes") || "Aucune"}`;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: `${d.get("prenom")} ${d.get("nom")}`,
          email: d.get("email"),
          telephone: d.get("telephone"),
          sujet: "convoyage",
          message,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="p-12 flex flex-col items-center text-center"
        style={{ backgroundColor: "#0A1628", border: "1px solid #2A4878" }}
      >
        <div
          className="w-14 h-14 flex items-center justify-center mb-6"
          style={{
            backgroundColor: "rgba(107,159,238,0.07)",
            border: "1px solid rgba(107,159,238,0.18)",
          }}
        >
          <span style={{ color: "#6B9FEE", fontSize: "22px" }}>✓</span>
        </div>
        <h3
          className="font-black uppercase mb-4"
          style={{ fontSize: "1.4rem", letterSpacing: "-0.02em" }}
        >
          Demande reçue
        </h3>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#AABFDA" }}>
          Nous revenons vers vous sous 24h ouvrées avec un devis fixe et les détails de la prise en charge.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ fontFamily: "var(--font-inter)" }}>
      <SectionCard title="Le trajet">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Lieu de prise en charge *</label>
            <input
              name="depart" required type="text" placeholder="Ville ou code postal"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>Lieu de livraison *</label>
            <input
              name="arrivee" required type="text" placeholder="Ville ou code postal"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Date souhaitée</label>
          <input
            name="date" type="text" placeholder="Ex : à partir du 15 juin, semaine du 23..."
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          />
        </div>
      </SectionCard>

      <SectionCard title="Le véhicule">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Marque *</label>
            <input
              name="marque" required type="text" placeholder="BMW, Audi, Mercedes..."
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>Modèle *</label>
            <input
              name="modele" required type="text" placeholder="Série 5, A6, Classe E..."
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Année</label>
          <select
            name="annee"
            style={{ ...fieldStyle, cursor: "pointer" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          >
            <option value="">Non précisée</option>
            {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            name="notes" rows={2}
            placeholder="Particularité du véhicule, accès difficile, clés à récupérer auprès d'un tiers..."
            style={{ ...fieldStyle, resize: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          />
        </div>
      </SectionCard>

      <SectionCard title="Vos coordonnées">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Prénom *</label>
            <input
              name="prenom" required type="text" placeholder="Votre prénom"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input
              name="nom" required type="text" placeholder="Votre nom"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              name="email" required type="email" placeholder="votre@email.fr"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input
              name="telephone" type="tel" placeholder="+33 6 00 00 00 00"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>
      </SectionCard>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full text-sm font-bold tracking-[0.2em] uppercase py-5 transition-all duration-300 hover:-translate-y-px disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
      >
        {status === "sending" ? "Envoi en cours..." : "Demander un devis"}
      </button>

      <p className="text-center text-[11px]" style={{ color: "#AABFDA" }}>
        Devis gratuit sous 24h · Tarif fixe, sans surprise
      </p>

      {status === "error" && (
        <div
          className="p-5 text-sm"
          style={{ borderLeft: "2px solid #AABFDA", backgroundColor: "#071428", color: "#AABFDA" }}
        >
          Une erreur s&apos;est produite. Contactez-nous à contact@intelligenceautomobile.com
        </div>
      )}
    </form>
  );
}
