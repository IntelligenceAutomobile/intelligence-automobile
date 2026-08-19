"use client";

/* Fabrique de visuels — outil interne, éphémère.
   Une photo, deux lignes de titre, une phrase : le tout composé aux réglages
   exacts du hero des pages du site, puis téléchargé.

   L'aperçu EST le fichier de sortie : la même toile sert aux deux, réduite par
   le CSS à l'écran. Ce que Fabrice voit est donc à la lettre ce qu'il télécharge,
   là où un aperçu en HTML doublé d'un export séparé finit toujours par diverger
   d'une police ou d'un demi-pixel. */

import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Download, ImagePlus, Save, Trash2 } from "lucide-react";
import { VISUEL_PREFIX } from "@/lib/upload-rules";
import { ConfirmDialog } from "../confirm";
import { useToast } from "../toast";
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
const LARGEUR_TITRE = 0.62; // le titre respire, il coupe avant le bord
const LARGEUR_SOUS = 0.5;
const INTERLIGNE_TITRE = 0.88; // lineHeight du h1
const INTERLIGNE_SOUS = 1.8;
const BLEU = "#6B9FEE";
const BLANC = "#F0F5FF";
/* Le site pose cette phrase à 85 % d'opacité en graisse 300. Sur un écran, la
   finesse passe ; gravée dans une image que Leboncoin recompresse et réduit en
   vignette, elle se délite. Elle garde donc sa teinte, en pleine opacité et
   d'un cran plus épaisse. */
const GRIS = "#DCE8F8";

