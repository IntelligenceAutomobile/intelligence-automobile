"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [newImage, setNewImage] = useState("");
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

      {/* URLs des images */}
      <div>
        <label className={labelClass} style={{ color: "#C8D8EE" }}>Images (URLs)</label>
        <div className="space-y-2 mb-2">
          {images.map((img, i) => (
            <div key={i} className="flex gap-2">
              <input value={img} readOnly className={inputClass + " flex-1"} style={inputStyle} />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="px-3 py-2 text-xs border"
                style={{ borderColor: "#1B3055", color: "#C8D8EE" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="https://... (URL image)"
            className={inputClass + " flex-1"}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => {
              if (newImage.trim()) {
                setImages([...images, newImage.trim()]);
                setNewImage("");
              }
            }}
            className="px-4 py-2 text-xs font-semibold tracking-widest uppercase"
            style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
          >
            Ajouter
          </button>
        </div>
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
          disabled={loading}
          className="text-sm font-semibold tracking-widest uppercase px-8 py-4 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
        >
          {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer le véhicule"}
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
