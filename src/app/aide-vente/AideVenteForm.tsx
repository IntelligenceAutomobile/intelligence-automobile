"use client";

import { useState, useRef } from "react";

type Status = "idle" | "sending" | "success" | "error";

const ANNEES     = Array.from({ length: 13 }, (_, i) => 2025 - i);
const CARBURANTS = ["Peu importe", "Essence", "Diesel", "Hybride", "Électrique"];
const BOITES     = ["Peu importe", "Automatique", "Manuelle"];
const ETATS      = ["Excellent", "Très bon", "Bon", "Quelques défauts"];
const ENTRETIENS = ["Carnet complet", "Partiel", "Non documenté"];

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
    <div className="p-5 space-y-5" style={{ backgroundColor: "#0A1628", border: "1px solid #1B3055" }}>
      <p className="text-[9px] tracking-[0.35em] uppercase pb-4" style={{ color: "#6B9FEE", borderBottom: "1px solid #1B3055" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function AideVenteForm() {
  const [status, setStatus]   = useState<Status>("idle");
  const [photos, setPhotos]   = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef          = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, 5 - photos.length);
    const newPhotos   = [...photos,   ...incoming].slice(0, 5);
    const newPreviews = [...previews, ...incoming.map((f) => URL.createObjectURL(f))].slice(0, 5);
    setPhotos(newPhotos);
    setPreviews(newPreviews);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previews[i]);
    setPhotos(photos.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    photos.forEach((p) => data.append("photos", p));

    try {
      const res = await fetch("/api/aide-vente", { method: "POST", body: data });
      if (!res.ok) throw new Error();
      setStatus("success");
      form.reset();
      previews.forEach((url) => URL.revokeObjectURL(url));
      setPhotos([]);
      setPreviews([]);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="p-12 flex flex-col items-center text-center" style={{ backgroundColor: "#0A1628", border: "1px solid #1B3055" }}>
        <div
          className="w-14 h-14 flex items-center justify-center mb-6"
          style={{ backgroundColor: "rgba(107,159,238,0.07)", border: "1px solid rgba(107,159,238,0.18)" }}
        >
          <span style={{ color: "#6B9FEE", fontSize: "22px" }}>✓</span>
        </div>
        <h3 className="font-black uppercase mb-4" style={{ fontSize: "1.4rem", letterSpacing: "-0.02em" }}>
          Demande reçue
        </h3>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#8AABD4" }}>
          Nous analysons votre véhicule et vous envoyons une estimation argumentée sous 24h ouvrées.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <SectionCard title="Votre véhicule">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label style={labelStyle}>Marque *</label>
            <input name="marque" required type="text" placeholder="BMW, Audi, Mercedes..."
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div className="sm:col-span-2">
            <label style={labelStyle}>Modèle / Version *</label>
            <input name="modele" required type="text" placeholder="Série 5 530d xDrive M Sport..."
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <label style={labelStyle}>Année *</label>
            <select name="annee" required style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            >
              <option value="">—</option>
              {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Kilométrage *</label>
            <input name="kilometrage" required type="text" placeholder="Ex : 68 000"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div>
            <label style={labelStyle}>Carburant</label>
            <select name="carburant" style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            >
              {CARBURANTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Boîte</label>
            <select name="boite" style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            >
              {BOITES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label style={labelStyle}>État général *</label>
            <select name="etat" required style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            >
              <option value="">—</option>
              {ETATS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Entretien</label>
            <select name="entretien" style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            >
              {ENTRETIENS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Prix espéré (optionnel)</label>
            <input name="prix" type="text" placeholder="Ex : 28 000 €"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Précisions</label>
          <textarea name="precisions" rows={2}
            placeholder="Seconde main, options, historique, raison de la vente..."
            style={{ ...fieldStyle, resize: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
          />
        </div>
      </SectionCard>

      {/* ── Photos ── */}
      <SectionCard title={`Photos ${photos.length > 0 ? `(${photos.length}/5)` : "(5 max)"}`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {photos.length < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-3 py-8 transition-all duration-200"
            style={{ border: "1px dashed #1B3055", backgroundColor: "#040B16", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
          >
            <span style={{ color: "#6B9FEE", fontSize: "20px", lineHeight: 1 }}>↑</span>
            <span className="text-xs font-medium" style={{ color: "#C8D8EE" }}>
              Cliquez pour ajouter des photos
            </span>
            <span className="text-[10px]" style={{ color: "#8AABD4" }}>
              Extérieur · Intérieur · Compteur · Carnet d&apos;entretien
            </span>
          </button>
        )}

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative group" style={{ aspectRatio: "1" }}>
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                  style={{ border: "1px solid #1B3055" }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ backgroundColor: "#040B16", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "11px", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Vos coordonnées">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Prénom *</label>
            <input name="prenom" required type="text" placeholder="Votre prénom"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input name="nom" required type="text" placeholder="Votre nom"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Email *</label>
            <input name="email" required type="email" placeholder="votre@email.fr"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
            />
          </div>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input name="telephone" type="tel" placeholder="+33 6 00 00 00 00"
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
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
        {status === "sending" ? "Envoi en cours..." : "Demander mon estimation gratuite"}
      </button>

      <p className="text-center text-[11px]" style={{ color: "#8AABD4" }}>
        Estimation gratuite et sans engagement · Honoraires annoncés avant tout accord
      </p>

      {status === "error" && (
        <div className="p-5 text-sm" style={{ borderLeft: "2px solid #8AABD4", backgroundColor: "#040B16", color: "#8AABD4" }}>
          Une erreur s&apos;est produite. Contactez-nous à contact@intelligenceautomobile.com
        </div>
      )}
    </form>
  );
}
