"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  SectionCard,
  T,
  fieldStyle,
  fieldClass,
  labelClass,
  btnPrimaryClass,
  btnPrimaryStyle,
  btnGhostClass,
  btnGhostStyle,
} from "@/app/admin/ui";

type DocItem = { url: string; label: string };
type MaintEntry = { date: string; km: string; operation: string; amount: string; linkedDoc: string };
type Highlight = { icon: string; label: string; text: string };
// Représentations internes : clé stable pour un rendu correct des listes éditables
type MaintRow = MaintEntry & { _key: string };
type HighlightRow = Highlight & { _key: string };

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
  conditionFacts?: string[];
  maintenanceHistory?: MaintEntry[];
  maintenanceHighlights?: Highlight[];
  documents?: DocItem[];
  status?: string;
  isPublished?: boolean;
};

// ── Aides à la saisie ────────────────────────────────────────────────────────
const EQUIPMENT_LIBRARY: { group: string; items: string[] }[] = [
  { group: "Confort", items: ["Sièges chauffants", "Sièges électriques", "Climatisation automatique", "Climatisation bizone", "Volant chauffant", "Démarrage sans clé (Keyless)", "Rétroviseurs rabattables électriquement", "Toit panoramique", "Hayon électrique", "Sièges sport S line"] },
  { group: "Technologie", items: ["Apple CarPlay", "Android Auto", "Navigation GPS", "Bluetooth", "Virtual Cockpit", "Système audio Bang & Olufsen", "MMI Navigation Plus", "Éclairage d'ambiance", "Chargeur smartphone à induction", "Affichage tête haute"] },
  { group: "Design & S line", items: ["Pack S line", "Jantes alliage", "Phares full LED", "Phares Matrix LED", "Feux arrière LED", "Bas de caisse S line", "Double sortie d'échappement", "Vitres surteintées", "Étriers de frein peints"] },
  { group: "Sécurité & aides", items: ["Régulateur de vitesse", "Régulateur adaptatif (ACC)", "Caméra de recul", "Radars de stationnement avant/arrière", "Détecteur d'angle mort", "Freinage d'urgence automatique", "Alerte de franchissement de ligne", "ABS / ESP", "Airbags multiples", "Fixations Isofix"] },
];

const CONDITION_PRESETS = [
  "Aucun accident déclaré",
  "Carnet d'entretien complet",
  "Première main",
  "Contrôle technique vierge",
  "Véhicule non-fumeur",
  "Distribution récente",
  "Pneus récents",
  "Garantie 12 mois incluse",
];

const HIGHLIGHT_PRESETS: Highlight[] = [
  { icon: "📓", label: "Carnet d'origine", text: "" },
  { icon: "🧾", label: "Factures originales", text: "" },
  { icon: "✓", label: "Contrôle technique", text: "" },
  { icon: "🔧", label: "Entretien suivi", text: "" },
];

function prettyLabelFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/^[0-9a-f-]{8,}-/i, "");
  const spaced = base.replace(/[-_]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ── Styles locaux ────────────────────────────────────────────────────────────
const hintStyle = { color: T.muted } as const;
const pillClass = "text-[12px] px-3 py-1.5 border transition-colors hover:border-[#6B9FEE]";
const pillStyle = { borderColor: T.border, color: T.textDim, borderRadius: "999px" } as const;
const iconBtnClass = "px-3 py-3 border text-sm leading-none disabled:opacity-30";

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] -mt-2" style={hintStyle}>{children}</p>;
}

