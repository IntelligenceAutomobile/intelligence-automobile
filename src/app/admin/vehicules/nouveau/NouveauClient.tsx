"use client";

import { useState } from "react";
import VehiculeForm from "@/components/VehiculeForm";
import { T, SectionCard, fieldStyle, fieldClass, btnPrimaryClass, btnPrimaryStyle } from "../../ui";

type Seed = {
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;
  color?: string;
  fuel?: string;
  transmission?: string;
  power?: number;
  origin?: string;
  description?: string;
  features?: string[];
  conditionFacts?: string[];
  maintenanceHistory?: { date: string; km: string; operation: string; amount: string; linkedDoc: string }[];
  maintenanceHighlights?: { icon: string; label: string; text: string }[];
};

export default function NouveauClient() {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seed, setSeed] = useState<Seed | undefined>(undefined);
  const [seedKey, setSeedKey] = useState(0);

  async function generate() {
    if (!raw.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/vehicules/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors de la génération.");
        return;
      }
      const clean: Seed = {};
      if (json.make) clean.make = json.make;
      if (json.model) clean.model = json.model;
      if (json.year > 1900) clean.year = json.year;
      if (json.mileage > 0) clean.mileage = json.mileage;
      if (json.price > 0) clean.price = json.price;
      if (json.color) clean.color = json.color;
      if (json.fuel) clean.fuel = json.fuel;
      if (json.transmission) clean.transmission = json.transmission;
      if (json.power > 0) clean.power = json.power;
      if (json.origin) clean.origin = json.origin;
      if (json.description) clean.description = json.description;
      if (Array.isArray(json.features) && json.features.length) clean.features = json.features;
      if (Array.isArray(json.conditionFacts) && json.conditionFacts.length) clean.conditionFacts = json.conditionFacts;
      if (Array.isArray(json.maintenanceHistory) && json.maintenanceHistory.length) {
        const rows = json.maintenanceHistory
          .filter((m: { date?: string; km?: string; operation?: string; amount?: string }) => (m.operation ?? "").trim())
          .map((m: { date?: string; km?: string; operation?: string; amount?: string }) => ({
            date: m.date ?? "",
            km: m.km ?? "",
            operation: m.operation ?? "",
            amount: m.amount ?? "",
            linkedDoc: "",
          }));
        if (rows.length) clean.maintenanceHistory = rows;
      }
      if (Array.isArray(json.maintenanceHighlights) && json.maintenanceHighlights.length) {
        const badges = json.maintenanceHighlights
          .filter((h: { icon?: string; label?: string; text?: string }) => (h.label ?? "").trim() || (h.text ?? "").trim())
          .map((h: { icon?: string; label?: string; text?: string }) => ({ icon: h.icon || "✓", label: h.label ?? "", text: h.text ?? "" }));
        if (badges.length) clean.maintenanceHighlights = badges;
      }

      setSeed(clean);
      setSeedKey((k) => k + 1);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard title="✨ Pré-remplir depuis une source (assistant IA)">
        <p className="text-[12px] -mt-2" style={{ color: T.muted }}>
          Collez une annonce (mobile.de, leboncoin…), vos notes ou une fiche technique. L&apos;IA remplit le
          formulaire ci-dessous — vous vérifiez et complétez avant d&apos;enregistrer.
        </p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={6}
          placeholder="Collez ici l'annonce, vos notes, le texte d'un contrôle technique…"
          className={fieldClass + " resize-y leading-relaxed"}
          style={fieldStyle}
        />
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={generate}
            disabled={loading || !raw.trim()}
            className={btnPrimaryClass + " px-6 py-3 disabled:opacity-60"}
            style={btnPrimaryStyle}
          >
            {loading ? "Génération…" : "✨ Générer le brouillon"}
          </button>
          {seed && !loading && (
            <span className="text-xs" style={{ color: "#5BD89A" }}>
              ✓ Brouillon appliqué — vérifiez et complétez les champs ci-dessous.
            </span>
          )}
        </div>
        {error && <p className="text-xs" style={{ color: T.danger }}>{error}</p>}
      </SectionCard>

      <VehiculeForm key={seedKey} data={seed} />
    </div>
  );
}
