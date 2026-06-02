"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

const ANNEES = Array.from({ length: 10 }, (_, i) => 2025 - i);
const CARBURANTS = ["Peu importe", "Essence", "Diesel", "Hybride", "Électrique"];
const BOITES = ["Peu importe", "Automatique", "Manuelle"];

const fieldStyle: React.CSSProperties = {
  backgroundColor: "#040B16",
  border: "1px solid #1B3055",
  color: "#F0F5FF",
  outline: "none",
  width: "100%",
  padding: "14px 16px",
  fontSize: "0.875rem",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "9px",
  letterSpacing: "0.35em",
  textTransform: "uppercase" as const,
  marginBottom: "12px",
  color: "#8AABD4",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-5 space-y-5"
      style={{ backgroundColor: "#0A1628", border: "1px solid #1B3055" }}
    >
      <p
        className="text-[9px] tracking-[0.35em] uppercase pb-4"
        style={{ color: "#6B9FEE", borderBottom: "1px solid #1B3055" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

export default function RechercheForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const d = new FormData(form);

    const message = `RECHERCHE PERSONNALISÉE

Véhicule :
— Marque : ${d.get("marque")}
— Modèle : ${d.get("modele")}
— Budget max : ${d.get("budget")}
— Kilométrage max : ${d.get("kilometrage") || "Non précisé"}
— Année min : ${d.get("annee") || "Peu importe"}
— Carburant : ${d.get("carburant")}
— Boîte : ${d.get("boite")}
— Options : ${d.get("options") || "Non précisé"}

Précisions : ${d.get("precisions") || "Aucune"}`;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: `${d.get("prenom")} ${d.get("nom")}`,
          email: d.get("email"),
          telephone: d.get("telephone"),
          sujet: "mandat",
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
        style={{ backgroundColor: "#0A1628", border: "1px solid #1B3055" }}
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
          Recherche reçue
        </h3>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#8AABD4" }}>
          Nous analysons votre demande et revenons vers vous sous 24h ouvrées avec une première sélection.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SectionCard title="Le véhicule">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Marque *</label>
            <input
              name="marque" required type="text" placeholder="BMW, Audi, Mercedes..."
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div>
            <label style={labelStyle}>Modèle / Version *</label>
            <input
              name="modele" required type="text" placeholder="Série 3, A4, Classe C..."
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label style={labelStyle}>Budget maximum *</label>
            <input
              name="budget" required type="text" placeholder="Ex : 35 000 €"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div>
            <label style={labelStyle}>Kilométrage max</label>
            <input
              name="kilometrage" type="text" placeholder="Ex : 80 000 km"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div>
            <label style={labelStyle}>Année minimum</label>
            <select
              name="annee"
              style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            >
              <option value="">Peu importe</option>
              {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Carburant</label>
            <select
              name="carburant"
              style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            >
              {CARBURANTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Boîte de vitesses</label>
            <select
              name="boite"
              style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            >
              {BOITES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Options souhaitées</label>
          <textarea
            name="options" rows={2}
            placeholder="Pack Sport, Toit ouvrant, LED, Carplay..."
            style={{ ...fieldStyle, resize: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
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
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input
              name="nom" required type="text" placeholder="Votre nom"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
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
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input
              name="telephone" type="tel" placeholder="+33 6 00 00 00 00"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Précisions supplémentaires</label>
          <textarea
            name="precisions" rows={3}
            placeholder="Tout élément qui nous aiderait à mieux cibler votre recherche..."
            style={{ ...fieldStyle, resize: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
          />
        </div>
      </SectionCard>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full text-sm font-bold tracking-[0.2em] uppercase py-5 transition-all duration-300 hover:-translate-y-px disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
      >
        {status === "sending" ? "Envoi en cours..." : "Soumettre ma recherche"}
      </button>

      <p className="text-center text-[11px]" style={{ color: "#8AABD4" }}>
        Commission fixe annoncée avant tout engagement · Aucun frais si nous ne trouvons pas
      </p>

      {status === "error" && (
        <div
          className="p-5 text-sm"
          style={{ borderLeft: "2px solid #8AABD4", backgroundColor: "#040B16", color: "#8AABD4" }}
        >
          Une erreur s&apos;est produite. Contactez-nous à contact@intelligenceautomobile.com
        </div>
      )}
    </form>
  );
}
