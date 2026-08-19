"use client";

/* Fabrique de visuels — outil interne, éphémère.
   Une photo, deux lignes de titre, une phrase : le tout composé aux réglages
   exacts du hero des pages du site, puis téléchargé.

   L'aperçu EST le fichier de sortie : la même toile sert aux deux, réduite par
   le CSS à l'écran. Ce que Fabrice voit est donc à la lettre ce qu'il télécharge,
   là où un aperçu en HTML doublé d'un export séparé finit toujours par diverger
   d'une police ou d'un demi-pixel. */

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus } from "lucide-react";
import {
  AdminPage,
  PageHeader,
  SectionCard,
  T,
  fieldClass,
  fieldStyle,
  labelClass,
  btnPrimaryClass,
  btnPrimaryStyle,
  btnGhostClass,
  btnGhostStyle,
} from "../ui";

/* ── Formats de sortie ──
   Leboncoin affiche ses photos en 4:3 : c'est le format par défaut. Les autres
   servent aux réseaux et aux bandeaux. La largeur reste généreuse, l'image est
   recompressée par les portails et une source trop courte se voit. */
const FORMATS = [
  { cle: "4:3", label: "4:3 — Leboncoin", w: 2000, h: 1500 },
  { cle: "3:2", label: "3:2 — photo", w: 2000, h: 1333 },
  { cle: "16:9", label: "16:9 — bandeau", w: 2000, h: 1125 },
  { cle: "1:1", label: "1:1 — carré", w: 1500, h: 1500 },
] as const;

type FormatCle = (typeof FORMATS)[number]["cle"];

/* ── Réglages du hero, recopiés de src/app/transport-livraison/page.tsx ──
   Exprimés en part de la largeur pour tenir à tous les formats. Les valeurs de
   couleur et les fondus sont, eux, repris à l'identique. */
const MARGE_GAUCHE = 0.06; // 6vw
const MARGE_BAS = 0.08; // 8vh
const LARGEUR_TITRE = 0.62; // le titre respire, il coupe avant le bord
const LARGEUR_SOUS = 0.5;
const INTERLIGNE_TITRE = 0.88; // lineHeight du h1
const INTERLIGNE_SOUS = 1.8;
const BLEU = "#6B9FEE";
const BLANC = "#F0F5FF";
const GRIS = "rgba(214,228,246,0.85)";

type Reglages = {
  titre1: string;
  titre2: string;
  sousTitre: string;
  format: FormatCle;
  cadrageX: number;
  cadrageY: number;
  taille: number;
};

/** Découpe une phrase en lignes qui tiennent dans la largeur donnée. */
function decoupe(ctx: CanvasRenderingContext2D, texte: string, largeurMax: number): string[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  if (mots.length === 0) return [];
  const lignes: string[] = [];
  let courante = mots[0];
  for (const mot of mots.slice(1)) {
    const essai = `${courante} ${mot}`;
    if (ctx.measureText(essai).width <= largeurMax) courante = essai;
    else {
      lignes.push(courante);
      courante = mot;
    }
  }
  lignes.push(courante);
  return lignes;
}

