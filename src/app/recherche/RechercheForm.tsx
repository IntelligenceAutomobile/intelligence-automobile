"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/context";
import YearField from "@/components/YearField";

type Status = "idle" | "sending" | "success" | "error";

const ANNEES = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

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
  color: "#DCE8F8",
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

export default function RechercheForm() {
  const { t } = useLocale();
  const f = t.search.form;
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
          {f.successTitle}
        </h3>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#DCE8F8" }}>
          {f.successMsg}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ia-search-form space-y-4" style={{ fontFamily: "var(--font-inter)" }}>
      <style>{`.ia-search-form ::placeholder { color: #9FB7D8; opacity: 1; }`}</style>
      <SectionCard title={f.vehicleSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>{f.makeLabel}</label>
            <input
              name="marque" required type="text" placeholder={f.makePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.modelLabel}</label>
            <input
              name="modele" required type="text" placeholder={f.modelPlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label style={labelStyle}>{f.budgetLabel}</label>
            <input
              name="budget" required type="text" placeholder={f.budgetPlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.mileageLabel}</label>
            <input
              name="kilometrage" type="text" placeholder={f.mileagePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.yearLabel}</label>
            <YearField
              name="annee"
              years={ANNEES}
              anyLabel={f.yearAny}
              otherLabel={f.yearOther}
              manualPlaceholder={f.yearManual}
              fieldStyle={fieldStyle}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>{f.fuelLabel}</label>
            <select
              name="carburant"
              style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            >
              {f.fuels.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{f.gearboxLabel}</label>
            <select
              name="boite"
              style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            >
              {f.gearboxes.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>{f.optionsLabel}</label>
          <textarea
            name="options" rows={2}
            placeholder={f.optionsPlaceholder}
            style={{ ...fieldStyle, resize: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          />
        </div>
      </SectionCard>

      <SectionCard title={f.coordsSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>{f.firstNameLabel}</label>
            <input
              name="prenom" required type="text" placeholder={f.firstNamePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.lastNameLabel}</label>
            <input
              name="nom" required type="text" placeholder={f.lastNamePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>{f.emailLabel}</label>
            <input
              name="email" required type="email" placeholder={f.emailPlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.phoneLabel}</label>
            <input
              name="telephone" type="tel" placeholder={f.phonePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{f.detailsLabel}</label>
          <textarea
            name="precisions" rows={3}
            placeholder={f.detailsPlaceholder}
            style={{ ...fieldStyle, resize: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          />
        </div>
      </SectionCard>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full text-sm font-bold tracking-[0.2em] uppercase py-5 transition-all duration-300 hover:-translate-y-px disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
      >
        {status === "sending" ? f.submittingBtn : f.submitBtn}
      </button>

      <p className="text-center text-[11px]" style={{ color: "#DCE8F8" }}>
        {f.footer}
      </p>

      {status === "error" && (
        <div
          className="p-5 text-sm"
          style={{ borderLeft: "2px solid #DCE8F8", backgroundColor: "#071428", color: "#DCE8F8" }}
        >
          {f.errorMsg}
        </div>
      )}
    </form>
  );
}
