"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { formatNumber } from "@/lib/format";
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
import { useLocale } from "@/i18n/context";
import VehiculeDetailView, { buildPresentation, type VehiculeDetailModel } from "@/app/vehicules/[id]/VehiculeDetailView";
import { SALE_REGIME_DEFAULT, SALE_REGIME_OPTIONS } from "@/lib/sale-regime";

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
  saleRegime?: string;
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

// France + ses pays frontaliers. « Autre » ouvre un champ texte libre.
const ORIGIN_OPTIONS = [
  "France",
  "Belgique",
  "Luxembourg",
  "Allemagne",
  "Suisse",
  "Italie",
  "Monaco",
  "Espagne",
  "Andorre",
];
const ORIGIN_DEFAULT = "Allemagne";
const ORIGIN_OTHER = "Autre";

// Année : scroller des années récentes ; « Autre » (en tête de liste) ouvre une saisie libre.
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OTHER = "Autre";
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => String(CURRENT_YEAR - i));

const SECTIONS = [
  { id: "sec-identite", label: "Identité" },
  { id: "sec-presentation", label: "Présentation" },
  { id: "sec-etat", label: "État" },
  { id: "sec-equipements", label: "Équipements" },
  { id: "sec-photos", label: "Photos" },
  { id: "sec-documents", label: "Documents" },
  { id: "sec-entretien", label: "Entretien" },
];

function prettyLabelFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/^[0-9a-f-]{8,}-/i, "");
  const spaced = base.replace(/[-_]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Identifiant robuste. crypto.randomUUID() n'existe qu'en contexte sécurisé
// (HTTPS / localhost) ; en test mobile via IP LAN (http://192.168.x.x) il est
// absent et lèverait une exception qui casserait l'hydratation du formulaire et
// les uploads. Ces ID ne servent que de clés React et de préfixes de fichiers,
// donc un repli simple suffit.
function safeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* contexte non sécurisé : repli ci-dessous */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Formats des pièces jointes ──
const DOC_IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "tiff", "tif", "bmp", "avif"];
// Accepté à l'upload : images + PDF + bureautique (cohérent avec /api/upload).
const DOC_ALLOWED_EXTS = [...DOC_IMAGE_EXTS, "pdf", "doc", "docx", "xls", "xlsx"];
const DOC_ACCEPT = "image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx";

