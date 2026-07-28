// Primitives de design partagées pour le back-office.
// Module "partagé" (pas de "use client") : importable depuis les composants
// serveur ET client. N'utilise aucun hook ni API client.
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

/* ── Jetons de couleur, alignés sur le site public ──
   L'accent passe par des variables CSS (marque blanche) : la valeur par défaut
   vit dans admin.css (.adm-root) et le thème BrandTheme la surcharge. */
export const T = {
  bg: "#070F1E",
  surface: "#112240",
  surfaceAlt: "#0A1628",
  float: "#040B16",
  border: "#1B3055",
  text: "#FFFFFF",
  textDim: "#E7EFFC",
  muted: "#9FB3D4",
  accent: "var(--adm-accent)",
  accentDark: "var(--adm-accent-dark)",
  danger: "#FF6B35",
  success: "#4ED1A1",
  warning: "#F0B45A",
} as const;

/* ── Couleurs de remplissage des graphiques (validées daltonisme sur surface sombre) ── */
export const CHART = { blue: "#4B7FD8", amber: "#C08428", green: "#2FA97D", spark: "#566B93" } as const;

/* ── Teintes translucides par tonalité (badges, tags, alertes) ── */
export const TONE = {
  accent: { bg: "var(--adm-accent-soft)", bd: "var(--adm-accent-border)", fg: T.accent },
  success: { bg: "rgba(78,209,161,0.10)", bd: "rgba(78,209,161,0.40)", fg: T.success },
  warning: { bg: "rgba(240,180,90,0.10)", bd: "rgba(240,180,90,0.38)", fg: T.warning },
  danger: { bg: "rgba(255,107,53,0.08)", bd: "rgba(255,107,53,0.35)", fg: T.danger },
  muted: { bg: "transparent", bd: T.border, fg: T.muted },
} as const;
export type Tone = keyof typeof TONE;

/* ── Champs de formulaire ── */
// `width: 100%` est repris par une trentaine d'écrans du back-office. Un champ
// qui doit rester étroit passe par `{ ...fieldStyle, width: undefined }` plutôt
// que par une classe de largeur, qui perdrait contre ce style direct.
export const fieldStyle: CSSProperties = {
  backgroundColor: T.float,
  border: `1px solid ${T.border}`,
  color: T.text,
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
};
export const fieldClass =
  "w-full px-4 py-3 text-sm outline-none focus:border-[#6B9FEE]";
export const labelClass = "block text-xs tracking-widest uppercase mb-2";

/* ── Boutons ── */
export const btnPrimaryClass =
  "inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase px-5 py-3 transition-opacity duration-200 hover:opacity-90 disabled:opacity-60";
export const btnPrimaryStyle: CSSProperties = { backgroundColor: T.accent, color: T.bg };

export const btnGhostClass =
  "inline-flex items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase px-5 py-3 border transition-colors duration-200 hover:border-[#6B9FEE] hover:text-[#F0F5FF]";
export const btnGhostStyle: CSSProperties = { borderColor: T.border, color: T.textDim };

/* ── Filet d'accent dégradé (comme l'en-tête du site) ── */
export function AccentLine() {
  return (
    <div
      style={{
        height: "1px",
        background: "linear-gradient(to right, transparent, var(--adm-accent), transparent)",
        opacity: 0.45,
      }}
    />
  );
}

/* ── Conteneur de page ── */
export function AdminPage({
  width = "wide",
  children,
}: {
  width?: "wide" | "narrow";
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto px-6 py-10 ${width === "narrow" ? "max-w-3xl" : "max-w-6xl"}`}>
      {children}
    </div>
  );
}

/* ── En-tête de page (barre d'accent + titre + action optionnelle) ── */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <div style={{ width: 24, height: 2, backgroundColor: T.accent }} className="mb-3" />
        <h1 className="text-2xl font-light" style={{ color: T.text, letterSpacing: "-0.01em" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1.5" style={{ color: T.muted }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ── Carte de section titrée (formulaires) ── */
export function SectionCard({ title, id, children }: { title?: string; id?: string; children: ReactNode }) {
  return (
    <div id={id} style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }} className="p-5 sm:p-6 space-y-5 scroll-mt-24">
      {title && (
        <p
          className="text-[11px] tracking-[0.2em] uppercase pb-4"
          style={{ color: T.accent, borderBottom: `1px solid ${T.border}` }}
        >
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/* ── Badge de statut ── */
const STATUS_MAP: Record<string, { bg: string; bd: string; fg: string; label: string }> = {
  disponible: { bg: "var(--adm-accent-soft)", bd: "var(--adm-accent-border)", fg: "var(--adm-accent)", label: "Disponible" },
  reserve: { bg: "rgba(240,180,90,0.10)", bd: "rgba(240,180,90,0.38)", fg: "#F0B45A", label: "Réservé" },
  vendu: { bg: "rgba(200,216,238,0.05)", bd: T.border, fg: T.textDim, label: "Vendu" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { bg: "transparent", bd: T.border, fg: T.textDim, label: status };
  return (
    <span
      className="inline-block text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 whitespace-nowrap"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.bd}`, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

/* ── Vignette photo ── */
export function Thumb({
  src,
  alt,
  w = 72,
  h = 54,
}: {
  src?: string | null;
  alt?: string;
  w?: number;
  h?: number;
}) {
  return (
    <div
      className="flex-shrink-0 overflow-hidden flex items-center justify-center"
      style={{ width: w, height: h, backgroundColor: T.float, border: `1px solid ${T.border}` }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} className="w-full h-full object-cover" />
      ) : (
        <span style={{ color: T.border, fontSize: 18 }}>—</span>
      )}
    </div>
  );
}

