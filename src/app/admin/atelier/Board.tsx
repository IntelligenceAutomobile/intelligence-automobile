"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { T } from "@/app/admin/ui";
import { parseAttachments, type Attachment, type AttachmentKind } from "@/lib/collab-attachments";

type Status = "todo" | "doing" | "done";

interface Reply {
  id: string;
  content: string;
  attachments: string;
  author: string;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  attachments: string;
  author: string;
  createdAt: string;
  replies: Reply[];
}

interface TrashNote {
  id: string;
  content: string;
  status: Status;
  tag: string;
  urgency: string;
  category: string;
  author: string;
  imageUrl: string | null;
  deletedAt: string;
  createdAt: string;
}

interface Note {
  id: string;
  content: string;
  status: Status;
  tag: string;
  urgency: string;
  category: string;
  author: string;
  imageUrl: string | null;
  images: string;
  attachments: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: "général",       label: "Général",       color: "#C8D8EE" },
  { id: "véhicules",     label: "Véhicules",     color: "#4EB87B" },
  { id: "administratif", label: "Administratif", color: "#F0A55A" },
  { id: "site web",      label: "Site web",      color: "#A78BFA" },
  { id: "commercial",    label: "Commercial",    color: "#6B9FEE" },
] as const;

const COLUMNS: { status: Status; label: string }[] = [
  { status: "todo",  label: "À faire"  },
  { status: "doing", label: "En cours" },
  { status: "done",  label: "Fait"     },
];

const TAGS = ["général", "UI", "DB", "config", "bug"];

const TAG_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  général: { backgroundColor: "#1B3055", color: "#C8D8EE" },
  UI:      { backgroundColor: "#1B3A6B", color: "#6B9FEE" },
  DB:      { backgroundColor: "#1B3A2C", color: "#4EB87B" },
  config:  { backgroundColor: "#3A2F1B", color: "#F0A55A" },
  bug:     { backgroundColor: "#3A1B1B", color: "#E5635A" },
};

const URGENCY_LEVELS = [
  { id: "faible",  label: "Faible"  },
  { id: "normale", label: "Normale" },
  { id: "urgente", label: "Urgente" },
] as const;

const URGENCY_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  faible:  { backgroundColor: "#1B2840", color: "#7E96BD" },
  normale: { backgroundColor: "#1B3A6B", color: "#6B9FEE" },
  urgente: { backgroundColor: "#3A1B1B", color: "#E5635A" },
};

