"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/context";
import YearField from "@/components/YearField";

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
  const { t } = useLocale();
  const f = t.transport.form;
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
          {f.successTitle}
        </h3>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#AABFDA" }}>
          {f.successMsg}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ fontFamily: "var(--font-inter)" }}>
      <SectionCard title={f.tripSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>{f.pickupLabel}</label>
            <input
              name="depart" required type="text" placeholder={f.pickupPlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.deliveryLabel}</label>
            <input
              name="arrivee" required type="text" placeholder={f.deliveryPlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{f.dateLabel}</label>
          <input
            name="date" type="text" placeholder={f.datePlaceholder}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          />
        </div>
      </SectionCard>

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

        <div>
          <label style={labelStyle}>{f.yearLabel}</label>
          <YearField
            name="annee"
            years={ANNEES}
            anyLabel={f.yearUnspecified}
            otherLabel={f.yearOther}
            manualPlaceholder={f.yearManual}
            fieldStyle={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>{f.notesLabel}</label>
          <textarea
            name="notes" rows={2}
            placeholder={f.notesPlaceholder}
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
      </SectionCard>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full text-sm font-bold tracking-[0.2em] uppercase py-5 transition-all duration-300 hover:-translate-y-px disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #6B9FEE 0%, #4A7FDE 100%)", color: "#070F1E" }}
      >
        {status === "sending" ? f.submittingBtn : f.submitBtn}
      </button>

      <p className="text-center text-[11px]" style={{ color: "#AABFDA" }}>
        {f.footer}
      </p>

      {status === "error" && (
        <div
          className="p-5 text-sm"
          style={{ borderLeft: "2px solid #AABFDA", backgroundColor: "#071428", color: "#AABFDA" }}
        >
          {f.errorMsg}
        </div>
      )}
    </form>
  );
}
