"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

interface Note {
  id: string;
  content: string;
  status: Status;
  tag: string;
  category: string;
  author: string;
  imageUrl: string | null;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: "général",       label: "Général",       color: "#8AABD4" },
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
  général: { backgroundColor: "#1B3055", color: "#8AABD4" },
  UI:      { backgroundColor: "#1B3A6B", color: "#6B9FEE" },
  DB:      { backgroundColor: "#1B3A2C", color: "#4EB87B" },
  config:  { backgroundColor: "#3A2F1B", color: "#F0A55A" },
  bug:     { backgroundColor: "#3A1B1B", color: "#E5635A" },
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
  const [content, setContent]           = useState("");
  const [tag, setTag]                   = useState("général");
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

  function selectCategory(catId: string) {
    setSelectedCat(catId);
    setLastSeen(prev => {
      const updated = { ...prev, [catId]: new Date().toISOString() };
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      return updated;
    });
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
      const fd = new FormData();
      fd.append("file", imageFile);
      const up = await fetch("/api/collab/upload", { method: "POST", body: fd });
      if (up.ok) ({ url: imageUrl } = await up.json());
    }

    const res = await fetch("/api/collab/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tag, imageUrl, category: selectedCat }),
    });

    if (res.ok) {
      const note = await res.json();
      setNotes(prev => [{ ...note, comments: [] }, ...prev]);
      setContent("");
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

  async function deleteNote(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/collab/notes/${id}`, { method: "DELETE" });
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
                  color: selected ? "#F0F5FF" : "#8AABD4",
                  borderLeft: `2px solid ${selected ? "#6B9FEE" : "transparent"}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = "#0D1E38"; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <span style={{ color: cat.color, fontSize: "7px", lineHeight: 1, flexShrink: 0 }}>●</span>
                <span style={{ flex: 1 }}>{cat.label}</span>
                {unread && (
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#6B9FEE", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Utilisateur + déconnexion */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #1B3055" }}>
          <div style={{ color: "#8AABD4", fontSize: "12px", marginBottom: "6px" }}>{authorName}</div>
          <button
            onClick={logout}
            style={{ color: "#1B3055", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")}
            onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}
          >
            Quitter
          </button>
        </div>
      </div>

      {/* ── Contenu principal ───────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header catégorie */}
        <div style={{ borderBottom: "1px solid #1B3055", backgroundColor: "#112240", padding: "14px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: activeCat.color, fontSize: "8px" }}>●</span>
          <span style={{ fontSize: "15px", fontWeight: 300 }}>{activeCat.label}</span>
          <span style={{ color: "#1B3055", fontSize: "12px", marginLeft: "4px" }}>
            {visibleNotes.length > 0 && `${visibleNotes.filter(n => n.status !== "done").length} en cours · ${visibleNotes.filter(n => n.status === "done").length} terminée${visibleNotes.filter(n => n.status === "done").length > 1 ? "s" : ""}`}
          </span>
        </div>

        <div style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>

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
                  <button type="button" onClick={removeImage} className="text-xs px-1" style={{ color: "#8AABD4" }}>✕</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-4 pb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
                style={{ color: imageFile ? "#6B9FEE" : "#1B3055" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")}
                onMouseLeave={e => (e.currentTarget.style.color = imageFile ? "#6B9FEE" : "#1B3055")}
              >
                {imageFile ? `📎 ${imageFile.name}` : "+ Joindre"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <div className="flex-1" />
              <select value={tag} onChange={e => setTag(e.target.value)} className="px-3 py-2 border text-xs outline-none" style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#8AABD4" }}>
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button type="submit" disabled={adding || !content.trim()} className="px-6 py-2 text-xs font-semibold tracking-widest uppercase disabled:opacity-40" style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}>
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
                      <span className="text-xs tracking-widest uppercase" style={{ color: "#8AABD4" }}>{col.label}</span>
                      <span className="text-xs px-2 py-0.5" style={{ backgroundColor: "#1B3055", color: "#8AABD4" }}>{colNotes.length}</span>
                    </div>
                    <div className="space-y-3">
                      {colNotes.length === 0 && (
                        <div className="py-8 text-center text-xs border border-dashed" style={{ borderColor: "#1B3055", color: "#1B3055" }}>—</div>
                      )}
                      {colNotes.map(note => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          authorName={authorName}
                          onMove={moveNote}
                          onEdit={editNote}
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
        </div>
      </div>

      {/* Overlay image */}
      {overlayUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(11,25,48,0.96)" }} onClick={() => setOverlayUrl(null)}>
          <img src={overlayUrl} alt="screenshot" className="max-w-4xl max-h-screen p-8 object-contain" onClick={e => e.stopPropagation()} />
          <button className="absolute top-6 right-6 text-sm tracking-widest uppercase" style={{ color: "#8AABD4" }} onClick={() => setOverlayUrl(null)}>Fermer</button>
        </div>
      )}
    </div>
  );
}

/* ─── NoteCard ─────────────────────────────────────────── */

function NoteCard({
  note, authorName, onMove, onEdit, onDelete, onOpenImage,
}: {
  note: Note;
  authorName: string;
  onMove: (id: string, status: Status) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onOpenImage: (url: string) => void;
}) {
  const [isEditing, setIsEditing]         = useState(false);
  const [editContent, setEditContent]     = useState(note.content);
  const [showComments, setShowComments]   = useState(false);
  const [comments, setComments]           = useState<Comment[]>(note.comments);
  const [newComment, setNewComment]       = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const tagStyle = TAG_STYLES[note.tag] ?? TAG_STYLES["général"];
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
    <div className="border" style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}>
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
              <button onClick={cancelEdit} className="text-xs px-3 py-1" style={{ color: "#8AABD4" }}>Annuler</button>
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
            <span className="text-xs" style={{ color: "#8AABD4" }}>{note.author}</span>
            <span className="text-xs" style={{ color: "#1B3055" }}>·</span>
            <span className="text-xs" style={{ color: "#1B3055" }}>{fmtDate(note.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!isEditing && (
              <button onClick={() => { setEditContent(note.content); setIsEditing(true); }} title="Modifier" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✎</button>
            )}
            {prev && <button onClick={() => onMove(note.id, prev)} title="Reculer" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#8AABD4" }}>←</button>}
            {next && <button onClick={() => onMove(note.id, next)} title="Avancer" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#6B9FEE" }}>→</button>}
            <button onClick={() => onDelete(note.id)} title="Supprimer" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#E5635A")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✕</button>
          </div>
        </div>
      </div>

      {/* Commentaires */}
      <div className="border-t" style={{ borderColor: "#1B3055" }}>
        <button
          onClick={() => setShowComments(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-left"
          style={{ color: commentCount > 0 ? "#8AABD4" : "#1B3055" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")}
          onMouseLeave={e => (e.currentTarget.style.color = commentCount > 0 ? "#8AABD4" : "#1B3055")}
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
              <button type="submit" disabled={addingComment || !newComment.trim()} className="px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ backgroundColor: "#1B3055", color: "#8AABD4" }}>→</button>
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
          style={{ color: replyCount > 0 ? "#8AABD4" : "#1B3055" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")}
          onMouseLeave={e => (e.currentTarget.style.color = replyCount > 0 ? "#8AABD4" : "#1B3055")}
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
              <button type="submit" disabled={addingReply || !newReply.trim()} className="px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ backgroundColor: "#1B3055", color: "#8AABD4" }}>→</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