/** Compose la toile : photo cadrée, fondus, puis le bloc de texte en bas à gauche. */
function compose(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  r: Reglages,
  famille: string
) {
  const format = FORMATS.find((f) => f.cle === r.format) ?? FORMATS[0];
  const { w, h } = format;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  /* ── Fond ── */
  ctx.fillStyle = "#070F1E";
  ctx.fillRect(0, 0, w, h);

  /* ── Photo, en « cover » ──
     La photo remplit le cadre et déborde du côté le plus long ; les deux
     curseurs de cadrage disent quelle part du débordement est rognée. */
  if (image) {
    const echelle = Math.max(w / image.width, h / image.height);
    const pw = image.width * echelle;
    const ph = image.height * echelle;
    ctx.drawImage(image, (w - pw) * (r.cadrageX / 100), (h - ph) * (r.cadrageY / 100), pw, ph);
  }

  /* ── Fondu haut : assombrit le ciel, comme sous le logo du site ── */
  const hautH = h * 0.26;
  const haut = ctx.createLinearGradient(0, 0, 0, hautH);
  haut.addColorStop(0, "rgba(7,15,30,0.85)");
  haut.addColorStop(1, "rgba(7,15,30,0)");
  ctx.fillStyle = haut;
  ctx.fillRect(0, 0, w, hautH);

  /* ── Fondu bas : c'est lui qui rend le titre lisible ── */
  const basY = h * 0.38;
  const bas = ctx.createLinearGradient(0, h, 0, basY);
  bas.addColorStop(0, "#070F1E");
  bas.addColorStop(0.32, "rgba(7,15,30,0.78)");
  bas.addColorStop(1, "rgba(7,15,30,0)");
  ctx.fillStyle = bas;
  ctx.fillRect(0, basY, w, h - basY);

  /* ── Bloc de texte ── */
  const echelleTexte = r.taille / 100;
  const corpsTitre = w * 0.055 * echelleTexte;
  const corpsSous = w * 0.021 * echelleTexte;
  const x = w * MARGE_GAUCHE;

  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  // Le resserrement du titre fait partie de l'identité ; les navigateurs qui
  // l'ignorent rendent un titre à peine plus large, ce qui reste acceptable.
  const poseInterlettrage = (valeur: string) => {
    try {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = valeur;
    } catch {
      /* propriété absente : le rendu se fait sans resserrement */
    }
  };

  // Mesure d'abord, dessine ensuite : le bloc est calé sur sa base, donc sa
  // hauteur totale doit être connue avant le premier trait d'encre.
  poseInterlettrage("0.01em");
  ctx.font = `italic 300 ${corpsSous}px ${famille}`;
  const lignesSous = decoupe(ctx, r.sousTitre.trim(), w * LARGEUR_SOUS);

  poseInterlettrage("-0.03em");
  ctx.font = `900 ${corpsTitre}px ${famille}`;
  const lignesTitre = [r.titre1, r.titre2]
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((l) => decoupe(ctx, l, w * LARGEUR_TITRE));

  const hTitre = lignesTitre.length * corpsTitre * INTERLIGNE_TITRE;
  const hSous = lignesSous.length * corpsSous * INTERLIGNE_SOUS;
  const traitH = Math.max(1, Math.round(w * 0.0008));
  const ecartTitreTrait = lignesTitre.length > 0 ? corpsTitre * 0.42 : 0;
  const ecartTraitSous = corpsSous * 0.6;
  const hTotal = hTitre + ecartTitreTrait + traitH + ecartTraitSous + hSous;

  let y = h - h * MARGE_BAS - hTotal;

  // Titre : la seconde ligne prend le bleu de l'accent, comme sur le site.
  poseInterlettrage("-0.03em");
  ctx.font = `900 ${corpsTitre}px ${famille}`;
  const indexBleu = r.titre1.trim() ? 1 : 0;
  lignesTitre.forEach((ligne, i) => {
    ctx.fillStyle = i >= indexBleu ? BLEU : BLANC;
    ctx.fillText(ligne, x, y);
    y += corpsTitre * INTERLIGNE_TITRE;
  });

  // Le petit trait bleu qui sépare le titre de la phrase.
  if (lignesSous.length > 0) {
    y += ecartTitreTrait;
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = BLEU;
    ctx.fillRect(x, y, w * 0.018, traitH);
    ctx.globalAlpha = 1;
    y += traitH + ecartTraitSous;

    poseInterlettrage("0.01em");
    ctx.font = `italic 300 ${corpsSous}px ${famille}`;
    ctx.fillStyle = GRIS;
    lignesSous.forEach((ligne) => {
      ctx.fillText(ligne, x, y);
      y += corpsSous * INTERLIGNE_SOUS;
    });
  }

  poseInterlettrage("normal");
}