/* ── Carte de statistique (tableau de bord) ── */
export function StatCard({
  label,
  value,
  href,
  hint,
  icon,
}: {
  label: string;
  value: number | string;
  href?: string;
  hint?: string;
  icon?: ReactNode;
}) {
  const cls = "block p-6 transition-all duration-200" + (href ? " hover:-translate-y-px hover:border-[#6B9FEE]" : "");
  const style: CSSProperties = { backgroundColor: T.surface, border: `1px solid ${T.border}` };
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div style={{ width: 24, height: 2, backgroundColor: T.accent }} className="mb-4" />
        {icon ? <span style={{ color: T.muted }}>{icon}</span> : href && <span className="text-sm" style={{ color: T.muted }}>→</span>}
      </div>
      <div className="text-3xl sm:text-4xl font-light mb-1 break-words" style={{ color: T.accent }}>
        {value}
      </div>
      <div className="text-xs tracking-widest uppercase" style={{ color: T.textDim }}>
        {label}
      </div>
      {hint && (
        <div className="text-[11px] mt-1" style={{ color: T.muted }}>
          {hint}
        </div>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={cls} style={style}>
      {inner}
    </div>
  );
}

/* ── Étiquette générique par tonalité ── */
export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  const c = TONE[tone];
  return (
    <span
      className="inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 whitespace-nowrap"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.bd}`, color: c.fg }}
    >
      {children}
    </span>
  );
}

/* ── Squelettes de chargement (pages loading.tsx) ── */
export function Skeleton({ w, h = 14, className = "" }: { w?: number | string; h?: number; className?: string }) {
  return (
    <span
      className={`block animate-pulse ${className}`}
      style={{ width: w ?? "100%", height: h, backgroundColor: T.border, opacity: 0.55 }}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
      <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-4" />
      <Skeleton w={90} h={34} className="mb-2" />
      <Skeleton w={110} h={10} />
    </div>
  );
}

// `thumb` réserve la place d'une vignette : utile au stock, trompeur ailleurs.
// La liste des devis annonçait ainsi six photos qui n'arrivaient jamais.
export function SkeletonRows({ count = 5, thumb = true }: { count?: number; thumb?: boolean }) {
  return (
    <div style={{ border: `1px solid ${T.border}` }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-4"
          style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
        >
          {thumb ? <Skeleton w={64} h={48} /> : <Skeleton w={70} h={11} />}
          <div className="flex-1 space-y-2">
            <Skeleton w={180} h={12} />
            <Skeleton w={120} h={10} />
          </div>
          <Skeleton w={70} h={12} />
        </div>
      ))}
    </div>
  );
}

// Bandeau des chiffres de pilotage, en tête des listes.
export function SkeletonTiles({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="px-4 py-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <Skeleton w={110} h={9} className="mb-2" />
          <Skeleton w={130} h={22} className="mb-2" />
          <Skeleton w={80} h={9} />
        </div>
      ))}
    </div>
  );
}

/* ── Utilitaire : première image d'un véhicule (champ JSON) ── */
export function firstImage(imagesJson: string): string | null {
  try {
    const arr = JSON.parse(imagesJson);
    // Une entrée vide compte comme une photo manquante : elle passait jusqu'ici
    // pour une vraie photo au tableau de bord et pour une absence dans le stock.
    const first = Array.isArray(arr) ? arr.find((v) => typeof v === "string" && v.trim() !== "") : null;
    return typeof first === "string" ? first : null;
  } catch {
    return null;
  }
}