const NEXT: Record<Status, Status | null> = { todo: "doing", doing: "done", done: null };
const PREV: Record<Status, Status | null> = { todo: null, doing: "todo", done: "doing" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const LS_KEY = "ia_collab_seen";

export default function Board({ authorName }: { authorName: string }) {
  const [notes, setNotes]               = useState<Note[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedCat, setSelectedCat]   = useState("général");
  const [lastSeen, setLastSeen]         = useState<Record<string, string>>({});
  const [trashNotes, setTrashNotes]     = useState<TrashNote[] | null>(null);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [content, setContent]           = useState("");
  const [tag, setTag]                   = useState("général");
  const [urgency, setUrgency]           = useState("normale");
  const att                             = useAttachments();
  const [adding, setAdding]             = useState(false);
  const [overlay, setOverlay]           = useState<{ urls: string[]; index: number } | null>(null);

  // Load lastSeen from localStorage and mark initial category seen
  useEffect(() => {
    let stored: Record<string, string> = {};
    try { stored = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch {}
    const initial = { ...stored, général: new Date().toISOString() };
    setLastSeen(initial);
    localStorage.setItem(LS_KEY, JSON.stringify(initial));
  }, []);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/collab/notes");
    if (res.ok) setNotes(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlay(null);
      if (e.key === "ArrowRight") setOverlay(o => o && { ...o, index: (o.index + 1) % o.urls.length });
      if (e.key === "ArrowLeft") setOverlay(o => o && { ...o, index: (o.index - 1 + o.urls.length) % o.urls.length });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  useEffect(() => {
    if (selectedCat !== "__trash__") return;
    if (trashNotes !== null) return;
    setLoadingTrash(true);
    fetch("/api/collab/trash")
      .then(r => r.json())
      .then(data => { setTrashNotes(data); setLoadingTrash(false); });
  }, [selectedCat, trashNotes]);

  function selectCategory(catId: string) {
    setSelectedCat(catId);
    if (catId === "__trash__") return;
    setLastSeen(prev => {
      const updated = { ...prev, [catId]: new Date().toISOString() };
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function todoCount(catId: string): number {
    return notes.filter(n => n.category === catId && n.status === "todo").length;
  }

  function hasUnread(catId: string): boolean {
    if (loading) return false;
    const lastVisit = lastSeen[catId] ? new Date(lastSeen[catId]) : new Date(0);
    return notes
      .filter(n => n.category === catId)
      .some(n => {
        if (n.author !== authorName && new Date(n.createdAt) > lastVisit) return true;
        return n.comments.some(c => {
          if (c.author !== authorName && new Date(c.createdAt) > lastVisit) return true;
          return c.replies.some(r => r.author !== authorName && new Date(r.createdAt) > lastVisit);
        });
      });
  }

  async function downloadImage(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = url.split("/").pop() || "photo";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  }

  async function downloadAllImages(urls: string[]) {
    for (const url of urls) {
      await downloadImage(url);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setAdding(true);

    const attachments = await att.uploadAll();

    const res = await fetch("/api/collab/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tag, urgency, attachments, category: selectedCat }),
    });

    if (res.ok) {
      const note = await res.json();
      setNotes(prev => [{ ...note, comments: [] }, ...prev]);
      setContent("");
      setUrgency("normale");
      att.clear();
    }
    setAdding(false);
  }

  async function moveNote(id: string, newStatus: Status) {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, status: newStatus, updatedAt: new Date().toISOString() } : n
    ));
    await fetch(`/api/collab/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function editNote(id: string, newContent: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content: newContent } : n));
    await fetch(`/api/collab/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });
  }

  async function editUrgency(id: string, newUrgency: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, urgency: newUrgency } : n));
    await fetch(`/api/collab/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urgency: newUrgency }),
    });
  }

  async function deleteNote(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id));
    const res = await fetch(`/api/collab/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      const deleted: TrashNote = await res.json();
      setTrashNotes(prev => prev ? [deleted, ...prev] : [deleted]);
    }
  }

  async function changeName() {
    await fetch("/api/collab/identity", { method: "DELETE" });
    window.location.reload();
  }

  const activeCat = CATEGORIES.find(c => c.id === selectedCat)!;
  const visibleNotes = notes.filter(n => n.category === selectedCat);

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-70px)]" style={{ backgroundColor: T.bg, color: T.text }}>

      {/* ── Sidebar ─────────────────────────────── */}
      <div className="md:hidden" style={{ backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2.5" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => {
            const selected = selectedCat === cat.id;
            const unread   = hasUnread(cat.id);
            const todo     = todoCount(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 whitespace-nowrap"
                style={{
                  fontSize: "13px",
                  borderRadius: "999px",
                  border: `1px solid ${selected ? cat.color : "#1B3055"}`,
                  backgroundColor: selected ? "#112240" : "transparent",
                  color: selected ? cat.color : "#C8D8EE",
                }}
              >
                <span style={{ color: cat.color, fontSize: "7px", lineHeight: 1 }}>●</span>
                <span>{cat.label}</span>
                {todo > 0 && (
                  <span style={{ fontSize: "10px", lineHeight: 1, padding: "2px 6px", borderRadius: "9px", backgroundColor: selected ? cat.color : "#1B3055", color: selected ? "#0B1930" : "#C8D8EE" }}>{todo}</span>
                )}
                {unread && <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#6B9FEE" }} />}
              </button>
            );
          })}
          <button
            onClick={() => selectCategory("__trash__")}
            className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 whitespace-nowrap"
            style={{
              fontSize: "13px",
              borderRadius: "999px",
              border: "1px solid #1B3055",
              backgroundColor: selectedCat === "__trash__" ? "#112240" : "transparent",
              color: selectedCat === "__trash__" ? "#C8D8EE" : "#7C92B5",
            }}
          >
            <span style={{ fontSize: "11px" }}>🗑</span>
            <span>Corbeille</span>
            {trashNotes && trashNotes.length > 0 && <span style={{ fontSize: "10px" }}>{trashNotes.length}</span>}
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 pb-2.5" style={{ fontSize: "11px", color: "#7C92B5" }}>
          <span>Signé : {authorName}</span>
          <button onClick={changeName} style={{ textDecoration: "underline", color: "#7C92B5" }}>changer</button>
        </div>
      </div>

      {/* ── Sidebar (desktop) ───────────────────── */}
      <div className="hidden md:flex md:flex-col" style={{ width: "210px", flexShrink: 0, backgroundColor: T.surfaceAlt, borderRight: `1px solid ${T.border}` }}>

        {/* Titre */}
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ color: T.accent, fontSize: "12px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Atelier</span>
          <div style={{ color: T.muted, fontSize: "10px", letterSpacing: "0.1em", marginTop: "2px" }}>Espace équipe</div>
        </div>

        {/* Catégories */}
        <nav style={{ padding: "12px 8px", flex: 1 }}>
          <div style={{ color: "#1B3055", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 8px", marginBottom: "8px" }}>
            Espaces
          </div>
          {CATEGORIES.map(cat => {
            const selected = selectedCat === cat.id;
            const unread   = hasUnread(cat.id);
            const todo     = todoCount(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "7px 8px",
                  marginBottom: "1px",
                  fontSize: "13px",
                  textAlign: "left",
                  backgroundColor: selected ? "#112240" : "transparent",
                  color: selected ? cat.color : "#C8D8EE",
                  borderLeft: `2px solid ${selected ? cat.color : "transparent"}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = "#0D1E38"; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <span style={{ color: cat.color, fontSize: "7px", lineHeight: 1, flexShrink: 0 }}>●</span>
                <span style={{ flex: 1 }}>{cat.label}</span>
                {todo > 0 && (
                  <span
                    title={`${todo} tâche${todo > 1 ? "s" : ""} à faire`}
                    style={{
                      fontSize: "10px",
                      lineHeight: 1,
                      padding: "2px 6px",
                      borderRadius: "9px",
                      backgroundColor: selected ? cat.color : "#1B3055",
                      color: selected ? "#0B1930" : "#C8D8EE",
                      flexShrink: 0,
                    }}
                  >
                    {todo}
                  </span>
                )}
                {unread && (
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#6B9FEE", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Corbeille */}
        <div style={{ padding: "8px", borderTop: "1px solid #1B3055" }}>
          <button
            onClick={() => selectCategory("__trash__")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "7px 8px",
              fontSize: "13px",
              textAlign: "left",
              backgroundColor: selectedCat === "__trash__" ? "#112240" : "transparent",
              color: selectedCat === "__trash__" ? "#C8D8EE" : "#1B3055",
              borderLeft: `2px solid ${selectedCat === "__trash__" ? "#1B3055" : "transparent"}`,
            }}
            onMouseEnter={e => { if (selectedCat !== "__trash__") e.currentTarget.style.color = "#C8D8EE"; }}
            onMouseLeave={e => { if (selectedCat !== "__trash__") e.currentTarget.style.color = "#1B3055"; }}
          >
            <span style={{ fontSize: "11px" }}>🗑</span>
            <span>Corbeille</span>
            {trashNotes && trashNotes.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: "10px", color: "#1B3055" }}>{trashNotes.length}</span>
            )}
          </button>
        </div>

        {/* Identité (signature des notes) */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ color: T.textDim, fontSize: "12px", marginBottom: "6px" }}>Signé : {authorName}</div>
          <button
            onClick={changeName}
            style={{ color: T.muted, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}
            onMouseEnter={e => (e.currentTarget.style.color = T.textDim)}
            onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
          >
            Changer de nom
          </button>
        </div>
      </div>

      {/* ── Contenu principal ───────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 md:px-6 md:py-3.5" style={{ borderBottom: "1px solid #1B3055", backgroundColor: "#112240" }}>
          {selectedCat === "__trash__" ? (
            <>
              <span style={{ fontSize: "12px" }}>🗑</span>
              <span style={{ fontSize: "15px", fontWeight: 400 }}>Corbeille</span>
              <span style={{ color: "#1B3055", fontSize: "12px", marginLeft: "4px" }}>
                {trashNotes ? `${trashNotes.length} note${trashNotes.length > 1 ? "s" : ""}` : ""}
              </span>
            </>
          ) : (
            <>
              <span style={{ color: activeCat.color, fontSize: "8px" }}>●</span>
              <span style={{ fontSize: "15px", fontWeight: 400 }}>{activeCat.label}</span>
              <span style={{ color: "#1B3055", fontSize: "12px", marginLeft: "4px" }}>
                {visibleNotes.length > 0 && `${visibleNotes.filter(n => n.status !== "done").length} en cours · ${visibleNotes.filter(n => n.status === "done").length} terminée${visibleNotes.filter(n => n.status === "done").length > 1 ? "s" : ""}`}
              </span>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 md:px-6 md:py-7">
          {selectedCat === "__trash__" && (
            <TrashView notes={trashNotes ?? []} loading={loadingTrash} />
          )}
          {selectedCat !== "__trash__" && <>
          {/* Formulaire */}
          <form onSubmit={addNote} className="mb-8 border" style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}>
            <div className="p-4">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`Nouvelle note dans ${activeCat.label}...`}
                rows={2}
                className="w-full px-4 py-3 border text-sm outline-none resize-none"
                style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(e as unknown as React.FormEvent); }}
              />
              <AttachPreviews att={att} className="mt-3" size={96} />
            </div>
            <div className="flex flex-wrap items-center gap-3 px-4 pb-4">
              <AttachBar att={att} />
              <div className="flex-1" />
              <select value={tag} onChange={e => setTag(e.target.value)} className="px-3 py-2 border text-xs outline-none" style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#C8D8EE" }}>
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={urgency} onChange={e => setUrgency(e.target.value)} className="px-3 py-2 border text-xs outline-none" style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: URGENCY_STYLES[urgency]?.color ?? "#C8D8EE" }}>
                {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
              <button type="submit" disabled={adding || !content.trim()} className="px-6 py-2 text-xs font-semibold tracking-widest uppercase disabled:opacity-40" style={{ backgroundColor: activeCat.color, color: "#0B1930" }}>
                {adding ? "..." : "Ajouter"}
              </button>
            </div>
          </form>

          {/* Kanban */}
          {loading ? (
            <div className="text-sm text-center py-16" style={{ color: "#1B3055" }}>Chargement...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {COLUMNS.map(col => {
                const colNotes = visibleNotes.filter(n => n.status === col.status);
                return (
                  <div key={col.status}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs tracking-widest uppercase" style={{ color: "#C8D8EE" }}>{col.label}</span>
                      <span className="text-xs px-2 py-0.5" style={{ backgroundColor: "#1B3055", color: activeCat.color }}>{colNotes.length}</span>
                    </div>
                    <div className="space-y-3">
                      {colNotes.length === 0 && (
                        <div className="py-8 text-center text-xs border border-dashed" style={{ borderColor: "#1B3055", color: "#1B3055" }}>—</div>
                      )}
                      {colNotes.map(note => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          catColor={activeCat.color}
                          authorName={authorName}
                          onMove={moveNote}
                          onEdit={editNote}
                          onEditUrgency={editUrgency}
                          onDelete={deleteNote}
                          onOpenImage={(urls, index) => setOverlay({ urls, index })}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>}
        </div>
      </div>

      {/* Overlay image */}
      {overlay && (() => {
        const url = overlay.urls[overlay.index];
        const multi = overlay.urls.length > 1;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(11,25,48,0.96)" }} onClick={() => setOverlay(null)}>
            {multi && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setOverlay(o => o && { ...o, index: (o.index - 1 + o.urls.length) % o.urls.length }); }}
                className="absolute left-4 text-2xl px-3 py-2"
                style={{ color: "#C8D8EE" }}
              >
                ‹
              </button>
            )}
            <img src={url} alt="screenshot" className="max-w-4xl max-h-screen p-4 md:p-8 object-contain" onClick={e => e.stopPropagation()} />
            {multi && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setOverlay(o => o && { ...o, index: (o.index + 1) % o.urls.length }); }}
                className="absolute right-4 text-2xl px-3 py-2"
                style={{ color: "#C8D8EE" }}
              >
                ›
              </button>
            )}
            {multi && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs tracking-widest" style={{ color: "#C8D8EE" }}>
                {overlay.index + 1} / {overlay.urls.length}
              </div>
            )}
            <div className="absolute top-3 right-3 md:top-6 md:right-6 flex flex-wrap items-center justify-end gap-3 md:gap-4">
              {multi && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); downloadAllImages(overlay.urls); }}
                  className="text-xs md:text-sm tracking-widest uppercase"
                  style={{ color: "#C8D8EE" }}
                >
                  Tout télécharger
                </button>
              )}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); downloadImage(url); }}
                className="text-xs md:text-sm tracking-widest uppercase"
                style={{ color: "#C8D8EE" }}
              >
                Télécharger
              </button>
              <button type="button" className="text-xs md:text-sm tracking-widest uppercase" style={{ color: "#C8D8EE" }} onClick={() => setOverlay(null)}>Fermer</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ─── NoteCard ─────────────────────────────────────────── */

function NoteCard({
  note, catColor, authorName, onMove, onEdit, onEditUrgency, onDelete, onOpenImage,
}: {
  note: Note;
  catColor: string;
  authorName: string;
  onMove: (id: string, status: Status) => void;
  onEdit: (id: string, content: string) => void;
  onEditUrgency: (id: string, urgency: string) => void;
  onDelete: (id: string) => void;
  onOpenImage: (urls: string[], index: number) => void;
}) {
  const noteAttachments = parseAttachments(note.attachments);
  const legacyImages: string[] = (() => {
    try {
      const parsed = JSON.parse(note.images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter((u): u is string => typeof u === "string");
    } catch {}
    return note.imageUrl ? [note.imageUrl] : [];
  })();
  // Anciennes notes (champ legacy `images`/`imageUrl`) + nouvelles (`attachments`), sans doublon.
  const images: string[] = Array.from(new Set([
    ...legacyImages,
    ...noteAttachments.filter(a => a.kind === "image").map(a => a.url),
  ]));
  const noteFiles = noteAttachments.filter(a => a.kind === "file");

  const [isEditing, setIsEditing]         = useState(false);
  const [editContent, setEditContent]     = useState(note.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showComments, setShowComments]   = useState(false);
  const [comments, setComments]           = useState<Comment[]>(note.comments);
  const [newComment, setNewComment]       = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const commentAtt                        = useAttachments();

  const tagStyle = TAG_STYLES[note.tag] ?? TAG_STYLES["général"];
  const urgencyStyle = URGENCY_STYLES[note.urgency] ?? URGENCY_STYLES["normale"];
  const prev = PREV[note.status];
  const next = NEXT[note.status];

  function cancelEdit() { setEditContent(note.content); setIsEditing(false); }
  async function saveEdit() {
    const t = editContent.trim();
    if (t && t !== note.content) await onEdit(note.id, t);
    setIsEditing(false);
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() && commentAtt.pending.length === 0) return;
    setAddingComment(true);
    const attachments = await commentAtt.uploadAll();
    const res = await fetch(`/api/collab/notes/${note.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment, attachments }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments(prev => [...prev, { ...c, replies: [] }]);
      setNewComment("");
      commentAtt.clear();
    }
    setAddingComment(false);
  }

  async function deleteComment(commentId: string) {
    setComments(prev => prev.filter(c => c.id !== commentId));
    await fetch(`/api/collab/comments/${commentId}`, { method: "DELETE" });
  }

  const commentCount = comments.length;
  const commentLabel = commentCount === 0 ? "Commenter" : `${commentCount} commentaire${commentCount > 1 ? "s" : ""}`;

  return (
    <div style={{ backgroundColor: "#112240", border: "1px solid #1B3055", borderLeft: `3px solid ${catColor}` }}>
      <div className="p-4">
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              autoFocus rows={3}
              className="w-full px-3 py-2 border text-sm outline-none resize-none"
              style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={saveEdit} className="text-xs px-3 py-1 font-semibold tracking-widest uppercase" style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}>Sauvegarder</button>
              <button onClick={cancelEdit} className="text-xs px-3 py-1" style={{ color: "#C8D8EE" }}>Annuler</button>
            </div>
          </div>
        ) : (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: "#F0F5FF", whiteSpace: "pre-wrap" }}>{note.content}</p>
        )}

        {images.length > 0 && !isEditing && (
          images.length === 1 ? (
            <button type="button" onClick={() => onOpenImage(images, 0)} className="block w-full mb-3 overflow-hidden border" style={{ borderColor: "#1B3055" }}>
              <img src={images[0]} alt="photo" className="w-full object-cover" style={{ maxHeight: "120px", objectPosition: "top" }} />
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-1 mb-3">
              {images.slice(0, 6).map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onOpenImage(images, i)}
                  className="relative overflow-hidden border"
                  style={{ borderColor: "#1B3055", aspectRatio: "1 / 1" }}
                >
                  <img src={url} alt="photo" className="w-full h-full object-cover" />
                  {i === 5 && images.length > 6 && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: "rgba(11,25,48,0.75)", color: "#F0F5FF" }}>
                      +{images.length - 6}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )
        )}

        {noteFiles.length > 0 && !isEditing && <FileChips files={noteFiles} className="mb-3" />}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5" style={tagStyle}>{note.tag}</span>
            <select
              value={note.urgency}
              onChange={e => onEditUrgency(note.id, e.target.value)}
              title="Niveau d'urgence"
              className="text-xs px-2 py-0.5 border-0 outline-none cursor-pointer"
              style={{ ...urgencyStyle, appearance: "none" as const }}
            >
              {URGENCY_LEVELS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
            <span className="text-xs" style={{ color: "#C8D8EE" }}>{note.author}</span>
            <span className="text-xs" style={{ color: "#1B3055" }}>·</span>
            <span className="text-xs" style={{ color: "#1B3055" }}>{fmtDate(note.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {confirmDelete ? (
              <>
                <span className="text-xs mr-1" style={{ color: "#C8D8EE" }}>Supprimer ?</span>
                <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-0.5 border" style={{ color: "#C8D8EE", borderColor: "#1B3055" }}>Non</button>
                <button onClick={() => { setConfirmDelete(false); onDelete(note.id); }} className="text-xs px-2 py-0.5 border" style={{ color: "#E5635A", borderColor: "#3A1B1B" }}>Oui</button>
              </>
            ) : (
              <>
                {!isEditing && (
                  <button onClick={() => { setEditContent(note.content); setIsEditing(true); }} title="Modifier" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#C8D8EE")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✎</button>
                )}
                {prev && <button onClick={() => onMove(note.id, prev)} title="Reculer" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#C8D8EE" }}>←</button>}
                {next && <button onClick={() => onMove(note.id, next)} title="Avancer" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#6B9FEE" }}>→</button>}
                {note.author === authorName && (
                  <button onClick={() => setConfirmDelete(true)} title="Supprimer" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#E5635A")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✕</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Commentaires */}
      <div className="border-t" style={{ borderColor: "#1B3055" }}>
        <button
          onClick={() => setShowComments(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-left"
          style={{ color: commentCount > 0 ? "#C8D8EE" : "#1B3055" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#C8D8EE")}
          onMouseLeave={e => (e.currentTarget.style.color = commentCount > 0 ? "#C8D8EE" : "#1B3055")}
        >
          <span style={{ fontSize: "9px" }}>{showComments ? "▾" : "▸"}</span>
          <span>{commentLabel}</span>
        </button>

        {showComments && (
          <div className="px-4 pb-4 space-y-3">
            {comments.map(c => (
              <CommentItem key={c.id} comment={c} noteId={note.id} authorName={authorName} onDelete={deleteComment} onOpenImage={onOpenImage} />
            ))}
            <form onSubmit={addComment} className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={`${authorName} — commenter...`}
                  className="flex-1 px-3 py-1.5 border text-xs outline-none"
                  style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
                />
                <button type="submit" disabled={addingComment || (!newComment.trim() && commentAtt.pending.length === 0)} className="px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ backgroundColor: "#1B3055", color: "#C8D8EE" }}>→</button>
              </div>
              <AttachPreviews att={commentAtt} size={64} />
              <AttachBar att={commentAtt} small />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CommentItem ──────────────────────────────────────── */

function CommentItem({
  comment, noteId, authorName, onDelete, onOpenImage,
}: {
  comment: Comment;
  noteId: string;
  authorName: string;
  onDelete: (id: string) => void;
  onOpenImage: (urls: string[], index: number) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies]         = useState<Reply[]>(comment.replies);
  const [newReply, setNewReply]       = useState("");
  const [addingReply, setAddingReply] = useState(false);
  const replyAtt                      = useAttachments();

  const replyCount = replies.length;
  const replyLabel = replyCount === 0 ? "Répondre" : `${replyCount} réponse${replyCount > 1 ? "s" : ""}`;

  async function addReply(e: React.FormEvent) {
    e.preventDefault();
    if (!newReply.trim() && replyAtt.pending.length === 0) return;
    setAddingReply(true);
    const attachments = await replyAtt.uploadAll();
    const res = await fetch(`/api/collab/notes/${noteId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newReply, parentId: comment.id, attachments }),
    });
    if (res.ok) {
      const r = await res.json();
      setReplies(prev => [...prev, r]);
      setNewReply("");
      replyAtt.clear();
    }
    setAddingReply(false);
  }

  async function deleteReply(replyId: string) {
    setReplies(prev => prev.filter(r => r.id !== replyId));
    await fetch(`/api/collab/comments/${replyId}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="flex items-start gap-2 group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-medium" style={{ color: "#6B9FEE" }}>{comment.author}</span>
            <span className="text-xs" style={{ color: "#1B3055" }}>·</span>
            <span className="text-xs" style={{ color: "#1B3055" }}>{fmtDate(comment.createdAt)}</span>
          </div>
          {comment.content && <p className="text-xs leading-relaxed" style={{ color: "#F0F5FF", whiteSpace: "pre-wrap" }}>{comment.content}</p>}
          <AttachmentView attachments={parseAttachments(comment.attachments)} onOpenImage={onOpenImage} />
        </div>
        <button onClick={() => onDelete(comment.id)} className="shrink-0 text-xs opacity-0 group-hover:opacity-100" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#E5635A")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✕</button>
      </div>

      <div className="ml-3 mt-1 border-l pl-3" style={{ borderColor: "#1B3055" }}>
        <button
          onClick={() => setShowReplies(v => !v)}
          className="flex items-center gap-1.5 text-xs py-0.5"
          style={{ color: replyCount > 0 ? "#C8D8EE" : "#1B3055" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#C8D8EE")}
          onMouseLeave={e => (e.currentTarget.style.color = replyCount > 0 ? "#C8D8EE" : "#1B3055")}
        >
          <span style={{ fontSize: "9px" }}>{showReplies ? "▾" : "▸"}</span>
          <span>{replyLabel}</span>
        </button>

        {showReplies && (
          <div className="mt-2 space-y-2">
            {replies.map(r => (
              <div key={r.id} className="flex items-start gap-2 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium" style={{ color: "#6B9FEE" }}>{r.author}</span>
                    <span className="text-xs" style={{ color: "#1B3055" }}>·</span>
                    <span className="text-xs" style={{ color: "#1B3055" }}>{fmtDate(r.createdAt)}</span>
                  </div>
                  {r.content && <p className="text-xs leading-relaxed" style={{ color: "#F0F5FF", whiteSpace: "pre-wrap" }}>{r.content}</p>}
                  <AttachmentView attachments={parseAttachments(r.attachments)} onOpenImage={onOpenImage} />
                </div>
                <button onClick={() => deleteReply(r.id)} className="shrink-0 text-xs opacity-0 group-hover:opacity-100" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#E5635A")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✕</button>
              </div>
            ))}
            <form onSubmit={addReply} className="space-y-2 mt-1">
              <div className="flex gap-2">
                <input
                  value={newReply}
                  onChange={e => setNewReply(e.target.value)}
                  placeholder={`${authorName} — répondre...`}
                  className="flex-1 px-3 py-1.5 border text-xs outline-none"
                  style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
                />
                <button type="submit" disabled={addingReply || (!newReply.trim() && replyAtt.pending.length === 0)} className="px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ backgroundColor: "#1B3055", color: "#C8D8EE" }}>→</button>
              </div>
              <AttachPreviews att={replyAtt} size={56} />
              <AttachBar att={replyAtt} small />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TrashView ────────────────────────────────────────── */

function TrashView({ notes, loading }: { notes: TrashNote[]; loading: boolean }) {
  if (loading) {
    return <div className="text-sm text-center py-16" style={{ color: "#1B3055" }}>Chargement...</div>;
  }
  if (notes.length === 0) {
    return <div className="text-sm text-center py-16" style={{ color: "#1B3055" }}>La corbeille est vide.</div>;
  }

  const getCatColor = (catId: string) =>
    CATEGORIES.find(c => c.id === catId)?.color ?? "#1B3055";

  // Regroupement par mois de suppression, du plus récent au plus ancien.
  // (Les notes sont d'abord triées par deletedAt décroissant : mois ET notes
  //  à l'intérieur d'un mois ressortent donc du plus récent au plus ancien.)
  type Group = { key: string; label: string; items: TrashNote[] };
  const groups: Group[] = [];
  const byKey = new Map<string, Group>();
  [...notes]
    .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
    .forEach(note => {
      const d = new Date(note.deletedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let group = byKey.get(key);
      if (!group) {
        const raw = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
        group = { key, label: raw.charAt(0).toUpperCase() + raw.slice(1), items: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      group.items.push(note);
    });

  return (
    <div style={{ maxWidth: "720px" }}>
      <div className="space-y-8">
        {groups.map(group => (
          <div key={group.key}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-widest uppercase" style={{ color: "#C8D8EE" }}>{group.label}</span>
              <span className="text-xs px-2 py-0.5" style={{ backgroundColor: "#1B3055", color: "#7C92B5" }}>{group.items.length}</span>
            </div>
            <div className="space-y-3">
              {group.items.map(note => (
                <div
                  key={note.id}
                  style={{
                    backgroundColor: "#112240",
                    border: "1px solid #1B3055",
                    borderLeft: `3px solid ${getCatColor(note.category)}`,
                    padding: "14px 16px",
                    opacity: 0.7,
                  }}
                >
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#C8D8EE", whiteSpace: "pre-wrap" }}>
                    {note.content}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: "#1B3055" }}>
                    <span style={{ color: getCatColor(note.category) }}>{note.category}</span>
                    <span>·</span>
                    <span>{note.author}</span>
                    <span>·</span>
                    <span>Supprimé le {fmtDate(note.deletedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pièces jointes (photos + fichiers) ───────────────── */

const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface Pending {
  file: File;
  kind: AttachmentKind;
  preview: string | null;
}

type AttachApi = ReturnType<typeof useAttachments>;

function useAttachments() {
  const [pending, setPending] = useState<Pending[]>([]);
  const pendingRef = useRef<Pending[]>([]);
  useEffect(() => { pendingRef.current = pending; }, [pending]);

  // Révoque les URL d'aperçu (blob:) restantes au démontage, pour éviter les fuites mémoire.
  useEffect(() => () => {
    pendingRef.current.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
  }, []);

  function addFiles(files: File[], kind: AttachmentKind) {
    // URL.createObjectURL : référence légère (pas de base64 en mémoire ni dans le state),
    // disponible immédiatement. Évite le freeze que provoquait readAsDataURL sur des photos lourdes.
    const entries: Pending[] = files.map(file => ({
      file,
      kind,
      preview: kind === "image" ? URL.createObjectURL(file) : null,
    }));
    setPending(prev => [...prev, ...entries]);
  }

  function removeAt(index: number) {
    setPending(prev => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  // Les <input> sont vidés à chaque sélection (voir AttachBar.pick), donc rien à réinitialiser ici.
  function clear() {
    setPending(prev => {
      prev.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
      return [];
    });
  }

  async function uploadAll(): Promise<Attachment[]> {
    const results = await Promise.all(
      pending.map(async p => {
        try {
          const blob = await upload(p.file.name, p.file, {
            access: "public",
            handleUploadUrl: "/api/collab/upload",
          });
          return { url: blob.url, name: p.file.name, kind: p.kind } as Attachment;
        } catch {
          return null;
        }
      })
    );
    return results.filter((a): a is Attachment => a !== null);
  }

  return { pending, addFiles, removeAt, clear, uploadAll };
}

function AttachButton({ icon, label, count, small, onClick }: {
  icon: string;
  label: string;
  count: number;
  small?: boolean;
  onClick: () => void;
}) {
  const active = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border ${small ? "px-2 py-1" : "px-3 py-1.5"} text-xs`}
      style={{ borderColor: active ? "#6B9FEE" : "#2C4B7C", color: active ? "#6B9FEE" : "#C8D8EE", backgroundColor: "#0D1E38" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#6B9FEE"; e.currentTarget.style.color = active ? "#9CC0FF" : "#F0F5FF"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = active ? "#6B9FEE" : "#2C4B7C"; e.currentTarget.style.color = active ? "#6B9FEE" : "#C8D8EE"; }}
    >
      <span>{icon}</span>
      <span>{label}{active ? ` · ${count}` : ""}</span>
    </button>
  );
}

function AttachBar({ att, small }: { att: AttachApi; small?: boolean }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCount = att.pending.filter(p => p.kind === "image").length;
  const fileCount = att.pending.filter(p => p.kind === "file").length;
  function pick(e: React.ChangeEvent<HTMLInputElement>, kind: AttachmentKind) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) att.addFiles(files, kind);
    e.target.value = "";
  }
  return (
    <div className="flex items-center gap-2">
      <AttachButton icon="📷" label="Photos" count={imageCount} small={small} onClick={() => imageInputRef.current?.click()} />
      <AttachButton icon="📎" label="Fichiers" count={fileCount} small={small} onClick={() => fileInputRef.current?.click()} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => pick(e, "image")} />
      <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} multiple className="hidden" onChange={e => pick(e, "file")} />
    </div>
  );
}

function AttachPreviews({ att, size = 80, className = "" }: { att: AttachApi; size?: number; className?: string }) {
  if (att.pending.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-start gap-2 ${className}`}>
      {att.pending.map((p, i) => (
        <div key={i} className="relative">
          {p.kind === "image" ? (
            p.preview ? (
              <img src={p.preview} alt="aperçu" decoding="async" className="object-cover border" style={{ width: size, height: size, borderColor: "#1B3055" }} />
            ) : (
              <div className="border flex items-center justify-center text-xs" style={{ width: size, height: size, borderColor: "#1B3055", color: "#1B3055" }}>…</div>
            )
          ) : (
            <div className="border flex flex-col items-center justify-center gap-1 px-2 text-center" style={{ width: size, height: size, borderColor: "#2C4B7C", color: "#9CC0FF" }}>
              <span style={{ fontSize: "18px" }}>📄</span>
              <span className="leading-tight w-full truncate" style={{ fontSize: "10px" }}>{p.file.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => att.removeAt(i)}
            className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs"
            style={{ backgroundColor: "#0B1930", color: "#C8D8EE", border: "1px solid #1B3055" }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function FileChips({ files, className = "" }: { files: Attachment[]; className?: string }) {
  if (files.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {files.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs border"
          style={{ borderColor: "#2C4B7C", color: "#9CC0FF" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6B9FEE"; e.currentTarget.style.color = "#F0F5FF"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2C4B7C"; e.currentTarget.style.color = "#9CC0FF"; }}
        >
          <span>📄</span>
          <span className="truncate" style={{ maxWidth: "180px" }}>{a.name}</span>
        </a>
      ))}
    </div>
  );
}

function AttachmentView({ attachments, onOpenImage }: { attachments: Attachment[]; onOpenImage: (urls: string[], index: number) => void }) {
  if (attachments.length === 0) return null;
  const images = attachments.filter(a => a.kind === "image");
  const files = attachments.filter(a => a.kind === "file");
  const imageUrls = images.map(a => a.url);
  return (
    <div className="mt-1.5 space-y-1.5">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {images.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onOpenImage(imageUrls, i)}
              className="overflow-hidden border"
              style={{ borderColor: "#1B3055" }}
            >
              <img src={a.url} alt="pièce jointe" className="object-cover" style={{ width: 64, height: 64 }} />
            </button>
          ))}
        </div>
      )}
      <FileChips files={files} />
    </div>
  );
}
