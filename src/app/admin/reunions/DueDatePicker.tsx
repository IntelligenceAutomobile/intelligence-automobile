"use client";

// Choix d'une échéance ENTIÈREMENT à la souris.
// Le champ « date » natif obligeait à taper jour, mois et année segment par
// segment ; en réunion, personne ne fait ça. Ici : quatre raccourcis couvrent
// l'immense majorité des cas en un clic, le calendrier sert aux dates précises.
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  MONTH_LABELS, WEEKDAY_INITIALS, addDaysToKey, dateKeyOf, endOfMonthKey,
  isDateKey, monthMatrix, shortDateFr,
} from "@/lib/reunions";
import { T, TONE } from "../ui";

export default function DueDatePicker({
  value,
  today,
  late = false,
  onChange,
  label = "Échéance",
}: {
  value: string;
  today: string;
  late?: boolean;
  onChange: (next: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Le panneau bascule à droite quand il déborderait de l'écran (téléphone).
  const [alignRight, setAlignRight] = useState(false);

  // Mois affiché : celui de l'échéance choisie, sinon le mois courant.
  const anchor = isDateKey(value) ? value : today;
  const [cursor, setCursor] = useState(() => anchor.slice(0, 7));
  // Rouvrir le sélecteur doit repartir de la date en cours, pas du dernier mois feuilleté.
  const [seenAnchor, setSeenAnchor] = useState(anchor);
  if (seenAnchor !== anchor) {
    setSeenAnchor(anchor);
    setCursor(anchor.slice(0, 7));
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [cy, cm] = cursor.split("-").map(Number);
  const year = cy;
  const month = cm - 1;
  const weeks = monthMatrix(year, month);

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setCursor(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  function pick(next: string) {
    onChange(next);
    setOpen(false);
    // Le focus revient sur la pastille. Sans ce retour, le bouton du jour cliqué
    // disparaît du document avec le focus dessus : le focus retombe sur la page,
    // la ligne de saisie d'action ne reçoit jamais sa sortie de bloc, et l'action
    // en cours de frappe n'était plus enregistrée en cliquant ailleurs.
    triggerRef.current?.focus();
  }

  function toggle() {
    if (!open && triggerRef.current) {
      // 244 px de panneau : au-delà du bord droit, on l'aligne sur la droite.
      const r = triggerRef.current.getBoundingClientRect();
      setAlignRight(r.left + 244 > window.innerWidth - 12);
    }
    setOpen((o) => !o);
  }

  const shortcuts: { label: string; date: string }[] = [
    { label: "Aujourd'hui", date: today },
    { label: "Demain", date: addDaysToKey(today, 1) },
    { label: "Dans 1 semaine", date: addDaysToKey(today, 7) },
    { label: "Fin du mois", date: endOfMonthKey(today) },
  ];

  const set = isDateKey(value);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={set ? `Échéance : ${shortDateFr(value, today)}. Modifier` : "Choisir une échéance"}
        className="adm-chip inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5"
        style={{
          backgroundColor: "transparent",
          border: `1px solid ${late ? TONE.warning.bd : set ? T.border : T.border}`,
          color: late ? T.warning : set ? T.textDim : T.muted,
        }}
      >
        <CalendarDays size={11} />
        {set ? shortDateFr(value, today) : label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choisir une échéance"
          className={`absolute top-full mt-1 z-50 p-3 ${alignRight ? "right-0" : "left-0"}`}
          style={{
            backgroundColor: T.surface,
            border: "1px solid rgba(199,211,232,0.28)",
            boxShadow: "0 18px 48px rgba(0,0,0,0.55)",
            width: 244,
            maxWidth: "calc(100vw - 24px)",
          }}
        >
          {/* Raccourcis : le geste courant tient en un clic */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => pick(s.date)}
                className="adm-chip text-[11px] px-2 py-1.5"
                style={{
                  border: `1px solid ${value === s.date ? T.accent : T.border}`,
                  backgroundColor: value === s.date ? T.accent : "transparent",
                  color: value === s.date ? T.bg : T.textDim,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Navigation de mois */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Mois précédent"
              className="adm-act p-1"
              style={{ color: T.muted }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: T.textDim }}>
              {MONTH_LABELS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Mois suivant"
              className="adm-act p-1"
              style={{ color: T.muted }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Grille du mois */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAY_INITIALS.map((d, i) => (
              <span key={i} className="text-center text-[9px] uppercase" style={{ color: T.muted }}>
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {weeks.flat().map((day, i) => {
              if (day === null) return <span key={i} />;
              const key = dateKeyOf(year, month, day);
              const isToday = key === today;
              const isPicked = key === value;
              const isPast = key < today;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(key)}
                  aria-label={key}
                  aria-current={isPicked ? "date" : undefined}
                  className="text-[11px] py-1 transition-colors"
                  style={{
                    backgroundColor: isPicked ? T.accent : "transparent",
                    color: isPicked ? T.bg : isPast ? T.muted : T.textDim,
                    // Le jour courant reste repérable même quand un autre est choisi.
                    border: `1px solid ${isPicked ? T.accent : isToday ? "var(--adm-accent-border)" : "transparent"}`,
                    fontVariantNumeric: "tabular-nums",
                    opacity: isPast && !isPicked ? 0.55 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isPicked) e.currentTarget.style.backgroundColor = "rgba(107,159,238,0.14)"; }}
                  onMouseLeave={(e) => { if (!isPicked) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {set && (
            <button
              type="button"
              onClick={() => pick("")}
              className="adm-act inline-flex items-center gap-1.5 text-[11px] mt-3 pt-2 w-full justify-center"
              style={{ color: T.muted, borderTop: `1px solid ${T.border}` }}
            >
              <X size={11} />
              Retirer l&apos;échéance
            </button>
          )}
        </div>
      )}
    </div>
  );
}