type Reglages = {
  titre1: string;
  titre2: string;
  sousTitre: string;
  format: FormatCle;
  cadrageX: number;
  cadrageY: number;
  taille: number;
  /** Corps de la seconde ligne du titre, en part de la première. */
  tailleLigne2: number;
  /** Distance entre le bas du bloc de texte et le bas de l'image, en pourcents. */
  hauteur: number;
  italique: boolean;
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

  /* ── Bloc de texte ──
     La seconde ligne se règle en part de la première : le curseur d'ensemble
     garde ainsi la main sur tout le bloc, et celui de la seconde ligne dose le
     rapport entre les deux. */
  const echelleTexte = r.taille / 100;
  const corpsTitre = w * 0.055 * echelleTexte;
  const corpsTitre2 = corpsTitre * (r.tailleLigne2 / 100);
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
  ctx.font = `${r.italique ? "italic " : ""}400 ${corpsSous}px ${famille}`;
  const lignesSous = decoupe(ctx, r.sousTitre.trim(), w * LARGEUR_SOUS);

  /* Chaque ligne du titre porte désormais son corps et sa couleur : les deux
     lignes ont des tailles distinctes, donc leur découpe comme leur hauteur se
     mesurent séparément. */
  poseInterlettrage("-0.03em");
  const lignesTitre: { texte: string; corps: number; couleur: string }[] = [];
  for (const [texte, corps, couleur] of [
    [r.titre1.trim(), corpsTitre, BLANC],
    [r.titre2.trim(), corpsTitre2, BLEU],
  ] as const) {
    if (!texte) continue;
    ctx.font = `900 ${corps}px ${famille}`;
    for (const ligne of decoupe(ctx, texte, w * LARGEUR_TITRE)) {
      lignesTitre.push({ texte: ligne, corps, couleur });
    }
  }

  const hTitre = lignesTitre.reduce((somme, l) => somme + l.corps * INTERLIGNE_TITRE, 0);
  const hSous = lignesSous.length * corpsSous * INTERLIGNE_SOUS;
  const traitH = Math.max(1, Math.round(w * 0.0008));
  // L'écart sous le titre suit la taille d'ensemble, jamais celle de la seconde
  // ligne : une ligne rapetissée rapprocherait sinon le trait du texte.
  const ecartTitreTrait = lignesTitre.length > 0 ? corpsTitre * 0.42 : 0;
  const ecartTraitSous = corpsSous * 0.6;
  const hTotal = hTitre + ecartTitreTrait + traitH + ecartTraitSous + hSous;

  let y = h - h * (r.hauteur / 100) - hTotal;

  // Titre : la seconde ligne prend le bleu de l'accent, comme sur le site.
  poseInterlettrage("-0.03em");
  lignesTitre.forEach((ligne) => {
    ctx.font = `900 ${ligne.corps}px ${famille}`;
    ctx.fillStyle = ligne.couleur;
    ctx.fillText(ligne.texte, x, y);
    y += ligne.corps * INTERLIGNE_TITRE;
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
    ctx.font = `${r.italique ? "italic " : ""}400 ${corpsSous}px ${famille}`;
    ctx.fillStyle = GRIS;
    lignesSous.forEach((ligne) => {
      ctx.fillText(ligne, x, y);
      y += corpsSous * INTERLIGNE_SOUS;
    });
  }

  poseInterlettrage("normal");
}

/* Réglages de départ, et repli d'un visuel rouvert : une fiche enregistrée
   avant l'arrivée d'un réglage repart ainsi de sa valeur normale, au lieu
   d'hériter de ce qui traînait à l'écran. */
const REGLAGES_DEFAUT: Reglages = {
  titre1: "LIVRAISON, GARANTIE,",
  titre2: "CARTE GRISE",
  sousTitre: "Une prise en charge intégrale, partout en France.",
  format: "4:3",
  cadrageX: 50,
  cadrageY: 50,
  taille: 100,
  tailleLigne2: 100,
  hauteur: 8,
  italique: true,
};

/** Une fiche de la bibliothèque, telle que la renvoie /api/admin/visuels. */
type VisuelEnregistre = {
  id: string;
  nom: string;
  imageUrl: string;
  photoUrl: string;
  largeur: number;
  hauteur: number;
  reglages: string;
  createdAt: string;
};

/** Ramène un nom de fichier propre depuis le titre saisi. */
function slug(texte: string): string {
  return (
    texte
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "visuel"
  );
}

export default function VisuelsClient({ initial }: { initial: VisuelEnregistre[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fichierRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [survol, setSurvol] = useState(false);
  const [famille, setFamille] = useState("sans-serif");

  /* Provenance de la photo affichée. Un fichier venu du disque part sur le
     stockage au premier enregistrement ; une photo déjà rangée dans la
     bibliothèque garde son adresse et évite un second envoi. */
  const [source, setSource] = useState<{ fichier: File | null; url: string }>({ fichier: null, url: "" });
  const [bibliotheque, setBibliotheque] = useState<VisuelEnregistre[]>(initial);
  const [nom, setNom] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [aSupprimer, setASupprimer] = useState<VisuelEnregistre | null>(null);
  const [renomme, setRenomme] = useState<{ id: string; valeur: string } | null>(null);
  const toast = useToast();

  const [r, setR] = useState<Reglages>(REGLAGES_DEFAUT);

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
      setSource({ fichier, url: "" });
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
      // Qualité haute : la compression s'attaque d'abord aux contours fins, et
      // c'est justement le texte qui en pâtit.
      0.95
    );
  }

  /* ── Bibliothèque ──
     La liste arrive garnie par le serveur ; elle se relit après chaque
     enregistrement, ce qui suffit à la tenir à jour. */

  const chargeBibliotheque = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/visuels");
      if (res.ok) setBibliotheque(await res.json());
    } catch {
      /* réseau absent : la liste garde son état, l'atelier fonctionne */
    }
  }, []);

  /** La toile, en fichier prêt à partir sur le stockage. */
  function toileEnFichier(nomFichier: string): Promise<File | null> {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], nomFichier, { type: "image/jpeg" }) : null),
        "image/jpeg",
        0.95
      );
    });
  }

  async function enregistre() {
    if (!image || enregistrement) return;
    setEnregistrement(true);
    try {
      const titre = nom.trim() || [r.titre1, r.titre2].filter(Boolean).join(" ").trim() || "Visuel";
      const base = slug(titre);

      const rendu = await toileEnFichier(`${base}.jpg`);
      if (!rendu) throw new Error("composition");

      // La photo d'origine ne repart que la première fois : rouvrir puis
      // réenregistrer un visuel réutilise le fichier déjà en place.
      const [blobRendu, urlPhoto] = await Promise.all([
        upload(`${VISUEL_PREFIX}${base}.jpg`, rendu, {
          access: "public",
          handleUploadUrl: "/api/upload",
        }),
        source.url
          ? Promise.resolve({ url: source.url })
          : source.fichier
            ? upload(`${VISUEL_PREFIX}source-${base}`, source.fichier, {
                access: "public",
                handleUploadUrl: "/api/upload",
              })
            : Promise.resolve({ url: "" }),
      ]);

      const res = await fetch("/api/admin/visuels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: titre,
          imageUrl: blobRendu.url,
          photoUrl: urlPhoto.url,
          largeur: canvasRef.current?.width ?? 0,
          hauteur: canvasRef.current?.height ?? 0,
          reglages: JSON.stringify(r),
        }),
      });
      if (!res.ok) throw new Error("enregistrement");

      // L'adresse retenue évite un second envoi de la photo au prochain
      // enregistrement de la même image.
      if (urlPhoto.url) setSource({ fichier: null, url: urlPhoto.url });
      setNom("");
      toast.success("Visuel enregistré dans la bibliothèque.");
      await chargeBibliotheque();
    } catch {
      toast.error("L'enregistrement a échoué.");
    } finally {
      setEnregistrement(false);
    }
  }

  /** Remet un visuel enregistré sur l'établi : sa photo et tous ses réglages. */
  function ouvre(v: VisuelEnregistre) {
    if (!v.photoUrl) {
      toast.error("Ce visuel a été enregistré avant sa photo d'origine.");
      return;
    }
    const img = new Image();
    // Sans cette mention, une photo venue du stockage souille la toile et le
    // téléchargement se refuse ensuite.
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      setSource({ fichier: null, url: v.photoUrl });
      setNom(v.nom);
      try {
        const lus = JSON.parse(v.reglages) as Partial<Reglages>;
        setR({ ...REGLAGES_DEFAUT, ...lus });
      } catch {
        /* réglages illisibles : la photo revient avec ceux de l'écran */
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    img.onerror = () => toast.error("La photo de ce visuel est introuvable.");
    img.src = v.photoUrl;
  }

  async function supprime(v: VisuelEnregistre) {
    setASupprimer(null);
    try {
      const res = await fetch(`/api/admin/visuels/${v.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBibliotheque((prec) => prec.filter((x) => x.id !== v.id));
      toast.success("Visuel supprimé.");
    } catch {
      toast.error("La suppression a échoué.");
    }
  }

  async function renomeValide() {
    if (!renomme) return;
    const valeur = renomme.valeur.trim();
    const cible = renomme.id;
    setRenomme(null);
    if (!valeur) return;
    try {
      const res = await fetch(`/api/admin/visuels/${cible}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: valeur }),
      });
      if (!res.ok) throw new Error();
      setBibliotheque((prec) => prec.map((x) => (x.id === cible ? { ...x, nom: valeur } : x)));
    } catch {
      toast.error("Le renommage a échoué.");
    }
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
            <button
              type="button"
              onClick={enregistre}
              className={btnGhostClass}
              style={btnGhostStyle}
              disabled={!image || enregistrement}
            >
              <Save size={14} />
              {enregistrement ? "Enregistrement…" : "Enregistrer"}
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
              <Curseur
                label="Taille de la 2e ligne"
                valeur={r.tailleLigne2}
                min={40}
                max={200}
                suffixe="%"
                onChange={(v) => modifie("tailleLigne2", v)}
              />
              <Curseur
                label="Hauteur du texte"
                valeur={r.hauteur}
                min={2}
                max={55}
                suffixe="%"
                onChange={(v) => modifie("hauteur", v)}
              />

              {/* L'italique du site est simulé par le navigateur : il penche les
                  lettres sans les redessiner, ce qui adoucit leurs bords. Le
                  décocher rend la phrase plus franche. */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={r.italique}
                  onChange={(e) => modifie("italique", e.target.checked)}
                  style={{ accentColor: BLEU, width: 15, height: 15 }}
                />
                <span className="text-xs tracking-widest uppercase" style={{ color: T.muted }}>
                  Phrase en italique
                </span>
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Nom de l'enregistrement">
            <input
              className={fieldClass}
              style={fieldStyle}
              placeholder="Hero transport, sunset"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
            <p className="text-xs mt-3" style={{ color: T.muted }}>
              Laissé vide, le visuel prend le titre écrit dessus.
            </p>
          </SectionCard>
        </div>
      </div>

      {/* ── Bibliothèque ── */}
      <div className="mt-10">
        <SectionCard title={`Bibliothèque${bibliotheque.length > 0 ? ` · ${bibliotheque.length}` : ""}`}>
          {bibliotheque.length === 0 ? (
            <p className="text-sm" style={{ color: T.muted }}>
              Les visuels enregistrés apparaissent ici, avec leur photo d&apos;origine et leurs
              réglages. Un clic les remet sur l&apos;établi pour les retoucher.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {bibliotheque.map((v) => (
                <div key={v.id} style={{ border: `1px solid ${T.border}`, backgroundColor: T.float }}>
                  <button
                    type="button"
                    onClick={() => ouvre(v)}
                    className="block w-full"
                    title="Remettre ce visuel sur l'établi"
                    style={{ cursor: "pointer" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.imageUrl}
                      alt={v.nom}
                      style={{
                        display: "block",
                        width: "100%",
                        aspectRatio: "4 / 3",
                        objectFit: "cover",
                        borderBottom: `1px solid ${T.border}`,
                      }}
                    />
                  </button>

                  <div className="px-3 py-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {renomme?.id === v.id ? (
                        <input
                          autoFocus
                          className="w-full text-xs px-1.5 py-1 outline-none"
                          style={{ ...fieldStyle, width: "100%" }}
                          value={renomme.valeur}
                          onChange={(e) => setRenomme({ id: v.id, valeur: e.target.value })}
                          onBlur={renomeValide}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renomeValide();
                            if (e.key === "Escape") setRenomme(null);
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRenomme({ id: v.id, valeur: v.nom })}
                          className="block text-left text-xs truncate w-full"
                          title="Renommer"
                          style={{ color: T.textDim, cursor: "text" }}
                        >
                          {v.nom}
                        </button>
                      )}
                      <span className="block text-[10px] mt-1" style={{ color: T.muted }}>
                        {v.largeur} × {v.hauteur} px
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setASupprimer(v)}
                      className="adm-act flex-shrink-0"
                      title="Supprimer ce visuel"
                      aria-label={`Supprimer ${v.nom}`}
                      style={{ color: T.muted }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <ConfirmDialog
        open={aSupprimer !== null}
        title="Supprimer ce visuel ?"
        description={`« ${aSupprimer?.nom ?? ""} » part de la bibliothèque, avec sa photo d'origine et son rendu.`}
        confirmLabel="Supprimer"
        onConfirm={() => aSupprimer && supprime(aSupprimer)}
        onCancel={() => setASupprimer(null)}
      />
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