export default function VehiculeForm({ data }: { data?: VehiculeData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isPublished, setIsPublished] = useState(data?.isPublished !== false);

  const [features, setFeatures] = useState<string[]>(data?.features ?? []);
  const [newFeature, setNewFeature] = useState("");

  const [conditionFacts, setConditionFacts] = useState<string[]>(data?.conditionFacts ?? []);
  const [newCondition, setNewCondition] = useState("");

  const [maintenance, setMaintenance] = useState<MaintRow[]>(() =>
    (data?.maintenanceHistory ?? []).map((m) => ({ ...m, _key: crypto.randomUUID() }))
  );
  const [highlights, setHighlights] = useState<HighlightRow[]>(() =>
    (data?.maintenanceHighlights ?? []).map((h) => ({ ...h, _key: crypto.randomUUID() }))
  );

  const [images, setImages] = useState<string[]>(data?.images ?? []);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocItem[]>(data?.documents ?? []);
  const [docUploading, setDocUploading] = useState(0);
  const [docUploadError, setDocUploadError] = useState("");
  const docInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!data?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);

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
      conditionFacts,
      maintenanceHistory: maintenance
        .filter((m) => m.operation.trim() || m.date.trim() || m.km.trim() || m.amount.trim() || m.linkedDoc)
        .map((m) => ({ date: m.date, km: m.km, operation: m.operation, amount: m.amount, linkedDoc: m.linkedDoc })),
      maintenanceHighlights: highlights
        .filter((h) => h.label.trim() || h.text.trim())
        .map((h) => ({ icon: h.icon, label: h.label, text: h.text })),
      documents,
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
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Erreur");
    }
    setLoading(false);
  }

  // ── Photos ──
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

  // ── Documents ──
  async function handleDocFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (docInputRef.current) docInputRef.current.value = "";
    if (list.length === 0) return;

    setDocUploadError("");
    setDocUploading((n) => n + list.length);

    await Promise.all(
      list.map(async (file) => {
        try {
          const blob = await upload(`documents/${crypto.randomUUID()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          setDocuments((prev) => [...prev, { url: blob.url, label: prettyLabelFromFilename(file.name) }]);
        } catch {
          setDocUploadError("Un ou plusieurs documents n'ont pas pu être envoyés. Réessayez.");
        } finally {
          setDocUploading((n) => n - 1);
        }
      })
    );
  }
  function removeDoc(index: number) {
    const removed = documents[index]?.url;
    setDocuments((prev) => prev.filter((_, i) => i !== index));
    // Détache ce document des interventions qui le référençaient (pas de lien mort)
    if (removed)
      setMaintenance((prev) => prev.map((m) => (m.linkedDoc === removed ? { ...m, linkedDoc: "" } : m)));
  }
  function updateDocLabel(index: number, label: string) {
    setDocuments((prev) => prev.map((d, i) => (i === index ? { ...d, label } : d)));
  }

  // ── État ──
  function addCondition(value: string) {
    const v = value.trim();
    if (v && !conditionFacts.includes(v)) setConditionFacts((prev) => [...prev, v]);
  }

  // ── Équipements ──
  function addFeature(value: string) {
    const v = value.trim();
    if (v && !features.includes(v)) setFeatures((prev) => [...prev, v]);
  }

  // ── Entretien ──
  function addMaintenance() {
    setMaintenance((prev) => [...prev, { date: "", km: "", operation: "", amount: "", linkedDoc: "", _key: crypto.randomUUID() }]);
  }
  function updateMaintenance(index: number, field: keyof MaintEntry, value: string) {
    setMaintenance((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }
  function removeMaintenance(index: number) {
    setMaintenance((prev) => prev.filter((_, i) => i !== index));
  }
  function moveMaintenance(index: number, dir: -1 | 1) {
    setMaintenance((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // ── Highlights ──
  function addHighlight(preset?: Highlight) {
    setHighlights((prev) => [
      ...prev,
      preset ? { ...preset, _key: crypto.randomUUID() } : { icon: "✓", label: "", text: "", _key: crypto.randomUUID() },
    ]);
  }
  function updateHighlight(index: number, field: keyof Highlight, value: string) {
    setHighlights((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  }
  function removeHighlight(index: number) {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── IDENTITÉ & CARACTÉRISTIQUES ── */}
      <SectionCard title="Identité & caractéristiques">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Marque *</label>
            <input name="make" required defaultValue={data?.make} placeholder="Audi" className={fieldClass} style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Modèle *</label>
            <input name="model" required defaultValue={data?.model} placeholder="TT 2.0 TFSI 230 S line" className={fieldClass} style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Année *</label>
            <input name="year" required type="number" defaultValue={data?.year} placeholder="2014" className={fieldClass} style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Kilométrage *</label>
            <input name="mileage" required type="number" defaultValue={data?.mileage} placeholder="147000" className={fieldClass} style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Prix (€) *</label>
            <input name="price" required type="number" defaultValue={data?.price} placeholder="18990" className={fieldClass} style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Couleur</label>
            <input name="color" defaultValue={data?.color} placeholder="Gris Daytona métallisé" className={fieldClass} style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Carburant</label>
            <select name="fuel" defaultValue={data?.fuel ?? "Diesel"} className={fieldClass} style={fieldStyle}>
              <option>Diesel</option>
              <option>Essence</option>
              <option>Hybride</option>
              <option>Électrique</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Boîte de vitesses</label>
            <select name="transmission" defaultValue={data?.transmission ?? "Automatique"} className={fieldClass} style={fieldStyle}>
              <option>Automatique</option>
              <option>Manuelle</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Puissance (ch)</label>
            <input name="power" type="number" defaultValue={data?.power ?? ""} placeholder="230" className={fieldClass} style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Origine</label>
            <select name="origin" defaultValue={data?.origin ?? "Allemagne"} className={fieldClass} style={fieldStyle}>
              <option>Allemagne</option>
              <option>Belgique</option>
              <option>Autre UE</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Statut</label>
            <select name="status" defaultValue={data?.status ?? "disponible"} className={fieldClass} style={fieldStyle}>
              <option value="disponible">Disponible</option>
              <option value="reserve">Réservé</option>
              <option value="vendu">Vendu</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={{ color: T.textDim }}>Visibilité publique</label>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className="flex items-center gap-3 px-4 py-3 border text-sm w-full"
              style={{ ...fieldStyle, borderColor: isPublished ? T.accent : T.danger }}
            >
              <span
                className="w-4 h-4 flex-shrink-0 border"
                style={{ backgroundColor: isPublished ? T.accent : "transparent", borderColor: isPublished ? T.accent : T.danger }}
              />
              <span style={{ color: isPublished ? T.text : T.danger }}>
                {isPublished ? "Visible publiquement" : "Masqué du public (visible admin seulement)"}
              </span>
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── PRÉSENTATION ── */}
      <SectionCard title="Présentation">
        <Hint>Le texte d&apos;accroche en haut de page. Séparez les paragraphes par une ligne vide ; les chiffres (ch, km, %) sont mis en valeur automatiquement.</Hint>
        <textarea
          name="description"
          rows={7}
          defaultValue={data?.description}
          placeholder={"Décrivez le véhicule : son caractère, son état, son histoire…\n\nUn paragraphe par idée. Laissez une ligne vide entre chaque."}
          className={fieldClass + " resize-y leading-relaxed"}
          style={fieldStyle}
        />
      </SectionCard>

      {/* ── ÉTAT DU VÉHICULE ── */}
      <SectionCard title="État du véhicule">
        <Hint>Faits rassurants affichés en encarts verts ✓ sous la présentation. Cliquez une suggestion ou ajoutez la vôtre.</Hint>
        {conditionFacts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {conditionFacts.map((f) => (
              <span key={f} className="flex items-center gap-2 text-[13px] px-3 py-2" style={{ backgroundColor: "rgba(91,216,154,0.1)", border: "1px solid rgba(91,216,154,0.3)", color: T.text, borderRadius: "6px" }}>
                <span style={{ color: "#5BD89A" }}>✓</span>
                {f}
                <button type="button" onClick={() => setConditionFacts((prev) => prev.filter((x) => x !== f))} className="ml-1" style={{ color: T.textDim }}>✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {CONDITION_PRESETS.filter((p) => !conditionFacts.includes(p)).map((p) => (
            <button key={p} type="button" onClick={() => addCondition(p)} className={pillClass} style={pillStyle}>+ {p}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCondition(newCondition); setNewCondition(""); } }}
            placeholder="Ex : Contrôle technique valide jusqu'au 28/01/2028"
            className={fieldClass + " flex-1"}
            style={fieldStyle}
          />
          <button type="button" onClick={() => { addCondition(newCondition); setNewCondition(""); }} className={btnGhostClass} style={btnGhostStyle}>Ajouter</button>
        </div>
      </SectionCard>

      {/* ── ÉQUIPEMENTS & POINTS FORTS ── */}
      <SectionCard title="Équipements & points forts">
        <Hint>Cliquez les équipements dans les listes ou ajoutez les vôtres. Les 6 premiers (★) s&apos;affichent en « points forts » ; tous sont rangés automatiquement par catégorie sur la page.</Hint>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {features.map((f, i) => (
              <span key={f} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border" style={{ borderColor: i < 6 ? T.accent : T.border, color: i < 6 ? T.text : T.textDim }}>
                {i < 6 && <span title="Point fort (6 premiers)" style={{ color: T.accent }}>★</span>}
                {f}
                <button type="button" onClick={() => setFeatures(features.filter((x) => x !== f))} className="ml-1" style={{ color: T.textDim }}>✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="space-y-3">
          {EQUIPMENT_LIBRARY.map((cat) => {
            const remaining = cat.items.filter((it) => !features.includes(it));
            if (remaining.length === 0) return null;
            return (
              <div key={cat.group}>
                <p className="text-[11px] tracking-widest uppercase mb-1.5" style={{ color: T.muted }}>{cat.group}</p>
                <div className="flex flex-wrap gap-2">
                  {remaining.map((it) => (
                    <button key={it} type="button" onClick={() => addFeature(it)} className={pillClass} style={pillStyle}>+ {it}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(newFeature); setNewFeature(""); } }}
            placeholder="Équipement personnalisé…"
            className={fieldClass + " flex-1"}
            style={fieldStyle}
          />
          <button type="button" onClick={() => { addFeature(newFeature); setNewFeature(""); }} className={btnGhostClass} style={btnGhostStyle}>Ajouter</button>
        </div>
      </SectionCard>

      {/* ── PHOTOS ── */}
      <SectionCard title={`Photos${images.length > 0 ? ` (${images.length})` : ""}`}>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className="flex flex-col items-center gap-2 py-8 px-4 text-center cursor-pointer"
          style={{ border: `1px dashed ${dragOver ? T.accent : T.border}`, backgroundColor: T.float }}
        >
          <span style={{ color: T.accent, fontSize: "22px", lineHeight: 1 }}>↑</span>
          <span className="text-sm" style={{ color: T.textDim }}>Cliquez pour choisir des photos, ou prenez-les avec votre téléphone</span>
          <span className="text-[11px]" style={{ color: T.muted }}>Glisser-déposer possible — JPG, PNG, HEIC (15 Mo max/photo)</span>
        </div>

        {uploading > 0 && (
          <p className="text-xs flex items-center gap-2" style={{ color: T.accent }}>
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Envoi de {uploading} photo{uploading > 1 ? "s" : ""}…
          </p>
        )}
        {uploadError && <p className="text-xs" style={{ color: T.danger }}>{uploadError}</p>}

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div key={url} className="relative group" style={{ aspectRatio: "4 / 3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" style={{ border: `1px solid ${T.border}` }} />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5" style={{ backgroundColor: T.accent, color: T.bg }}>Principale</span>
                )}
                <button type="button" onClick={() => removeImage(i)} title="Supprimer cette photo" className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center" style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: "13px", lineHeight: 1 }}>×</button>
                <div className="absolute bottom-1 left-1 right-1 flex justify-between sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button type="button" disabled={i === 0} onClick={() => moveImage(i, -1)} title="Déplacer avant" className="w-6 h-6 flex items-center justify-center disabled:opacity-30" style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: "14px", lineHeight: 1 }}>‹</button>
                  <button type="button" disabled={i === images.length - 1} onClick={() => moveImage(i, 1)} title="Déplacer après" className="w-6 h-6 flex items-center justify-center disabled:opacity-30" style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: "14px", lineHeight: 1 }}>›</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px]" style={{ color: T.muted }}>La première photo sert d&apos;image principale de l&apos;annonce. Utilisez ‹ › pour réordonner.</p>
      </SectionCard>

      {/* ── DOCUMENTS ── */}
      <SectionCard title={`Documents${documents.length > 0 ? ` (${documents.length})` : ""}`}>
        <Hint>Factures, contrôle technique, carte grise, carnet… Protégés par mot de passe côté client. Nommez chaque document pour le lier à une intervention ci-dessous.</Hint>
        <input ref={docInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleDocFiles(e.target.files)} />
        <div
          role="button"
          tabIndex={0}
          onClick={() => docInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); docInputRef.current?.click(); } }}
          className="flex flex-col items-center gap-2 py-6 px-4 text-center cursor-pointer"
          style={{ border: `1px dashed ${T.border}`, backgroundColor: T.float }}
        >
          <span style={{ color: T.accent, fontSize: "20px", lineHeight: 1 }}>📄</span>
          <span className="text-sm" style={{ color: T.textDim }}>Ajouter des documents (scans ou photos)</span>
          <span className="text-[11px]" style={{ color: T.muted }}>JPG, PNG, HEIC (15 Mo max)</span>
        </div>

        {docUploading > 0 && (
          <p className="text-xs flex items-center gap-2" style={{ color: T.accent }}>
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Envoi de {docUploading} document{docUploading > 1 ? "s" : ""}…
          </p>
        )}
        {docUploadError && <p className="text-xs" style={{ color: T.danger }}>{docUploadError}</p>}

        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((d, i) => (
              <div key={d.url} className="flex items-center gap-3 p-2 border" style={{ borderColor: T.border }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.url} alt={d.label} className="w-14 h-14 object-cover flex-shrink-0" style={{ border: `1px solid ${T.border}` }} />
                <input value={d.label} onChange={(e) => updateDocLabel(i, e.target.value)} placeholder="Nom du document" className={fieldClass + " flex-1"} style={fieldStyle} />
                <button type="button" onClick={() => removeDoc(i)} title="Supprimer" className={iconBtnClass} style={{ borderColor: T.border, color: T.danger }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── HISTORIQUE D'ENTRETIEN ── */}
      <SectionCard title="Historique d'entretien">
        <Hint>Une ligne par intervention, de la plus récente à la plus ancienne. Liez une facture (ajoutée ci-dessus) pour la rendre cliquable côté client.</Hint>

        {/* Badges de traçabilité */}
        <p className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>Badges de traçabilité (en-tête de section)</p>
        {highlights.length > 0 && (
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={h._key} className="grid grid-cols-[3rem_1fr_2fr_auto] gap-2 items-center">
                <input value={h.icon} onChange={(e) => updateHighlight(i, "icon", e.target.value)} placeholder="✓" className={fieldClass + " text-center px-1"} style={fieldStyle} />
                <input value={h.label} onChange={(e) => updateHighlight(i, "label", e.target.value)} placeholder="Titre (ex : Carnet d'origine)" className={fieldClass} style={fieldStyle} />
                <input value={h.text} onChange={(e) => updateHighlight(i, "text", e.target.value)} placeholder="Détail (ex : Tampons concession 2010 → 2023)" className={fieldClass} style={fieldStyle} />
                <button type="button" onClick={() => removeHighlight(i)} title="Supprimer" className={iconBtnClass} style={{ borderColor: T.border, color: T.danger }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {HIGHLIGHT_PRESETS.filter((p) => !highlights.some((h) => h.label === p.label)).map((p) => (
            <button key={p.label} type="button" onClick={() => addHighlight(p)} className={pillClass} style={pillStyle}>+ {p.icon} {p.label}</button>
          ))}
          <button type="button" onClick={() => addHighlight()} className={pillClass} style={pillStyle}>+ Badge vierge</button>
        </div>

        {/* Interventions */}
        <p className="text-[11px] tracking-widest uppercase pt-2" style={{ color: T.muted }}>Interventions</p>
        {maintenance.length > 0 && (
          <div className="space-y-3">
            {maintenance.map((m, i) => (
              <div key={m._key} className="p-3 border" style={{ borderColor: T.border, backgroundColor: T.float }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <input value={m.date} onChange={(e) => updateMaintenance(i, "date", e.target.value)} placeholder="Date (ex : Fév. 2026)" className={fieldClass} style={fieldStyle} />
                  <input value={m.km} onChange={(e) => updateMaintenance(i, "km", e.target.value)} placeholder="Km (ex : 147 000 km)" className={fieldClass} style={fieldStyle} />
                  <input value={m.amount} onChange={(e) => updateMaintenance(i, "amount", e.target.value)} placeholder="Montant (ex : 301,89 €)" className={fieldClass} style={fieldStyle} />
                </div>
                <input value={m.operation} onChange={(e) => updateMaintenance(i, "operation", e.target.value)} placeholder="Opération (ex : Bougies neuves, service Haldex quattro…)" className={fieldClass + " mb-2"} style={fieldStyle} />
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={m.linkedDoc} onChange={(e) => updateMaintenance(i, "linkedDoc", e.target.value)} className={fieldClass + " flex-1 min-w-[12rem]"} style={fieldStyle}>
                    <option value="">Aucune facture liée</option>
                    {documents.map((d) => (
                      <option key={d.url} value={d.url}>{d.label || d.url}</option>
                    ))}
                  </select>
                  <button type="button" disabled={i === 0} onClick={() => moveMaintenance(i, -1)} title="Monter" className={iconBtnClass} style={{ borderColor: T.border, color: T.textDim }}>↑</button>
                  <button type="button" disabled={i === maintenance.length - 1} onClick={() => moveMaintenance(i, 1)} title="Descendre" className={iconBtnClass} style={{ borderColor: T.border, color: T.textDim }}>↓</button>
                  <button type="button" onClick={() => removeMaintenance(i)} title="Supprimer" className={iconBtnClass} style={{ borderColor: T.border, color: T.danger }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={addMaintenance} className={btnGhostClass} style={btnGhostStyle}>+ Ajouter une intervention</button>
      </SectionCard>

      {error && <p className="text-xs" style={{ color: T.danger }}>{error}</p>}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading || uploading > 0 || docUploading > 0}
          className={btnPrimaryClass + " px-8 py-4"}
          style={btnPrimaryStyle}
        >
          {loading ? "Enregistrement..." : uploading > 0 || docUploading > 0 ? "Envoi en cours…" : isEdit ? "Mettre à jour" : "Créer le véhicule"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/vehicules")}
          className={btnGhostClass + " px-8 py-4"}
          style={btnGhostStyle}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
