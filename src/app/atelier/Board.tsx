"use client";

import { useState, useEffect, useCallback } from "react";

type Status = "todo" | "doing" | "done";

interface Note {
  id: string;
  content: string;
  status: Status;
  tag: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

const COLUMNS: { status: Status; label: string }[] = [
  { status: "todo", label: "À faire" },
  { status: "doing", label: "En cours" },
  { status: "done", label: "Fait" },
];

const TAGS = ["général", "UI", "DB", "config", "bug"];

const TAG_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  général: { backgroundColor: "#1B3055", color: "#8AABD4" },
  UI: { backgroundColor: "#1B3A6B", color: "#6B9FEE" },
  DB: { backgroundColor: "#1B3A2C", color: "#4EB87B" },
  config: { backgroundColor: "#3A2F1B", color: "#F0A55A" },
  bug: { backgroundColor: "#3A1B1B", color: "#E5635A" },
};

const NEXT: Record<Status, Status | null> = { todo: "doing", doing: "done", done: null };
const PREV: Record<Status, Status | null> = { todo: null, doing: "todo", done: "doing" };

export default function Board({ authorName }: { authorName: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("général");
  const [adding, setAdding] = useState(false);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/collab/notes");
    if (res.ok) setNotes(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setAdding(true);
    const res = await fetch("/api/collab/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tag }),
    });
    if (res.ok) {
      setNotes(prev => [await res.json(), ...prev]);
      setContent("");
    }
    setAdding(false);
  }

  async function moveNote(id: string, newStatus: Status) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, status: newStatus, updatedAt: new Date().toISOString() } : n));
    await fetch(`/api/collab/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
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
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#6B9FEE" }}>
            IA
          </span>
          <div className="h-4 w-px" style={{ backgroundColor: "#1B3055" }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: "#8AABD4" }}>
            Espace équipe
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs" style={{ color: "#8AABD4" }}>
            {authorName}
          </span>
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
        {/* Form */}
        <form
          onSubmit={addNote}
          className="mb-8 p-4 border flex gap-3 items-start"
          style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
        >
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Nouvelle note..."
            rows={2}
            className="flex-1 px-4 py-3 border text-sm outline-none resize-none"
            style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(e as unknown as React.FormEvent); }}
          />
          <select
            value={tag}
            onChange={e => setTag(e.target.value)}
            className="px-3 py-3 border text-xs outline-none"
            style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#8AABD4" }}
          >
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            type="submit"
            disabled={adding || !content.trim()}
            className="px-6 py-3 text-xs font-semibold tracking-widest uppercase transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
          >
            {adding ? "..." : "Ajouter"}
          </button>
        </form>

        {/* Kanban */}
        {loading ? (
          <div className="text-sm text-center py-16" style={{ color: "#1B3055" }}>
            Chargement...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {COLUMNS.map(col => {
              const colNotes = notes.filter(n => n.status === col.status);
              return (
                <div key={col.status}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs tracking-widest uppercase" style={{ color: "#8AABD4" }}>
                      {col.label}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5"
                      style={{ backgroundColor: "#1B3055", color: "#8AABD4" }}
                    >
                      {colNotes.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colNotes.length === 0 && (
                      <div
                        className="py-8 text-center text-xs border border-dashed"
                        style={{ borderColor: "#1B3055", color: "#1B3055" }}
                      >
                        —
                      </div>
                    )}
                    {colNotes.map(note => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onMove={moveNote}
                        onDelete={deleteNote}
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
  );
}

function NoteCard({
  note,
  onMove,
  onDelete,
}: {
  note: Note;
  onMove: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}) {
  const tagStyle = TAG_STYLES[note.tag] ?? TAG_STYLES["général"];
  const prev = PREV[note.status];
  const next = NEXT[note.status];
  const date = new Date(note.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <div
      className="p-4 border"
      style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
    >
      <p className="text-sm mb-4 leading-relaxed" style={{ color: "#F0F5FF" }}>
        {note.content}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5" style={tagStyle}>
            {note.tag}
          </span>
          <span className="text-xs" style={{ color: "#8AABD4" }}>
            {note.author}
          </span>
          <span className="text-xs" style={{ color: "#1B3055" }}>·</span>
          <span className="text-xs" style={{ color: "#1B3055" }}>
            {date}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {prev && (
            <button
              onClick={() => onMove(note.id, prev)}
              title="Reculer"
              className="w-7 h-7 flex items-center justify-center text-xs transition-colors"
              style={{ color: "#8AABD4" }}
            >
              ←
            </button>
          )}
          {next && (
            <button
              onClick={() => onMove(note.id, next)}
              title="Avancer"
              className="w-7 h-7 flex items-center justify-center text-xs transition-colors"
              style={{ color: "#6B9FEE" }}
            >
              →
            </button>
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
  );
}
