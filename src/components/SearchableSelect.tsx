"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { normalizeLabel } from "@/lib/vehicle-catalog";

export type SelectOption = { value: string; label: string };
export type SelectGroup = { label: string; options: SelectOption[] };

/** Une ligne sélectionnable : remise à zéro, option du catalogue, ou saisie libre. */
type Choice =
  | { kind: "clear" }
  | { kind: "option"; option: SelectOption }
  | { kind: "custom"; value: string };

/** Ce qui est réellement rendu : en-têtes de groupe et lignes indexées. */
type DisplayItem =
  | { kind: "header"; key: string; label: string }
  | { kind: "choice"; key: string; index: number; choice: Choice; label: string; muted?: boolean };

export default function SearchableSelect({
  value,
  onChange,
  groups,
  placeholder,
  clearLabel,
  searchPlaceholder,
  customGroupLabel,
  customRowLabel,
  noResultLabel,
  variant = "bar",
  allowCustom = true,
}: {
  value: string;
  onChange: (value: string) => void;
  groups: SelectGroup[];
  /** Libellé du bouton quand rien n'est sélectionné. */
  placeholder: string;
  /** Première ligne de la liste, qui remet le filtre à zéro. */
  clearLabel: string;
  searchPlaceholder: string;
  customGroupLabel: string;
  /** Reçoit le texte saisi, ex. `(q) => \`Utiliser « ${q} »\``. */
  customRowLabel: (query: string) => string;
  noResultLabel: string;
  /** `bar` : panneau flottant (barre de filtres desktop). `block` : panneau en flux (bottom sheet mobile). */
  variant?: "bar" | "block";
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isBar = variant === "bar";
  const trimmed = query.trim();
  const needle = normalizeLabel(trimmed);

  const { items, choices } = useMemo(() => {
    // Ordre d'origine préservé : les marques sont classées par volume de
    // ventes, pas alphabétiquement.
    const matching = needle
      ? groups
          .map((g) => ({ ...g, options: g.options.filter((o) => normalizeLabel(o.label).includes(needle)) }))
          .filter((g) => g.options.length > 0)
      : groups;

    const hasExact = groups.some((g) => g.options.some((o) => normalizeLabel(o.label) === needle));
    const withCustom = allowCustom && trimmed.length > 0 && !hasExact;

    const nextItems: DisplayItem[] = [];
    const nextChoices: Choice[] = [];

    const push = (choice: Choice, label: string, key: string, muted?: boolean) => {
      nextItems.push({ kind: "choice", key, index: nextChoices.length, choice, label, muted });
      nextChoices.push(choice);
    };

    push({ kind: "clear" }, clearLabel, "clear", true);

    matching.forEach((group) => {
      nextItems.push({ kind: "header", key: `h-${group.label}`, label: group.label });
      group.options.forEach((option) =>
        push({ kind: "option", option }, option.label, `${group.label}-${option.value}`)
      );
    });

    if (withCustom) {
      nextItems.push({ kind: "header", key: "h-custom", label: customGroupLabel });
      push({ kind: "custom", value: trimmed }, customRowLabel(trimmed), "custom");
    }

    return { items: nextItems, choices: nextChoices };
  }, [groups, needle, trimmed, allowCustom, clearLabel, customGroupLabel, customRowLabel]);

  // Seule la ligne « remise à zéro » subsiste : rien ne correspond à la saisie.
  const isEmpty = choices.length <= 1 && trimmed.length > 0;

  const commit = useCallback(
    (next: string) => {
      onChange(next);
      setOpen(false);
      setQuery("");
    },
    [onChange]
  );

  const selectChoice = useCallback(
    (choice: Choice) => {
      if (choice.kind === "clear") commit("");
      else if (choice.kind === "option") commit(choice.option.value);
      else commit(choice.value);
    },
    [commit]
  );

  // La barre de filtres défile horizontalement et porte un `backdrop-filter`,
  // qui sert de bloc conteneur aux descendants fixes. Le panneau part donc dans
  // un portail sur `body`, ancré aux coordonnées écran du déclencheur.
  useLayoutEffect(() => {
    if (!open || !isBar) return;
    const measure = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.max(r.width, 260);
      setAnchor({
        top: r.bottom + 4,
        left: Math.max(12, Math.min(r.left, window.innerWidth - width - 12)),
        width,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, isBar]);

  // Fermeture au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Le panneau `bar` vit dans un portail : il sort de `rootRef`.
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Garde la ligne survolée au clavier dans le champ visible.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (choices.length === 0) return;
      setCursor((c) => (c + (e.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length);
      return;
    }
    if (e.key === "Enter" && open) {
      e.preventDefault();
      const choice = choices[cursor];
      if (choice) selectChoice(choice);
    }
  };

  // Une marque saisie à la main sort du catalogue : on retombe sur sa valeur brute.
  const selectedLabel =
    groups.flatMap((g) => g.options).find((o) => o.value === value)?.label ?? value;

  const panel = (
    <div
      ref={panelRef}
      className={isBar ? "fixed z-50" : "relative mt-1 w-full"}
      style={{
        ...(isBar && anchor ? { top: anchor.top, left: anchor.left, width: anchor.width } : null),
        backgroundColor: "#0A1628",
        border: "1px solid #1B3055",
        boxShadow: isBar ? "0 18px 40px rgba(4,11,22,0.55)" : "none",
      }}
    >
      <div className="p-2" style={{ borderBottom: "1px solid #14243d" }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // La liste change : le curseur repart en tête.
            setCursor(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={searchPlaceholder}
          className="w-full text-[12px] px-3 py-2.5 outline-none"
          style={{
            backgroundColor: "rgba(107,159,238,0.06)",
            border: "1px solid rgba(107,159,238,0.2)",
            color: "#F0F5FF",
          }}
        />
      </div>

      <div ref={listRef} role="listbox" className="overflow-y-auto" style={{ maxHeight: "260px" }}>
        {items.map((item) =>
          item.kind === "header" ? (
            <div
              key={item.key}
              className="px-3.5 pt-3 pb-1.5 text-[9px] tracking-[0.25em] uppercase"
              style={{ color: "#6B9FEE" }}
            >
              {item.label}
            </div>
          ) : (
            <OptionRow
              key={item.key}
              index={item.index}
              active={cursor === item.index}
              selected={item.choice.kind === "option" && item.choice.option.value === value}
              muted={item.muted}
              onSelect={() => selectChoice(item.choice)}
              onHover={() => setCursor(item.index)}
            >
              {item.label}
            </OptionRow>
          )
        )}

        {isEmpty && (
          <div className="px-3.5 py-4 text-[11px]" style={{ color: "#6B8AB8" }}>
            {noResultLabel}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className={`relative ${isBar ? "flex-shrink-0" : "w-full"}`}>
      {/* ── Déclencheur ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          isBar
            ? "flex items-center gap-2.5 text-[11px] tracking-[0.25em] uppercase outline-none cursor-pointer transition-all duration-200 hover:opacity-80 px-5 py-3"
            : "flex items-center justify-between gap-2 w-full text-[13px] px-4 py-3.5 outline-none cursor-pointer text-left"
        }
        style={{
          backgroundColor: "rgba(107,159,238,0.04)",
          border: `1px solid ${open ? "rgba(107,159,238,0.45)" : "rgba(107,159,238,0.2)"}`,
          color: value ? "#F0F5FF" : "#C8D8EE",
        }}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <svg
          width="10" height="10" viewBox="0 0 14 14" fill="none"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "#6B9FEE" }}
        >
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Panneau ── */}
      {/* `bar` : dans un portail, pour échapper au `backdrop-filter` de la barre.
          `block` : en flux, pour que le bottom sheet mobile le fasse défiler. */}
      {open && (isBar ? anchor && createPortal(panel, document.body) : panel)}
    </div>
  );
}

function OptionRow({
  index,
  active,
  selected,
  muted,
  onSelect,
  onHover,
  children,
}: {
  index: number;
  active: boolean;
  selected: boolean;
  muted?: boolean;
  onSelect: () => void;
  onHover: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-row={index}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className="w-full text-left px-3.5 py-2.5 text-[12px] transition-colors duration-100 flex items-center justify-between gap-2"
      style={{
        backgroundColor: active ? "rgba(107,159,238,0.12)" : "transparent",
        color: selected ? "#6B9FEE" : muted ? "#8FA9CC" : "#E4ECF8",
        fontWeight: selected ? 700 : 400,
      }}
    >
      <span className="truncate">{children}</span>
      {selected && <span className="flex-shrink-0 text-[11px]">✓</span>}
    </button>
  );
}
