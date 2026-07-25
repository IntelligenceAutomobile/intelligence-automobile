"use client";

// Fil des notes de l'atelier (démonstration /demoprooo, lecture seule).
// Reproduit le rendu des cartes du back-office (couleur de catégorie, urgence,
// auteur, date, boutons d'action) avec un filtre par statut géré en mémoire
// locale. Aucun fetch : les boutons « Nouvelle note » et actions de carte
// affichent un toast via DemoActionButton.
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { T, Tag, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import DemoActionButton from "@/app/demoprooo/DemoActionButton";

export type AtelierNote = {
  id: string;
  content: string;
  status: string;
  urgency: string;
  author: string;
  category: string;
  dateLabel: string;
};

// Statuts affichés (le back-office utilise les mêmes libellés de colonne).
const STATUS_ORDER = ["todo", "in-progress", "done"] as const;
const STATUS_LABEL: Record<string, string> = {
  todo: "À faire",
  "in-progress": "En cours",
  done: "Fait",
};

// Couleur de catégorie reprise du tableau d'atelier (filet gauche de la carte).
const CATEGORY_COLOR: Record<string, string> = {
  "général": "#C8D8EE",
  "véhicules": "#4EB87B",
  "administratif": "#F0A55A",
  "site web": "#A78BFA",
  "commercial": "#6B9FEE",
};
const CATEGORY_LABEL: Record<string, string> = {
  "général": "Général",
  "véhicules": "Véhicules",
  "administratif": "Administratif",
  "site web": "Site web",
  "commercial": "Commercial",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "todo", label: "À faire" },
  { value: "in-progress", label: "En cours" },
  { value: "done", label: "Fait" },
];

// Statut voisin, pour les flèches « reculer / avancer » (inertes en démo).
const PREV: Record<string, string | null> = { todo: null, "in-progress": "todo", done: "in-progress" };
const NEXT: Record<string, string | null> = { todo: "in-progress", "in-progress": "done", done: null };

const iconBtnClass = "w-7 h-7 inline-flex items-center justify-center transition-colors hover:text-[#F0F5FF]";

function NoteCard({ note }: { note: AtelierNote }) {
  const catColor = CATEGORY_COLOR[note.category] ?? T.muted;
  const catLabel = CATEGORY_LABEL[note.category] ?? note.category;
  const prev = PREV[note.status];
  const next = NEXT[note.status];

  return (
    <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${catColor}` }}>
      <div className="p-4">
        <p className="text-sm mb-3 leading-relaxed" style={{ color: T.text, whiteSpace: "pre-wrap" }}>
          {note.content}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: catColor }}>
              <span style={{ fontSize: 7, lineHeight: 1 }}>●</span>
              {catLabel}
            </span>
            {note.urgency === "urgente" ? (
              <Tag tone="danger">Urgente</Tag>
            ) : (
              <Tag tone="accent">Normale</Tag>
            )}
            <span className="text-xs" style={{ color: T.textDim }}>{note.author}</span>
            <span className="text-xs" style={{ color: T.muted }}>·</span>
            <span className="text-xs" style={{ color: T.muted }}>{note.dateLabel}</span>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <DemoActionButton ariaLabel="Modifier la note" title="Modifier" className={iconBtnClass} style={{ color: T.muted }}>
              <Pencil size={13} />
            </DemoActionButton>
            {prev && (
              <DemoActionButton ariaLabel="Reculer la note" title={`Reculer vers « ${STATUS_LABEL[prev]} »`} className={iconBtnClass} style={{ color: T.textDim }}>
                <ArrowLeft size={13} />
              </DemoActionButton>
            )}
            {next && (
              <DemoActionButton ariaLabel="Avancer la note" title={`Avancer vers « ${STATUS_LABEL[next]} »`} className={iconBtnClass} style={{ color: T.accent }}>
                <ArrowRight size={13} />
              </DemoActionButton>
            )}
            <DemoActionButton ariaLabel="Envoyer à la corbeille" title="Envoyer à la corbeille" className={iconBtnClass} style={{ color: T.muted }}>
              <Trash2 size={13} />
            </DemoActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AtelierFeed({ notes }: { notes: AtelierNote[] }) {
  const [filter, setFilter] = useState("all");

  const visibleStatuses = filter === "all" ? [...STATUS_ORDER] : [filter];
  const visible = useMemo(
    () => (filter === "all" ? notes : notes.filter((n) => n.status === filter)),
    [notes, filter],
  );

  return (
    <div>
      {/* Nouvelle note (inerte) */}
      <div className="mb-8" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
        <div className="p-4">
          <textarea
            rows={2}
            placeholder="Nouvelle note pour l'équipe…"
            className="w-full px-4 py-3 text-sm outline-none resize-none focus:border-[#6B9FEE]"
            style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.text }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 pb-4">
          <DemoActionButton
            className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-colors hover:border-[#6B9FEE] hover:text-[#F0F5FF]"
            style={{ borderColor: T.border, color: T.textDim }}
          >
            <ImagePlus size={13} />
            Photos
          </DemoActionButton>
          <DemoActionButton
            className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-colors hover:border-[#6B9FEE] hover:text-[#F0F5FF]"
            style={{ borderColor: T.border, color: T.textDim }}
          >
            <Paperclip size={13} />
            Fichiers
          </DemoActionButton>
          <div className="flex-1" />
          <select
            defaultValue="général"
            aria-label="Catégorie"
            className="px-3 py-2 text-xs outline-none cursor-pointer focus:border-[#6B9FEE]"
            style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.textDim }}
          >
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            defaultValue="normale"
            aria-label="Urgence"
            className="px-3 py-2 text-xs outline-none cursor-pointer focus:border-[#6B9FEE]"
            style={{ backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.textDim }}
          >
            <option value="normale">Normale</option>
            <option value="urgente">Urgente</option>
          </select>
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Ajouter
          </DemoActionButton>
        </div>
      </div>

      {/* Filtres de statut (état local, aucun fetch) */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className="text-[11px] tracking-widest uppercase px-3 py-2.5 border transition-colors"
                style={{
                  borderColor: active ? T.accent : T.border,
                  color: active ? T.bg : T.textDim,
                  backgroundColor: active ? T.accent : "transparent",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs ml-auto" style={{ color: T.muted }}>
          {visible.length} note{visible.length > 1 ? "s" : ""}
          {filter !== "all" ? ` sur ${notes.length}` : ""}
        </p>
      </div>

      {/* Fil regroupé par statut */}
      <div className="space-y-8">
        {visibleStatuses.map((status) => {
          const colNotes = notes.filter((n) => n.status === status);
          return (
            <div key={status}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xs tracking-widest uppercase" style={{ color: T.textDim }}>
                  {STATUS_LABEL[status]}
                </span>
                <span
                  className="text-[11px] px-2 py-0.5"
                  style={{ backgroundColor: T.surfaceAlt, color: T.accent, border: `1px solid ${T.border}` }}
                >
                  {colNotes.length}
                </span>
              </div>
              {colNotes.length === 0 ? (
                <div
                  className="py-8 text-center text-xs border border-dashed"
                  style={{ borderColor: T.border, color: T.muted }}
                >
                  Aucune note ici pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {colNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