export default function VisuelsClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fichierRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [survol, setSurvol] = useState(false);
  const [famille, setFamille] = useState("sans-serif");

  const [r, setR] = useState<Reglages>({
    titre1: "LIVRAISON, GARANTIE,",
    titre2: "CARTE GRISE",
    sousTitre: "Une prise en charge intégrale, partout en France.",
    format: "4:3",
    cadrageX: 50,
    cadrageY: 50,
    taille: 100,
  });

  const modifie = <K extends keyof Reglages>(cle: K, valeur: Reglages[K]) =>
    setR((prec) => ({ ...prec, [cle]: valeur }));

  /* La police du site est chargée par Next sous un nom généré : le lire sur la
     page est le seul moyen sûr de composer la toile avec la même. La lecture
     attend que les polices soient posées, sinon la toile se dessine avec la
     police de secours du navigateur. */
  useEffect(() => {
    let vivant = true;
    document.fonts.ready.then(() => {
      if (vivant) setFamille(getComputedStyle(document.body).fontFamily || "sans-serif");
    });
    return () => {
      vivant = false;
    };
  }, []);

  /* Charge un fichier venu du sélecteur, du glisser-déposer ou du presse-papier.
     L'image vit dans le navigateur du début à la fin : rien ne part au serveur,
     il reste donc rien à ranger ni à effacer ensuite. */
  const charge = useCallback((fichier: File | null | undefined) => {
    if (!fichier || !fichier.type.startsWith("image/")) return;
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, []);

  // Coller une capture directement sur la page évite le détour par le disque.
  useEffect(() => {
    const surColle = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (item) charge(item.getAsFile());
    };
    window.addEventListener("paste", surColle);
    return () => window.removeEventListener("paste", surColle);
  }, [charge]);

  // Toute modification recompose la toile entière : à ces dimensions le rendu
  // se compte en millisecondes, et l'aperçu reste ainsi toujours juste.
  useEffect(() => {
    if (canvasRef.current) compose(canvasRef.current, image, r, famille);
  }, [image, r, famille]);

  function telecharge(type: "image/jpeg" | "image/png") {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const nom =
      [r.titre1, r.titre2]
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "visuel";
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${nom}.${type === "image/png" ? "png" : "jpg"}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      type,
      0.92
    );
  }

  const format = FORMATS.find((f) => f.cle === r.format) ?? FORMATS[0];

  return (
    <AdminPage>
      <PageHeader
        title="Visuels"
        subtitle="Une photo, un titre, une phrase : le rendu reprend les réglages du hero du site."
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => telecharge("image/jpeg")}
              className={btnPrimaryClass}
              style={btnPrimaryStyle}
              disabled={!image}
            >
              <Download size={14} />
              Télécharger le JPG
            </button>
            <button
              type="button"
              onClick={() => telecharge("image/png")}
              className={btnGhostClass}
              style={btnGhostStyle}
              disabled={!image}
            >
              PNG
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── Aperçu, qui est aussi le fichier de sortie ── */}
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(true);
            }}
            onDragLeave={() => setSurvol(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSurvol(false);
              charge(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fichierRef.current?.click()}
            className="relative cursor-pointer"
            style={{
              border: `1px solid ${survol ? T.accent : T.border}`,
              backgroundColor: T.float,
              transition: "border-color 0.2s",
            }}
          >
            <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />

            {!image && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6"
                style={{ color: T.muted }}
              >
                <ImagePlus size={30} style={{ color: T.accent }} />
                <span className="text-sm" style={{ color: T.textDim }}>
                  Glissez une photo ici, ou cliquez pour la choisir
                </span>
                <span className="text-xs">Un Ctrl+V colle aussi une image du presse-papier</span>
              </div>
            )}
          </div>

          <input
            ref={fichierRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => charge(e.target.files?.[0])}
          />

          <p className="text-xs mt-3" style={{ color: T.muted }}>
            Sortie : {format.w} × {format.h} px. L&apos;aperçu ci-dessus est le fichier lui-même,
            réduit à la taille de l&apos;écran.
          </p>
        </div>

        {/* ── Réglages ── */}
        <div className="space-y-6">
          <SectionCard title="Texte">
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ color: T.muted }}>
                  Titre, première ligne
                </label>
                <input
                  className={fieldClass}
                  style={fieldStyle}
                  value={r.titre1}
                  onChange={(e) => modifie("titre1", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: T.muted }}>
                  Titre, seconde ligne <span style={{ color: BLEU }}>(en bleu)</span>
                </label>
                <input
                  className={fieldClass}
                  style={fieldStyle}
                  value={r.titre2}
                  onChange={(e) => modifie("titre2", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: T.muted }}>
                  Phrase du dessous
                </label>
                <textarea
                  className={fieldClass}
                  style={{ ...fieldStyle, resize: "vertical" }}
                  rows={3}
                  value={r.sousTitre}
                  onChange={(e) => modifie("sousTitre", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Cadre">
            <div className="space-y-5">
              <div>
                <label className={labelClass} style={{ color: T.muted }}>
                  Format
                </label>
                <select
                  className={fieldClass}
                  style={fieldStyle}
                  value={r.format}
                  onChange={(e) => modifie("format", e.target.value as FormatCle)}
                >
                  {FORMATS.map((f) => (
                    <option key={f.cle} value={f.cle} style={{ backgroundColor: T.float }}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <Curseur
                label="Cadrage horizontal"
                valeur={r.cadrageX}
                min={0}
                max={100}
                suffixe="%"
                onChange={(v) => modifie("cadrageX", v)}
              />
              <Curseur
                label="Cadrage vertical"
                valeur={r.cadrageY}
                min={0}
                max={100}
                suffixe="%"
                onChange={(v) => modifie("cadrageY", v)}
              />
              <Curseur
                label="Taille du texte"
                valeur={r.taille}
                min={60}
                max={170}
                suffixe="%"
                onChange={(v) => modifie("taille", v)}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminPage>
  );
}

/** Curseur de réglage, avec sa valeur lue à droite du libellé. */
function Curseur({
  label,
  valeur,
  min,
  max,
  suffixe,
  onChange,
}: {
  label: string;
  valeur: number;
  min: number;
  max: number;
  suffixe: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs tracking-widest uppercase" style={{ color: T.muted }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: T.textDim, fontVariantNumeric: "tabular-nums" }}>
          {valeur}
          {suffixe}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: BLEU }}
      />
    </div>
  );
}
