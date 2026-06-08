"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { upload } from "@vercel/blob/client";

type Status = "todo" | "doing" | "done";

interface Reply {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
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
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adding, setAdding]             = useState(false);
  const [overlayUrl, setOverlayUrl]     = useState<string | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

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
    if (!overlayUrl) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOverlayUrl(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayUrl]);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
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

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setAdding(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      try {
        const blob = await upload(imageFile.name, imageFile, {
          access: "public",
          handleUploadUrl: "/api/collab/upload",
        });
        imageUrl = blob.url;
      } catch {
        // upload échoué : la note sera ajoutée sans image
      }
    }

    const res = await fetch("/api/collab/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tag, urgency, imageUrl, category: selectedCat }),
    });

    if (res.ok) {
      const note = await res.json();
      setNotes(prev => [{ ...note, comments: [] }, ...prev]);
      setContent("");
      setUrgency("normale");
      removeImage();
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

  async function logout() {
    await fetch("/api/collab/logout", { method: "POST" });
    window.location.href = "/atelier";
  }

  const activeCat = CATEGORIES.find(c => c.id === selectedCat)!;
  const visibleNotes = notes.filter(n => n.category === selectedCat);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0B1930", color: "#F0F5FF" }}>

      {/* ── Sidebar ─────────────────────────────── */}
      <div style={{ width: "210px", flexShrink: 0, backgroundColor: "#071422", borderRight: "1px solid #1B3055", display: "flex", flexDirection: "column" }}>

        {/* Logo */}
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1B3055" }}>
          <span style={{ color: "#6B9FEE", fontSize: "12px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>IA</span>
          <div style={{ color: "#1B3055", fontSize: "10px", letterSpacing: "0.1em", marginTop: "2px" }}>Espace équipe</div>
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

        {/* Utilisateur + déconnexion */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #1B3055" }}>
          <div style={{ color: "#C8D8EE", fontSize: "12px", marginBottom: "6px" }}>{authorName}</div>
          <button
            onClick={logout}
            style={{ color: "#1B3055", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#C8D8EE")}
            onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}
          >
            Quitter
          </button>
        </div>
      </div>

      {/* ── Contenu principal ───────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid #1B3055", backgroundColor: "#112240", padding: "14px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
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

        <div style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>
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
              {imagePreview && (
                <div className="mt-2 flex items-start gap-2">
                  <img src={imagePreview} alt="aperçu" className="h-24 object-contain border" style={{ borderColor: "#1B3055" }} />
                  <button type="button" onClick={removeImage} className="text-xs px-1" style={{ color: "#C8D8EE" }}>✕</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-4 pb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
                style={{ color: imageFile ? "#6B9FEE" : "#1B3055" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#C8D8EE")}
                onMouseLeave={e => (e.currentTarget.style.color = imageFile ? "#6B9FEE" : "#1B3055")}
              >
                {imageFile ? `📎 ${imageFile.name}` : "+ Joindre"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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
            <div className="grid grid-cols-3 gap-6">
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
                          onOpenImage={setOverlayUrl}
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
      {overlayUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(11,25,48,0.96)" }} onClick={() => setOverlayUrl(null)}>
          <img src={overlayUrl} alt="screenshot" className="max-w-4xl max-h-screen p-8 object-contain" onClick={e => e.stopPropagation()} />
          <button
            type="button"
            onClick={e => { e.stopPropagation(); downloadImage(overlayUrl); }}
            className="absolute top-6 right-32 text-sm tracking-widest uppercase"
            style={{ color: "#C8D8EE" }}
          >
            Télécharger
          </button>
          <button className="absolute top-6 right-6 text-sm tracking-widest uppercase" style={{ color: "#C8D8EE" }} onClick={() => setOverlayUrl(null)}>Fermer</button>
        </div>
      )}
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
  onOpenImage: (url: string) => void;
}) {
  const [isEditing, setIsEditing]         = useState(false);
  const [editContent, setEditContent]     = useState(note.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showComments, setShowComments]   = useState(false);
  const [comments, setComments]           = useState<Comment[]>(note.comments);
  const [newComment, setNewComment]       = useState("");
  const [addingComment, setAddingComment] = useState(false);

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
    if (!newComment.trim()) return;
    setAddingComment(true);
    const res = await fetch(`/api/collab/notes/${note.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments(prev => [...prev, { ...c, replies: [] }]);
      setNewComment("");
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

        {note.imageUrl && !isEditing && (
          <button type="button" onClick={() => onOpenImage(note.imageUrl!)} className="block w-full mb-3 overflow-hidden border" style={{ borderColor: "#1B3055" }}>
            <img src={note.imageUrl} alt="screenshot" className="w-full object-cover" style={{ maxHeight: "120px", objectPosition: "top" }} />
          </button>
        )}

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
              <CommentItem key={c.id} comment={c} noteId={note.id} authorName={authorName} onDelete={deleteComment} />
            ))}
            <form onSubmit={addComment} className="flex gap-2">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={`${authorName} — commenter...`}
                className="flex-1 px-3 py-1.5 border text-xs outline-none"
                style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
              />
              <button type="submit" disabled={addingComment || !newComment.trim()} className="px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ backgroundColor: "#1B3055", color: "#C8D8EE" }}>→</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CommentItem ──────────────────────────────────────── */

function CommentItem({
  comment, noteId, authorName, onDelete,
}: {
  comment: Comment;
  noteId: string;
  authorName: string;
  onDelete: (id: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies]         = useState<Reply[]>(comment.replies);
  const [newReply, setNewReply]       = useState("");
  const [addingReply, setAddingReply] = useState(false);

  const replyCount = replies.length;
  const replyLabel = replyCount === 0 ? "Répondre" : `${replyCount} réponse${replyCount > 1 ? "s" : ""}`;

  async function addReply(e: React.FormEvent) {
    e.preventDefault();
    if (!newReply.trim()) return;
    setAddingReply(true);
    const res = await fetch(`/api/collab/notes/${noteId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newReply, parentId: comment.id }),
    });
    if (res.ok) {
      const r = await res.json();
      setReplies(prev => [...prev, r]);
      setNewReply("");
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
          <p className="text-xs leading-relaxed" style={{ color: "#F0F5FF", whiteSpace: "pre-wrap" }}>{comment.content}</p>
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
                  <p className="text-xs leading-relaxed" style={{ color: "#F0F5FF", whiteSpace: "pre-wrap" }}>{r.content}</p>
                </div>
                <button onClick={() => deleteReply(r.id)} className="shrink-0 text-xs opacity-0 group-hover:opacity-100" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#E5635A")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✕</button>
              </div>
            ))}
            <form onSubmit={addReply} className="flex gap-2 mt-1">
              <input
                value={newReply}
                onChange={e => setNewReply(e.target.value)}
                placeholder={`${authorName} — répondre...`}
                className="flex-1 px-3 py-1.5 border text-xs outline-none"
                style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
              />
              <button type="submit" disabled={addingReply || !newReply.trim()} className="px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ backgroundColor: "#1B3055", color: "#C8D8EE" }}>→</button>
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

  return (
    <div style={{ maxWidth: "720px" }}>
      <div className="space-y-3">
        {notes.map(note => (
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
  );
}
