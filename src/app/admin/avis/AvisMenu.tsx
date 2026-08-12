"use client";

// Menu d'actions d'une ligne d'avis : ce qui se fait sans envoyer de message.
// Un élément peut demander un motif court, saisi dans le menu lui-même, ce qui
// évite un second dialogue pour deux mots.
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { T } from "../ui";

export type AvisMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Invite de saisie du motif. Absente, l'action part au clic. */
  ask?: string;
  tone?: "muted" | "warning" | "success";
};

export function AvisMenu({
  items,
  busy,
  onSelect,
  ariaLabel,
}: {
  items: AvisMenuItem[];
  busy: boolean;
  onSelect: (key: string, note: string) => void;
  ariaLabel: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState<AvisMenuItem | null>(null);
  const [note, setNote] = useState("");
  const boite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function dehors(e: MouseEvent) {
      if (boite.current && !boite.current.contains(e.target as Node)) ferme();
    }
    function touche(e: KeyboardEvent) {
      if (e.key === "Escape") ferme();
    }
    document.addEventListener("mousedown", dehors);
    window.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("mousedown", dehors);
      window.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  function ferme() {
    setOuvert(false);
    setSaisie(null);
    setNote("");
  }

  function choisit(item: AvisMenuItem) {
    if (item.ask) {
      setSaisie(item);
      return;
    }
    ferme();
    onSelect(item.key, "");
  }

  function valide() {
    if (!saisie) return;
    const k = saisie.key;
    const n = note.trim();
    ferme();
    onSelect(k, n);
  }

  if (items.length === 0) return null;

  return (
    // Le panneau déborde sur la ligne suivante, dont le bouton d'envoi est lui
    // aussi détaché du fond : sans cette élévation, il passait devant le menu
    // et interceptait les clics.
    <div ref={boite} className="relative" style={{ zIndex: ouvert ? 50 : 10 }}>
      <button
        type="button"
        onClick={() => (ouvert ? ferme() : setOuvert(true))}
        disabled={busy}
        aria-label={ariaLabel}
        aria-expanded={ouvert}
        title="Autres actions"
        className="adm-btn-focus adm-act inline-flex items-center justify-center px-2.5 py-2.5 border transition-colors disabled:opacity-50"
        style={{ borderColor: T.border, color: T.textDim }}
      >
        <MoreHorizontal size={15} />
      </button>

      {ouvert && (
        <div
          className="absolute right-0 top-full mt-1 w-[248px] p-1.5 shadow-lg"
          style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, zIndex: 40 }}
          role="menu"
        >
          {saisie ? (
            <div className="p-1.5">
              <label className="block text-[10px] tracking-[0.14em] uppercase mb-1.5" style={{ color: T.muted }}>
                {saisie.label}
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && valide()}
                placeholder={saisie.ask}
                autoFocus
                maxLength={200}
                className="w-full text-sm px-2.5 py-2 outline-none"
                style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text }}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={ferme}
                  className="adm-btn-focus text-[11px] tracking-widest uppercase px-2.5 py-1.5"
                  style={{ color: T.muted }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={valide}
                  className="adm-btn-focus text-[11px] tracking-widest uppercase px-2.5 py-1.5"
                  style={{ backgroundColor: T.accent, color: T.bg }}
                >
                  Valider
                </button>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const Icon = item.icon;
              const couleur = item.tone === "warning" ? T.warning : item.tone === "success" ? T.success : T.textDim;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  onClick={() => choisit(item)}
                  className="adm-btn-focus flex items-center gap-2.5 w-full text-left text-[13px] px-2.5 py-2 transition-colors hover:bg-[rgba(107,159,238,0.10)]"
                  style={{ color: couleur }}
                >
                  <Icon size={14} style={{ flexShrink: 0, color: couleur }} />
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