function fileExt(nameOrUrl: string) {
  const clean = nameOrUrl.split(/[?#]/)[0];
  const base = clean.substring(clean.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
}
function isAllowedDoc(file: File) {
  return file.type.startsWith("image/") || DOC_ALLOWED_EXTS.includes(fileExt(file.name));
}
function isImageDoc(url: string) {
  return DOC_IMAGE_EXTS.includes(fileExt(url));
}

const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");
const fmtNum = (s: string) => {
  const d = onlyDigits(s);
  return d ? formatNumber(Number(d)) : "";
};

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
  const { t } = useLocale();
  const [showPreview, setShowPreview] = useState(false);
  const [previewModel, setPreviewModel] = useState<VehiculeDetailModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isPublished, setIsPublished] = useState(data?.isPublished !== false);

  // Origine : select contrôlé + champ libre quand « Autre » est choisi.
  // Si l'origine enregistrée n'est pas dans la liste, on bascule sur « Autre » pré-rempli.
  const initialOrigin = data?.origin ?? ORIGIN_DEFAULT;
  const initialOriginKnown = ORIGIN_OPTIONS.includes(initialOrigin);
  const [originChoice, setOriginChoice] = useState(initialOriginKnown ? initialOrigin : ORIGIN_OTHER);
  const [originCustom, setOriginCustom] = useState(initialOriginKnown ? "" : initialOrigin);
  const originValue = originChoice === ORIGIN_OTHER ? originCustom.trim() : originChoice;

  // Réhydrate le state depuis une valeur brute (restauration de brouillon).
  function applyOrigin(value: string) {
    const v = value || ORIGIN_DEFAULT;
    if (ORIGIN_OPTIONS.includes(v)) {
      setOriginChoice(v);
      setOriginCustom("");
    } else {
      setOriginChoice(ORIGIN_OTHER);
      setOriginCustom(v);
    }
  }

  // Année : select (scroller) + champ libre quand « Autre » est choisi (« Autre » en tête).
  // Si l'année enregistrée n'est pas dans la liste, on bascule sur « Autre » pré-rempli.
  const initialYearStr = data?.year != null ? String(data.year) : "";
  const initialYearKnown = initialYearStr !== "" && YEAR_OPTIONS.includes(initialYearStr);
  const [yearChoice, setYearChoice] = useState(initialYearKnown ? initialYearStr : YEAR_OTHER);
  const [yearCustom, setYearCustom] = useState(initialYearKnown ? "" : initialYearStr);
  const yearValue = yearChoice === YEAR_OTHER ? yearCustom.trim() : yearChoice;

  // Réhydrate l'année depuis une valeur brute (restauration de brouillon).
  function applyYear(value: string) {
    const v = value ? String(value) : "";
    if (v !== "" && YEAR_OPTIONS.includes(v)) {
      setYearChoice(v);
      setYearCustom("");
    } else {
      setYearChoice(YEAR_OTHER);
      setYearCustom(v);
    }
  }

  const [priceStr, setPriceStr] = useState(data?.price != null ? formatNumber(data.price) : "");
  const [kmStr, setKmStr] = useState(data?.mileage != null ? formatNumber(data.mileage) : "");

  const [features, setFeatures] = useState<string[]>(data?.features ?? []);
  const [newFeature, setNewFeature] = useState("");

  const [conditionFacts, setConditionFacts] = useState<string[]>(data?.conditionFacts ?? []);
  const [newCondition, setNewCondition] = useState("");

  const [maintenance, setMaintenance] = useState<MaintRow[]>(() =>
    (data?.maintenanceHistory ?? []).map((m) => ({ ...m, _key: safeId() }))
  );
  const [highlights, setHighlights] = useState<HighlightRow[]>(() =>
    (data?.maintenanceHighlights ?? []).map((h) => ({ ...h, _key: safeId() }))
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

  // Navigation / suivi des modifications
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [nativeRev, setNativeRev] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const mountedRef = useRef(false);
  const initialDraftRef = useRef("");
  const savingRef = useRef(false);
  const restoredRef = useRef<Record<string, unknown> | null>(null);
  const caretRef = useRef<{ el: HTMLInputElement; pos: number } | null>(null);

  const isEdit = !!data?.id;
  const draftKey = `ia_veh_draft_${data?.id ?? "new"}`;

  function buildDraft() {
    const f = formRef.current;
    const fd = f ? new FormData(f) : null;
    const g = (n: string) => (fd ? String(fd.get(n) ?? "") : "");
    return {
      make: g("make"), model: g("model"), year: g("year"), color: g("color"),
      fuel: g("fuel"), transmission: g("transmission"), power: g("power"),
      origin: g("origin"), status: g("status"), saleRegime: g("saleRegime"), description: g("description"),
      priceStr, kmStr, isPublished, features, conditionFacts, images, documents,
      maintenance: maintenance.map(({ _key, ...m }) => m),
      highlights: highlights.map(({ _key, ...h }) => h),
    };
  }

  // Modèle de la fiche v2 à partir de l'état courant (aperçu, sans sauvegarde).
  // Les couleurs des badges sont attribuées en cycle, comme sur la vraie page.
  function buildPreviewModel(): VehiculeDetailModel {
    const f = formRef.current;
    const fd = f ? new FormData(f) : null;
    const g = (n: string) => (fd ? String(fd.get(n) ?? "") : "");
    const { descParagraphs, etatFacts } = buildPresentation(g("description"), conditionFacts);
    const HL_COLORS = ["#6B9FEE", "#C6CCD6", "#5BD89A"];
    return {
      make: g("make"),
      model: g("model"),
      year: Number(g("year")) || 0,
      mileage: Number(onlyDigits(kmStr) || "0"),
      price: Number(onlyDigits(priceStr) || "0"),
      power: g("power") ? Number(g("power")) : null,
      color: g("color"),
      transmission: g("transmission") || "Automatique",
      fuel: g("fuel") || "Diesel",
      origin: g("origin") || "Allemagne",
      status: g("status") || "disponible",
      saleRegime: g("saleRegime") || SALE_REGIME_DEFAULT,
      descParagraphs,
      etatFacts,
      features,
      maintenance: maintenance
        .filter((m) => m.operation.trim() || m.date.trim() || m.km.trim() || m.amount.trim() || m.linkedDoc)
        .map(({ _key, ...m }) => m),
      documents,
      highlights: highlights
        .filter((h) => h.label.trim() || h.text.trim())
        .map((h, i) => ({ icon: h.icon, label: h.label, text: h.text, color: HL_COLORS[i % HL_COLORS.length] })),
      images,
    };
  }

  function openPreview() {
    setPreviewModel(buildPreviewModel());
    setShowPreview(true);
  }

  // Surveillance du défilement → section active
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Brouillon existant ?
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        restoredRef.current = JSON.parse(raw);
        setDraftAvailable(true);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marquage « modifié » + sauvegarde du brouillon
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      initialDraftRef.current = JSON.stringify(buildDraft());
      return;
    }
    setDirty(true);
    try {
      const d = JSON.stringify(buildDraft());
      if (d !== initialDraftRef.current) localStorage.setItem(draftKey, d);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features, conditionFacts, images, documents, maintenance, highlights, isPublished, priceStr, kmStr, nativeRev]);

  // Avertissement avant fermeture si modifs non enregistrées
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty && !savingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Restaure la position du curseur après reformatage des champs numériques (évite le saut en fin de champ)
  useLayoutEffect(() => {
    const c = caretRef.current;
    if (c) {
      c.el.setSelectionRange(c.pos, c.pos);
      caretRef.current = null;
    }
  });

  function handleNumChange(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
    const el = e.target;
    const selStart = el.selectionStart ?? el.value.length;
    const digitsLeft = onlyDigits(el.value.slice(0, selStart)).length;
    const formatted = fmtNum(el.value);
    let pos = formatted.length;
    if (digitsLeft === 0) {
      pos = 0;
    } else {
      let seen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          seen++;
          if (seen === digitsLeft) {
            pos = i + 1;
            break;
          }
        }
      }
    }
    caretRef.current = { el, pos };
    setter(formatted);
  }

  function applyRestore() {
    const d = restoredRef.current as Record<string, unknown> | null;
    if (!d) return;
    setPriceStr((d.priceStr as string) ?? "");
    setKmStr((d.kmStr as string) ?? "");
    setIsPublished(d.isPublished !== false);
    setFeatures((d.features as string[]) ?? []);
    setConditionFacts((d.conditionFacts as string[]) ?? []);
    setImages((d.images as string[]) ?? []);
    setDocuments((d.documents as DocItem[]) ?? []);
    setMaintenance(((d.maintenance as MaintEntry[]) ?? []).map((m) => ({ ...m, _key: safeId() })));
    setHighlights(((d.highlights as Highlight[]) ?? []).map((h) => ({ ...h, _key: safeId() })));
    const f = formRef.current;
    if (f) {
      const set = (n: string, v: unknown) => {
        const el = f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
        if (el) el.value = (v as string) ?? "";
      };
      set("make", d.make); set("model", d.model); set("color", d.color);
      set("fuel", d.fuel); set("transmission", d.transmission); set("power", d.power);
      set("status", d.status); set("saleRegime", d.saleRegime); set("description", d.description);
    }
    applyYear(d.year != null ? String(d.year) : "");
    applyOrigin((d.origin as string) ?? "");
    setDraftAvailable(false);
  }
  function ignoreRestore() {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    restoredRef.current = null;
    setDraftAvailable(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);

    const body = {
      make: fd.get("make"),
      model: fd.get("model"),
      year: fd.get("year"),
      mileage: Number(onlyDigits(kmStr) || "0"),
      price: Number(onlyDigits(priceStr) || "0"),
      color: fd.get("color"),
      transmission: fd.get("transmission"),
      fuel: fd.get("fuel"),
      power: fd.get("power") || null,
      origin: fd.get("origin"),
      description: fd.get("description"),
      status: fd.get("status"),
      saleRegime: fd.get("saleRegime"),
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
      savingRef.current = true;
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      setDirty(false);
      setSaved(true);
      router.push("/admin/vehicules");
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Erreur");
      setLoading(false);
    }
  }

  function handleCancel() {
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Quitter quand même ?")) return;
    savingRef.current = true;
    router.push("/admin/vehicules");
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
          const blob = await upload(`vehicules/${safeId()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          setImages((prev) => [...prev, blob.url]);
        } catch (e) {
          setUploadError(`Envoi impossible${e instanceof Error ? ` : ${e.message}` : ""}. Réessayez.`);
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
    const list = Array.from(files).filter(isAllowedDoc);
    if (docInputRef.current) docInputRef.current.value = "";
    if (list.length === 0) return;

    setDocUploadError("");
    setDocUploading((n) => n + list.length);

    await Promise.all(
      list.map(async (file) => {
        try {
          const blob = await upload(`documents/${safeId()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          setDocuments((prev) => [...prev, { url: blob.url, label: prettyLabelFromFilename(file.name) }]);
        } catch (e) {
          setDocUploadError(`Envoi impossible${e instanceof Error ? ` : ${e.message}` : ""}. Réessayez.`);
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
    setMaintenance((prev) => [...prev, { date: "", km: "", operation: "", amount: "", linkedDoc: "", _key: safeId() }]);
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
      preset ? { ...preset, _key: safeId() } : { icon: "✓", label: "", text: "", _key: safeId() },
    ]);
  }
  function updateHighlight(index: number, field: keyof Highlight, value: string) {
    setHighlights((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  }
  function removeHighlight(index: number) {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  }

  const navItems = [
    { id: "sec-identite", label: "Identité", count: 0 },
    { id: "sec-presentation", label: "Présentation", count: 0 },
    { id: "sec-etat", label: "État", count: conditionFacts.length },
    { id: "sec-equipements", label: "Équipements", count: features.length },
    { id: "sec-photos", label: "Photos", count: images.length },
    { id: "sec-documents", label: "Documents", count: documents.length },
    { id: "sec-entretien", label: "Entretien", count: maintenance.length },
  ];

  return (
    <div className="lg:grid lg:gap-10 lg:items-start lg:justify-center lg:grid-cols-[160px_minmax(0,720px)]">
      {/* Sommaire collant — desktop */}
      <aside className="hidden lg:block">
        <nav className="sticky space-y-0.5" style={{ top: 96 }}>
          {navItems.map((it) => {
            const active = activeSection === it.id;
            return (
              <a
                key={it.id}
                href={`#${it.id}`}
                className="flex items-center justify-between px-3 py-2 text-[11px] tracking-widest uppercase transition-colors"
                style={{ color: active ? T.text : T.muted, borderLeft: `2px solid ${active ? T.accent : "transparent"}` }}
              >
                <span>{it.label}</span>
                {it.count > 0 && <span style={{ color: active ? T.accent : T.border }}>{it.count}</span>}
              </a>
            );
          })}
        </nav>
      </aside>

      <div>
        {/* Bandeau brouillon */}
        {draftAvailable && (
          <div className="flex flex-wrap items-center gap-3 mb-5 px-4 py-3" style={{ backgroundColor: "rgba(107,159,238,0.08)", border: `1px solid ${T.accent}` }}>
            <span className="text-sm" style={{ color: T.textDim }}>
              Un brouillon non enregistré a été retrouvé.
            </span>
            <div className="flex gap-3 ml-auto">
              <button type="button" onClick={applyRestore} className="text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
                Restaurer
              </button>
              <button type="button" onClick={ignoreRestore} className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>
                Ignorer
              </button>
            </div>
          </div>
        )}

        {/* Sommaire — mobile (puces horizontales) */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-1">
          {navItems.map((it) => {
            const active = activeSection === it.id;
            return (
              <a
                key={it.id}
                href={`#${it.id}`}
                className="whitespace-nowrap text-[11px] tracking-widest uppercase px-3 py-1.5 border transition-colors"
                style={{ borderColor: active ? T.accent : T.border, color: active ? T.text : T.textDim, backgroundColor: active ? "rgba(107,159,238,0.10)" : "transparent" }}
              >
                {it.label}{it.count > 0 ? ` (${it.count})` : ""}
              </a>
            );
          })}
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onInput={() => setNativeRev((r) => r + 1)}
          onChange={() => setNativeRev((r) => r + 1)}
          className="space-y-5"
        >
          {/* ── IDENTITÉ & CARACTÉRISTIQUES ── */}
          <SectionCard id="sec-identite" title="Identité & caractéristiques">
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
                {/* Valeur réellement soumise (année choisie, ou saisie libre si « Autre »). */}
                <input type="hidden" name="year" value={yearValue} />
                <select
                  value={yearChoice}
                  onChange={(e) => setYearChoice(e.target.value)}
                  className={fieldClass}
                  style={fieldStyle}
                >
                  <option value={YEAR_OTHER}>Autre…</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {yearChoice === YEAR_OTHER && (
                  <input
                    type="number"
                    required
                    value={yearCustom}
                    onChange={(e) => setYearCustom(e.target.value)}
                    placeholder="Saisir l'année (ex : 2014)"
                    className={fieldClass + " mt-2"}
                    style={fieldStyle}
                  />
                )}
              </div>
              <div>
                <label className={labelClass} style={{ color: T.textDim }}>Kilométrage *</label>
                <div className="relative">
                  <input name="mileage" required inputMode="numeric" value={kmStr} onChange={(e) => handleNumChange(e, setKmStr)} placeholder="147 000" className={fieldClass + " pr-10"} style={fieldStyle} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: T.muted }}>km</span>
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: T.textDim }}>Prix *</label>
                <div className="relative">
                  <input name="price" required inputMode="numeric" value={priceStr} onChange={(e) => handleNumChange(e, setPriceStr)} placeholder="18 990" className={fieldClass + " pr-10"} style={fieldStyle} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: T.muted }}>€</span>
                </div>
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
                <label className={labelClass} style={{ color: T.textDim }}>Puissance</label>
                <div className="relative">
                  <input name="power" type="number" defaultValue={data?.power ?? ""} placeholder="230" className={fieldClass + " pr-10"} style={fieldStyle} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: T.muted }}>ch</span>
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: T.textDim }}>Origine</label>
                {/* Valeur réellement soumise (pays choisi, ou texte libre si « Autre »). */}
                <input type="hidden" name="origin" value={originValue} />
                <select
                  value={originChoice}
                  onChange={(e) => setOriginChoice(e.target.value)}
                  className={fieldClass}
                  style={fieldStyle}
                >
                  {ORIGIN_OPTIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                  <option value={ORIGIN_OTHER}>Autre…</option>
                </select>
                {originChoice === ORIGIN_OTHER && (
                  <input
                    value={originCustom}
                    onChange={(e) => setOriginCustom(e.target.value)}
                    placeholder="Saisir le pays"
                    className={fieldClass + " mt-2"}
                    style={fieldStyle}
                  />
                )}
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
                {/* Régime de vente : à qui appartient le véhicule. Mention légale
                    reprise telle quelle sur la fiche publique, sous le prix. */}
                <label className={labelClass} style={{ color: T.textDim }}>Régime de vente</label>
                <select name="saleRegime" defaultValue={data?.saleRegime ?? SALE_REGIME_DEFAULT} className={fieldClass} style={fieldStyle}>
                  {SALE_REGIME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
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
          <SectionCard id="sec-presentation" title="Présentation">
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
          <SectionCard id="sec-etat" title={`État du véhicule${conditionFacts.length > 0 ? ` (${conditionFacts.length})` : ""}`}>
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
          <SectionCard id="sec-equipements" title={`Équipements & points forts${features.length > 0 ? ` (${features.length})` : ""}`}>
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
          <SectionCard id="sec-photos" title={`Photos${images.length > 0 ? ` (${images.length})` : ""}`}>
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
          <SectionCard id="sec-documents" title={`Documents${documents.length > 0 ? ` (${documents.length})` : ""}`}>
            <Hint>Factures, contrôle technique, carte grise, carnet… Protégés par mot de passe côté client. Nommez chaque document pour le lier à une intervention ci-dessous.</Hint>
            <input ref={docInputRef} type="file" accept={DOC_ACCEPT} multiple className="hidden" onChange={(e) => handleDocFiles(e.target.files)} />
            <div
              role="button"
              tabIndex={0}
              onClick={() => docInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); docInputRef.current?.click(); } }}
              className="flex flex-col items-center gap-2 py-6 px-4 text-center cursor-pointer"
              style={{ border: `1px dashed ${T.border}`, backgroundColor: T.float }}
            >
              <span style={{ color: T.accent, fontSize: "20px", lineHeight: 1 }}>📄</span>
              <span className="text-sm" style={{ color: T.textDim }}>Ajouter des documents (PDF, scans ou photos)</span>
              <span className="text-[11px]" style={{ color: T.muted }}>PDF, JPG, PNG, HEIC, Word, Excel… (25 Mo max)</span>
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
                    {isImageDoc(d.url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.url} alt={d.label} className="w-14 h-14 object-cover flex-shrink-0" style={{ border: `1px solid ${T.border}` }} />
                    ) : (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ouvrir le document"
                        className="w-14 h-14 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ border: `1px solid ${T.border}`, backgroundColor: T.float, color: T.accent }}
                      >
                        <span style={{ fontSize: "16px", lineHeight: 1 }}>📄</span>
                        {fileExt(d.url) || "fichier"}
                      </a>
                    )}
                    <input value={d.label} onChange={(e) => updateDocLabel(i, e.target.value)} placeholder="Nom du document" className={fieldClass + " flex-1"} style={fieldStyle} />
                    <button type="button" onClick={() => removeDoc(i)} title="Supprimer" className={iconBtnClass} style={{ borderColor: T.border, color: T.danger }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── HISTORIQUE D'ENTRETIEN ── */}
          <SectionCard id="sec-entretien" title={`Historique d'entretien${maintenance.length > 0 ? ` (${maintenance.length})` : ""}`}>
            <Hint>Une ligne par intervention, de la plus récente à la plus ancienne. Liez une facture (ajoutée ci-dessus) pour la rendre cliquable côté client.</Hint>

            {/* Badges de traçabilité */}
            <p className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>Badges de traçabilité (en-tête de section)</p>
            {highlights.length > 0 && (
              <div className="space-y-2">
                {highlights.map((h, i) => (
                  <div key={h._key} className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_2fr_auto] gap-2 items-center">
                    <input value={h.icon} onChange={(e) => updateHighlight(i, "icon", e.target.value)} placeholder="✓" className={fieldClass + " text-center px-1"} style={fieldStyle} />
                    <input value={h.label} onChange={(e) => updateHighlight(i, "label", e.target.value)} placeholder="Titre (ex : Carnet d'origine)" className={fieldClass} style={fieldStyle} />
                    <input value={h.text} onChange={(e) => updateHighlight(i, "text", e.target.value)} placeholder="Détail (ex : Tampons concession 2010 → 2023)" className={fieldClass + " col-span-3 sm:col-span-1 order-last sm:order-none"} style={fieldStyle} />
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

          {/* Barre d'enregistrement collante */}
          <div
            className="sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center gap-3 py-4"
            style={{ backgroundColor: "rgba(7,15,30,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderTop: `1px solid ${T.border}` }}
          >
            <span className="text-[11px]" style={{ color: saved ? "#5BD89A" : dirty ? T.muted : T.border }}>
              {saved ? "Enregistré ✓" : dirty ? "Modifications non enregistrées" : "Aucune modification"}
            </span>
            <div className="flex gap-3 sm:ml-auto">
              <button
                type="button"
                onClick={openPreview}
                className={btnGhostClass + " px-6 py-3"}
                style={btnGhostStyle}
              >
                👁 Aperçu
              </button>
              <button
                type="submit"
                disabled={loading || uploading > 0 || docUploading > 0}
                className={btnPrimaryClass + " px-8 py-3"}
                style={btnPrimaryStyle}
              >
                {loading ? "Enregistrement..." : uploading > 0 || docUploading > 0 ? "Envoi en cours…" : isEdit ? "Mettre à jour" : "Créer le véhicule"}
              </button>
              <button type="button" onClick={handleCancel} className={btnGhostClass + " px-8 py-3"} style={btnGhostStyle}>
                Annuler
              </button>
            </div>
          </div>
        </form>
      </div>

      {showPreview && previewModel && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto"
          style={{ backgroundColor: "#070F1E" }}
          onClickCapture={(e) => {
            // Aperçu : neutralise toute navigation (liens contact, retour stock, galerie…)
            const a = (e.target as HTMLElement).closest("a");
            if (a) e.preventDefault();
          }}
        >
          <div
            className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3"
            style={{ backgroundColor: "rgba(7,15,30,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: `1px solid ${T.border}` }}
          >
            <span className="text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
              Aperçu de la fiche — non enregistré
            </span>
            <button type="button" onClick={() => setShowPreview(false)} className={btnPrimaryClass + " px-6 py-2.5"} style={btnPrimaryStyle}>
              Fermer l&apos;aperçu
            </button>
          </div>
          <VehiculeDetailView model={previewModel} t={t} isPreview />
        </div>
      )}
    </div>
  );
}
