"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Status = "todo" | "doing" | "done";

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface Note {
  id: string;
  content: string;
  status: Status;
  tag: string;
  author: string;
  imageUrl: string | null;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

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

export default function Board({ authorName }: { authorName: string }) {
  const [notes, setNotes]               = useState<Note[]>([]);
  const [loading, setLoading]           = useState(true);
  const [content, setContent]           = useState("");
  const [tag, setTag]                   = useState("général");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adding, setAdding]             = useState(false);
  const [overlayUrl, setOverlayUrl]     = useState<string | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

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
      body: JSON.stringify({ content, tag, imageUrl }),
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0B1930", color: "#F0F5FF" }}>

      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#6B9FEE" }}>IA</span>
          <div className="h-4 w-px" style={{ backgroundColor: "#1B3055" }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: "#8AABD4" }}>Espace équipe</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs" style={{ color: "#8AABD4" }}>{authorName}</span>
          <button
            onClick={logout}
            className="text-xs tracking-widest uppercase"
            style={{ color: "#1B3055" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")}
            onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}
          >
            Quitter
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Formulaire */}
        <form
          onSubmit={addNote}
          className="mb-8 border"
          style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
        >
          <div className="p-4">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nouvelle note..."
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
              className="text-xs tracking-wide"
              style={{ color: imageFile ? "#6B9FEE" : "#1B3055" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")}
              onMouseLeave={e => (e.currentTarget.style.color = imageFile ? "#6B9FEE" : "#1B3055")}
            >
              {imageFile ? `📎 ${imageFile.name}` : "+ Joindre"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="flex-1" />
            <select
              value={tag}
              onChange={e => setTag(e.target.value)}
              className="px-3 py-2 border text-xs outline-none"
              style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#8AABD4" }}
            >
              {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              type="submit"
              disabled={adding || !content.trim()}
              className="px-6 py-2 text-xs font-semibold tracking-widest uppercase disabled:opacity-40"
              style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
            >
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
              const colNotes = notes.filter(n => n.status === col.status);
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

      {/* Overlay image */}
      {overlayUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(11,25,48,0.96)" }}
          onClick={() => setOverlayUrl(null)}
        >
          <img
            src={overlayUrl}
            alt="screenshot"
            className="max-w-4xl max-h-screen p-8 object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-6 right-6 text-sm tracking-widest uppercase"
            style={{ color: "#8AABD4" }}
            onClick={() => setOverlayUrl(null)}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  authorName,
  onMove,
  onEdit,
  onDelete,
  onOpenImage,
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
  const date = new Date(note.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  function cancelEdit() { setEditContent(note.content); setIsEditing(false); }

  async function saveEdit() {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== note.content) await onEdit(note.id, trimmed);
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
      const comment = await res.json();
      setComments(prev => [...prev, comment]);
      setNewComment("");
    }
    setAddingComment(false);
  }

  async function deleteComment(commentId: string) {
    setComments(prev => prev.filter(c => c.id !== commentId));
    await fetch(`/api/collab/comments/${commentId}`, { method: "DELETE" });
  }

  const commentLabel = comments.length === 0
    ? "Commenter"
    : `${comments.length} commentaire${comments.length > 1 ? "s" : ""}`;

  return (
    <div className="border" style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}>

      {/* Corps de la note */}
      <div className="p-4">
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              autoFocus
              rows={3}
              className="w-full px-3 py-2 border text-sm outline-none resize-none"
              style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={saveEdit}
                className="text-xs px-3 py-1 font-semibold tracking-widest uppercase"
                style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
              >
                Sauvegarder
              </button>
              <button onClick={cancelEdit} className="text-xs px-3 py-1" style={{ color: "#8AABD4" }}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: "#F0F5FF" }}>{note.content}</p>
        )}

        {/* Thumbnail */}
        {note.imageUrl && !isEditing && (
          <button
            type="button"
            onClick={() => onOpenImage(note.imageUrl!)}
            className="block w-full mb-3 overflow-hidden border"
            style={{ borderColor: "#1B3055" }}
          >
            <img
              src={note.imageUrl}
              alt="screenshot"
              className="w-full object-cover"
              style={{ maxHeight: "120px", objectPosition: "top" }}
            />
          </button>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5" style={tagStyle}>{note.tag}</span>
            <span className="text-xs" style={{ color: "#8AABD4" }}>{note.author}</span>
            <span className="text-xs" style={{ color: "#1B3055" }}>·</span>
            <span className="text-xs" style={{ color: "#1B3055" }}>{date}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {!isEditing && (
              <button
                onClick={() => { setEditContent(note.content); setIsEditing(true); }}
                title="Modifier"
                className="w-7 h-7 flex items-center justify-center text-xs"
                style={{ color: "#1B3055" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")}
                onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}
              >
                ✎
              </button>
            )}
            {prev && (
              <button onClick={() => onMove(note.id, prev)} title="Reculer" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#8AABD4" }}>←</button>
            )}
            {next && (
              <button onClick={() => onMove(note.id, next)} title="Avancer" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#6B9FEE" }}>→</button>
            )}
            <button
              onClick={() => onDelete(note.id)}
              title="Supprimer"
              className="w-7 h-7 flex items-center justify-center text-xs"
              style={{ color: "#1B3055" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#E5635A")}
              onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Section commentaires */}
      <div className="border-t" style={{ borderColor: "#1B3055" }}>
        <button
          onClick={() => setShowComments(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-left"
          style={{ color: comments.length > 0 ? "#8AABD4" : "#1B3055" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#8AABD4")}
          onMouseLeave={e => (e.currentTarget.style.color = comments.length > 0 ? "#8AABD4" : "#1B3055")}
        >
          <span style={{ fontSize: "10px" }}>{showComments ? "▾" : "▸"}</span>
          <span>{commentLabel}</span>
        </button>

        {showComments && (
          <div className="px-4 pb-4 space-y-3">

            {/* Liste des commentaires */}
            {comments.length > 0 && (
              <div className="space-y-2">
                {comments.map(c => {
                  const cDate = new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                  return (
                    <div key={c.id} className="flex items-start gap-2 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium" style={{ color: "#6B9FEE" }}>{c.author}</span>
                          <span className="text-xs" style={{ color: "#1B3055" }}>·</span>
                          <span className="text-xs" style={{ color: "#1B3055" }}>{cDate}</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "#F0F5FF" }}>{c.content}</p>
                      </div>
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="shrink-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "#1B3055" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#E5635A")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Input nouveau commentaire */}
            <form onSubmit={addComment} className="flex gap-2">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={`${authorName} — votre commentaire...`}
                className="flex-1 px-3 py-1.5 border text-xs outline-none"
                style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
              />
              <button
                type="submit"
                disabled={addingComment || !newComment.trim()}
                className="px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#1B3055", color: "#8AABD4" }}
              >
                →
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
