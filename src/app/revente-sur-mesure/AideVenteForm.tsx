"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { useLocale } from "@/i18n/context";
import YearField from "@/components/YearField";
import WhatsAppIcon from "@/components/WhatsAppIcon";

type Status = "idle" | "sending" | "success" | "error";

const ANNEES = Array.from({ length: 13 }, (_, i) => new Date().getFullYear() - i);

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
    <div className="p-5 space-y-5" style={{ backgroundColor: "#0A1628", border: "1px solid #2A4878" }}>
      <p className="text-[11px] tracking-[0.2em] uppercase pb-4" style={{ color: "#6B9FEE", borderBottom: "1px solid #2A4878" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function AideVenteForm() {
  const { t } = useLocale();
  const f = t.resale.form;
  const [status, setStatus]   = useState<Status>("idle");
  const [photos, setPhotos]   = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef          = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, 10 - photos.length);
    const newPhotos   = [...photos,   ...incoming].slice(0, 10);
    const newPreviews = [...previews, ...incoming.map((file) => URL.createObjectURL(file))].slice(0, 10);
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

    try {
      const blobUrls = await Promise.all(
        photos.map((file) =>
          upload(`documents/${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          }).then((b) => b.url)
        )
      );
      blobUrls.forEach((url) => data.append("photoUrls", url));

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
      <div className="p-12 flex flex-col items-center text-center" style={{ backgroundColor: "#0A1628", border: "1px solid #2A4878" }}>
        <div
          className="w-14 h-14 flex items-center justify-center mb-6"
          style={{ backgroundColor: "rgba(107,159,238,0.07)", border: "1px solid rgba(107,159,238,0.18)" }}
        >
          <span style={{ color: "#5BD89A", fontSize: "22px" }}>✓</span>
        </div>
        <h3 className="font-black uppercase mb-4" style={{ fontSize: "1.4rem", letterSpacing: "-0.02em" }}>
          {f.successTitle}
        </h3>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#DCE8F8" }}>
          {f.successMsg}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ia-resale-form space-y-4" style={{ fontFamily: "var(--font-inter)" }}>
      <style>{`.ia-resale-form ::placeholder { color: #9FB7D8; opacity: 1; }`}</style>

      <SectionCard title={f.vehicleSection}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label style={labelStyle}>{f.makeLabel}</label>
            <input name="marque" required type="text" placeholder={f.makePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div className="sm:col-span-2">
            <label style={labelStyle}>{f.modelLabel}</label>
            <input name="modele" required type="text" placeholder={f.modelPlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <label style={labelStyle}>{f.yearLabel}</label>
            <YearField
              name="annee"
              years={ANNEES}
              required
              anyLabel="—"
              otherLabel={f.yearOther}
              manualPlaceholder={f.yearManual}
              fieldStyle={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.mileageLabel}</label>
            <input name="kilometrage" required type="text" placeholder={f.mileagePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.fuelLabel}</label>
            <select name="carburant" required defaultValue="" style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            >
              <option value="" disabled>{f.selectPlaceholder}</option>
              {f.fuels.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{f.gearboxLabel}</label>
            <select name="boite" required defaultValue="" style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            >
              <option value="" disabled>{f.selectPlaceholder}</option>
              {f.gearboxes.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label style={labelStyle}>{f.conditionLabel}</label>
            <select name="etat" required defaultValue="" style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            >
              <option value="" disabled>{f.selectPlaceholder}</option>
              {f.conditions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{f.maintenanceLabel}</label>
            <select name="entretien" style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            >
              {f.maintenances.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{f.priceLabel}</label>
            <input name="prix" type="text" placeholder={f.pricePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{f.detailsLabel}</label>
          <textarea name="precisions" rows={2}
            placeholder={f.detailsPlaceholder}
            style={{ ...fieldStyle, resize: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          />
        </div>
      </SectionCard>

      {/* ── Photos ── */}
      <SectionCard title={`${f.photosSection} ${photos.length > 0 ? `(${photos.length}/10)` : "(10 max)"}`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {photos.length < 10 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-3 py-8 transition-all duration-200"
            style={{ border: "1px dashed #2A4878", backgroundColor: "#071428", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
          >
            <span style={{ color: "#6B9FEE", fontSize: "22px", lineHeight: 1 }}>↑</span>
            <span className="text-sm font-semibold" style={{ color: "#F0F5FF" }}>
              {f.addPhotos}
            </span>
            <span className="text-[12px] leading-relaxed text-center px-6" style={{ color: "#C8D8EE", maxWidth: "24rem" }}>
              {f.photoHint}
            </span>
          </button>
        )}

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {previews.map((src, i) => {
              const file = photos[i];
              const isImage = file?.type.startsWith("image/");
              return (
                <div key={i} className="relative group" style={{ aspectRatio: "1" }}>
                  {isImage ? (
                    <img
                      src={src}
                      alt={file?.name ?? `Fichier ${i + 1}`}
                      className="w-full h-full object-cover"
                      style={{ border: "1px solid #2A4878" }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-1.5 text-center"
                      style={{ border: "1px solid #2A4878", backgroundColor: "#071428" }}
                    >
                      <span style={{ fontSize: "22px", lineHeight: 1 }}>📄</span>
                      <span className="text-[9px] leading-tight break-all" style={{ color: "#DCE8F8" }}>
                        {file?.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ backgroundColor: "#071428", border: "1px solid #2A4878", color: "#F0F5FF", fontSize: "11px", lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title={f.coordsSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>{f.firstNameLabel}</label>
            <input name="prenom" required type="text" placeholder={f.firstNamePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.lastNameLabel}</label>
            <input name="nom" required type="text" placeholder={f.lastNamePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>{f.emailLabel}</label>
            <input name="email" required type="email" placeholder={f.emailPlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
          <div>
            <label style={labelStyle}>{f.phoneLabel}</label>
            <input name="telephone" type="tel" placeholder={f.phonePlaceholder}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A4878")}
            />
          </div>
        </div>
      </SectionCard>

      <div
        className="flex items-start gap-3 p-4"
        style={{ backgroundColor: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.3)" }}
      >
        <WhatsAppIcon size={20} />
        <p className="text-sm leading-relaxed" style={{ color: "#DCE8F8" }}>
          {f.whatsappNote}
        </p>
      </div>

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
        <div className="p-5 text-sm" style={{ borderLeft: "2px solid #DCE8F8", backgroundColor: "#071428", color: "#DCE8F8" }}>
          {f.errorMsg}
        </div>
      )}
    </form>
  );
}
