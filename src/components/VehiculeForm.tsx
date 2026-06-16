"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

type VehiculeData = {
  id?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;
  color?: string;
  transmission?: string;
  fuel?: string;
  power?: number | null;
  origin?: string;
  description?: string;
  features?: string[];
  images?: string[];
  status?: string;
  isPublished?: boolean;
};

export default function VehiculeForm({ data }: { data?: VehiculeData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [features, setFeatures] = useState<string[]>(data?.features ?? []);
  const [newFeature, setNewFeature] = useState("");
  const [images, setImages] = useState<string[]>(data?.images ?? []);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPublished, setIsPublished] = useState(data?.isPublished !== false);

  const isEdit = !!data?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);

    const body = {
      make: fd.get("make"),
      model: fd.get("model"),
      year: fd.get("year"),
      mileage: fd.get("mileage"),
      price: fd.get("price"),
      color: fd.get("color"),
      transmission: fd.get("transmission"),
      fuel: fd.get("fuel"),
      power: fd.get("power") || null,
      origin: fd.get("origin"),
      description: fd.get("description"),
      status: fd.get("status"),
      isPublished,
      features,
      images,
    };

    const url = isEdit ? `/api/admin/vehicules/${data.id}` : "/api/admin/vehicules";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin/vehicules");
      router.refresh();
    } else {
      const json = await res.json();
      setError(json.error ?? "Erreur");
    }
    setLoading(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (list.length === 0) return;

    setUploadError("");
    setUploading((n) => n + list.length);

    await Promise.all(
      list.map(async (file) => {
        try {
          const blob = await upload(`vehicules/${crypto.randomUUID()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          setImages((prev) => [...prev, blob.url]);
        } catch {
          setUploadError("Une ou plusieurs photos n'ont pas pu être envoyées. Réessayez.");
        } finally {
          setUploading((n) => n - 1);
        }
      })
    );
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const inputStyle = {
    backgroundColor: "#112240",
    borderColor: "#1B3055",
    color: "#F0F5FF",
  };
  const inputClass = "w-full px-4 py-3 border text-sm outline-none focus:border-[#6B9FEE]";
  const labelClass = "block text-xs tracking-widest uppercase mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Marque *</label>
          <input name="make" required defaultValue={data?.make} placeholder="BMW" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Modèle *</label>
          <input name="model" required defaultValue={data?.model} placeholder="Série 5 520d" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Année *</label>
          <input name="year" required type="number" defaultValue={data?.year} placeholder="2021" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Kilométrage *</label>
          <input name="mileage" required type="number" defaultValue={data?.mileage} placeholder="45000" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Prix (€) *</label>
          <input name="price" required type="number" defaultValue={data?.price} placeholder="28000" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Couleur</label>
          <input name="color" defaultValue={data?.color} placeholder="Noir métallisé" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Carburant</label>
          <select name="fuel" defaultValue={data?.fuel ?? "Diesel"} className={inputClass} style={inputStyle}>
            <option>Diesel</option>
            <option>Essence</option>
            <option>Hybride</option>
            <option>Électrique</option>
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Boîte de vitesses</label>
          <select name="transmission" defaultValue={data?.transmission ?? "Automatique"} className={inputClass} style={inputStyle}>
            <option>Automatique</option>
            <option>Manuelle</option>
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Puissance (ch)</label>
          <input name="power" type="number" defaultValue={data?.power ?? ""} placeholder="190" className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Origine</label>
          <select name="origin" defaultValue={data?.origin ?? "Allemagne"} className={inputClass} style={inputStyle}>
            <option>Allemagne</option>
            <option>Belgique</option>
            <option>Autre UE</option>
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Statut</label>
          <select name="status" defaultValue={data?.status ?? "disponible"} className={inputClass} style={inputStyle}>
            <option value="disponible">Disponible</option>
            <option value="reserve">Réservé</option>
            <option value="vendu">Vendu</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} style={{ color: "#C8D8EE" }}>Visibilité publique</label>
          <button
            type="button"
            onClick={() => setIsPublished(!isPublished)}
            className="flex items-center gap-3 px-4 py-3 border text-sm w-full"
            style={{ ...inputStyle, borderColor: isPublished ? "#6B9FEE" : "#FF6B35" }}
          >
            <span
              className="w-4 h-4 flex-shrink-0 border"
              style={{
                backgroundColor: isPublished ? "#6B9FEE" : "transparent",
                borderColor: isPublished ? "#6B9FEE" : "#FF6B35",
              }}
            />
            <span style={{ color: isPublished ? "#F0F5FF" : "#FF6B35" }}>
              {isPublished ? "Visible publiquement" : "Masqué du public (visible admin seulement)"}
            </span>
          </button>
        </div>
      </div>

      <div>
        <label className={labelClass} style={{ color: "#C8D8EE" }}>Description</label>
        <textarea name="description" rows={4} defaultValue={data?.description} placeholder="Décrivez le véhicule..." className={inputClass + " resize-none"} style={inputStyle} />
      </div>

      {/* Photos */}
      <div>
        <label className={labelClass} style={{ color: "#C8D8EE" }}>
          Photos {images.length > 0 ? `(${images.length})` : ""}
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Zone d'ajout : clic ou glisser-déposer */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className="flex flex-col items-center gap-2 py-8 px-4 text-center cursor-pointer"
          style={{ border: `1px dashed ${dragOver ? "#6B9FEE" : "#1B3055"}`, backgroundColor: "#112240" }}
        >
          <span style={{ color: "#6B9FEE", fontSize: "22px", lineHeight: 1 }}>↑</span>
          <span className="text-sm" style={{ color: "#C8D8EE" }}>
            Cliquez pour choisir des photos, ou prenez-les avec votre téléphone
          </span>
          <span className="text-[11px]" style={{ color: "#7C92B5" }}>
            Vous pouvez aussi glisser-déposer vos images ici — JPG, PNG, HEIC (15 Mo max/photo)
          </span>
        </div>

        {uploading > 0 && (
          <p className="text-xs mt-2 flex items-center gap-2" style={{ color: "#6B9FEE" }}>
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Envoi de {uploading} photo{uploading > 1 ? "s" : ""}…
          </p>
        )}
        {uploadError && <p className="text-xs mt-2" style={{ color: "#FF6B35" }}>{uploadError}</p>}

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            {images.map((url, i) => (
              <div key={url} className="relative group" style={{ aspectRatio: "4 / 3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" style={{ border: "1px solid #1B3055" }} />

                {i === 0 && (
                  <span
                    className="absolute top-1 left-1 text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5"
                    style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
                  >
                    Principale
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  title="Supprimer cette photo"
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center"
                  style={{ backgroundColor: "#0B1930", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "13px", lineHeight: 1 }}
                >
                  ×
                </button>

                <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveImage(i, -1)}
                    title="Déplacer avant"
                    className="w-6 h-6 flex items-center justify-center disabled:opacity-30"
                    style={{ backgroundColor: "#0B1930", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "14px", lineHeight: 1 }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    disabled={i === images.length - 1}
                    onClick={() => moveImage(i, 1)}
                    title="Déplacer après"
                    className="w-6 h-6 flex items-center justify-center disabled:opacity-30"
                    style={{ backgroundColor: "#0B1930", border: "1px solid #1B3055", color: "#F0F5FF", fontSize: "14px", lineHeight: 1 }}
                  >
                    ›
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] mt-2" style={{ color: "#7C92B5" }}>
          La première photo sert d&apos;image principale de l&apos;annonce. Utilisez ‹ › pour réordonner.
        </p>
      </div>

      {/* Équipements */}
      <div>
        <label className={labelClass} style={{ color: "#C8D8EE" }}>Équipements</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {features.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1 text-xs px-2 py-1 border"
              style={{ borderColor: "#1B3055", color: "#C8D8EE" }}
            >
              {f}
              <button
                type="button"
                onClick={() => setFeatures(features.filter((x) => x !== f))}
                className="ml-1"
                style={{ color: "#C8D8EE" }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (newFeature.trim()) {
                  setFeatures([...features, newFeature.trim()]);
                  setNewFeature("");
                }
              }
            }}
            placeholder="Ex: Toit panoramique"
            className={inputClass + " flex-1"}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => {
              if (newFeature.trim()) {
                setFeatures([...features, newFeature.trim()]);
                setNewFeature("");
              }
            }}
            className="px-4 py-2 text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: "#112240", borderColor: "#1B3055", color: "#C8D8EE", border: "1px solid #1B3055" }}
          >
            Ajouter
          </button>
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: "#C8D8EE" }}>{error}</p>}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || uploading > 0}
          className="text-sm font-semibold tracking-widest uppercase px-8 py-4 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
        >
          {loading
            ? "Enregistrement..."
            : uploading > 0
              ? "Photos en cours d'envoi…"
              : isEdit
                ? "Mettre à jour"
                : "Créer le véhicule"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/vehicules")}
          className="text-sm font-semibold tracking-widest uppercase px-8 py-4 border"
          style={{ borderColor: "#1B3055", color: "#C8D8EE" }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
