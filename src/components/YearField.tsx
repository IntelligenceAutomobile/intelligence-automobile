"use client";

import { useState } from "react";

// Sélecteur d'année partagé (formulaires publics) : « Autre… » en tête de liste ;
// le choisir fait apparaître un champ pour saisir n'importe quelle année à la main.
// La valeur réellement soumise passe par un <input hidden> portant `name`.
const OTHER = "__other__";

export default function YearField({
  name,
  years,
  anyLabel,
  otherLabel,
  manualPlaceholder,
  fieldStyle,
  required = false,
  focusColor = "#6B9FEE",
  blurColor = "#2A4878",
}: {
  name: string;
  years: number[];
  anyLabel: string;
  otherLabel: string;
  manualPlaceholder: string;
  fieldStyle: React.CSSProperties;
  required?: boolean;
  focusColor?: string;
  blurColor?: string;
}) {
  const [choice, setChoice] = useState("");
  const [custom, setCustom] = useState("");
  const value = choice === OTHER ? custom.trim() : choice;

  return (
    <>
      {/* Valeur réellement soumise (année choisie, ou saisie libre si « Autre »). */}
      <input type="hidden" name={name} value={value} />
      <select
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
        required={required}
        style={{ ...fieldStyle, cursor: "pointer" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = focusColor)}
        onBlur={(e) => (e.currentTarget.style.borderColor = blurColor)}
      >
        <option value={OTHER}>{otherLabel}…</option>
        <option value="">{anyLabel}</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      {choice === OTHER && (
        <input
          type="number"
          required={required}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={manualPlaceholder}
          style={{ ...fieldStyle, marginTop: "10px" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = focusColor)}
          onBlur={(e) => (e.currentTarget.style.borderColor = blurColor)}
        />
      )}
    </>
  );
}
