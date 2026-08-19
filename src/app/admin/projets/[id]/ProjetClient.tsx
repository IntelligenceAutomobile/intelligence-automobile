"use client";

// Intérieur d'un projet : le fil des propositions, la plus récente en haut.
// Chaque proposition porte un pouce d'ensemble, un pouce par visuel quand il y
// en a plusieurs, et ses commentaires. Le badge « En attente de retour » tombe
// dès que quelqu'un d'autre que l'auteur a réagi ou commenté.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, ThumbsUp, ThumbsDown, Trash2, Pencil } from "lucide-react";
import { T, AdminPage, fieldStyle, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { ConfirmDialog } from "@/app/admin/confirm";
import { parseAttachments, type Attachment } from "@/lib/collab-attachments";
import { useAttachments, AttachBar, AttachPreviews, FileChips } from "../attachments";
import { STATUS_META, STATUS_ORDER, attendRetour, fmtDate, fmtDateLong, type Projet, type Proposition, type Reaction } from "../shared";

export default function ProjetClient({ projetId, authorName }: { projetId: string; authorName: string }) {
  const router = useRouter();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Composer d'une nouvelle proposition
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const att = useAttachments();
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");

  // En-tête : édition du titre/description, suppression du projet
  const [editingHead, setEditingHead] = useState(false);
  const [headTitle, setHeadTitle] = useState("");
  const [headDescription, setHeadDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Visionneuse plein écran
  const [overlay, setOverlay] = useState<{ urls: string[]; index: number } | null>(null);

  const fetchProjet = useCallback(async () => {
    const res = await fetch(`/api/collab/projets/${projetId}`);
    if (res.ok) setProjet(await res.json());
    else if (res.status === 404) setNotFound(true);
    setLoading(false);
  }, [projetId]);

  useEffect(() => { fetchProjet(); }, [fetchProjet]);

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

  async function addProposition(e: React.FormEvent) {
    e.preventDefault();
    if (adding) return;
    if (!content.trim() && att.pending.length === 0) return;
    setAdding(true);
    setFormError("");
    try {
      const attachments = await att.uploadAll();
      if (att.pending.length > 0 && attachments.length === 0 && !content.trim()) {
        setFormError("L'envoi des visuels a échoué. Réessayez dans un instant.");
        return;
      }
      const res = await fetch(`/api/collab/projets/${projetId}/propositions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, attachments }),
      });
      if (res.ok) {
        const proposition = await res.json();
        setProjet(prev => prev && { ...prev, propositions: [proposition, ...prev.propositions] });
        setTitle("");
        setContent("");
        att.clear();
        setComposerOpen(false);
      } else {
        setFormError("L'ajout a échoué. Réessayez dans un instant.");
      }
    } catch {
      setFormError("La connexion a coupé. Réessayez dans un instant.");
    } finally {
      setAdding(false);
    }
  }

  function patchProposition(id: string, next: Partial<Proposition>) {
    setProjet(prev => prev && {
      ...prev,
      propositions: prev.propositions.map(p => p.id === id ? { ...p, ...next } : p),
    });
  }

  async function react(propositionId: string, imageUrl: string, value: 1 | -1 | 0) {
    const res = await fetch(`/api/collab/propositions/${propositionId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, value }),
    });
    if (res.ok) {
      const reactions: Reaction[] = await res.json();
      patchProposition(propositionId, { reactions });
    }
  }

  async function addComment(propositionId: string, text: string): Promise<boolean> {
    const res = await fetch(`/api/collab/propositions/${propositionId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!res.ok) return false;
    const comment = await res.json();
    setProjet(prev => prev && {
      ...prev,
      propositions: prev.propositions.map(p =>
        p.id === propositionId ? { ...p, comments: [...p.comments, comment] } : p
      ),
    });
    return true;
  }

  async function deleteComment(propositionId: string, commentId: string) {
    setProjet(prev => prev && {
      ...prev,
      propositions: prev.propositions.map(p =>
        p.id === propositionId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p
      ),
    });
    await fetch(`/api/collab/proposition-comments/${commentId}`, { method: "DELETE" });
  }

  async function editProposition(id: string, data: { title: string; content: string }) {
    patchProposition(id, data);
    await fetch(`/api/collab/propositions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function deleteProposition(id: string) {
    setProjet(prev => prev && { ...prev, propositions: prev.propositions.filter(p => p.id !== id) });
    await fetch(`/api/collab/propositions/${id}`, { method: "DELETE" });
  }

  async function changeStatus(status: string) {
    if (!projet) return;
    setProjet({ ...projet, status });
    await fetch(`/api/collab/projets/${projetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function startEditHead() {
    if (!projet) return;
    setHeadTitle(projet.title);
    setHeadDescription(projet.description);
    setEditingHead(true);
  }

  async function saveHead() {
    if (!projet || !headTitle.trim()) return;
    const data = { title: headTitle.trim(), description: headDescription.trim() };
    setProjet({ ...projet, ...data });
    setEditingHead(false);
    await fetch(`/api/collab/projets/${projetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function deleteProjet() {
    setDeleting(true);
    const res = await fetch(`/api/collab/projets/${projetId}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/projets");
    else setDeleting(false);
  }

  if (loading) {
    return (
      <AdminPage width="narrow">
        <div className="text-sm text-center py-16" style={{ color: T.border }}>Chargement...</div>
      </AdminPage>
    );
  }

  if (notFound || !projet) {
    return (
      <AdminPage width="narrow">
        <p className="text-sm" style={{ color: T.textDim }}>Ce projet est introuvable : il a pu être supprimé.</p>
        <Link href="/admin/projets" className="inline-flex items-center gap-2 mt-4 text-sm" style={{ color: T.accent }}>
          <ArrowLeft size={14} /> Retour aux projets
        </Link>
      </AdminPage>
    );
  }

  const meta = STATUS_META[projet.status] ?? STATUS_META.en_cours;
  const pending = projet.propositions.filter(attendRetour).length;

  return (
    <AdminPage width="narrow">
      {/* ── En-tête du projet ── */}
      <Link href="/admin/projets" className="inline-flex items-center gap-2 text-xs mb-5" style={{ color: T.muted }}>
        <ArrowLeft size={13} /> Tous les projets
      </Link>

      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: meta.color }} className="mb-3" />
        {editingHead ? (
          <div className="space-y-3">
            <input
              value={headTitle}
              onChange={e => setHeadTitle(e.target.value)}
              autoFocus
              className="px-4 py-3 text-sm"
              style={fieldStyle}
            />
            <textarea
              value={headDescription}
              onChange={e => setHeadDescription(e.target.value)}
              rows={2}
              placeholder="Description (facultatif)"
              className="px-4 py-3 text-sm resize-none"
              style={fieldStyle}
            />
            <div className="flex items-center gap-3">
              <button onClick={saveHead} disabled={!headTitle.trim()} className={btnPrimaryClass} style={btnPrimaryStyle}>Sauvegarder</button>
              <button onClick={() => setEditingHead(false)} className={btnGhostClass} style={btnGhostStyle}>Annuler</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-light min-w-0" style={{ color: T.text, letterSpacing: "-0.01em" }}>
                {projet.title}
              </h1>
              <button
                type="button"
                onClick={startEditHead}
                title="Modifier le titre et la description"
                className="w-7 h-7 flex items-center justify-center"
                style={{ color: T.muted }}
                onMouseEnter={e => (e.currentTarget.style.color = T.textHover)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Supprimer le projet"
                className="w-7 h-7 flex items-center justify-center"
                style={{ color: T.muted }}
                onMouseEnter={e => (e.currentTarget.style.color = T.danger)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >
                <Trash2 size={13} />
              </button>
            </div>
            {projet.description && (
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: T.muted, whiteSpace: "pre-wrap" }}>{projet.description}</p>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {STATUS_ORDER.map(s => {
            const m = STATUS_META[s];
            const active = projet.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => changeStatus(s)}
                className="px-3 py-1.5 text-xs whitespace-nowrap"
                style={{
                  borderRadius: "999px",
                  border: `1px solid ${active ? m.color : T.border}`,
                  backgroundColor: active ? m.bg : "transparent",
                  color: active ? m.color : T.muted,
                }}
              >
                {m.label}
              </button>
            );
          })}
          {pending > 0 && (
            <span
              className="ml-auto px-2 py-1 text-xs"
              style={{ backgroundColor: "rgba(240,180,90,0.10)", border: "1px solid rgba(240,180,90,0.38)", color: T.warning }}
            >
              {pending === 1 ? "1 proposition attend un retour" : `${pending} propositions attendent un retour`}
            </span>
          )}
        </div>
      </div>

      {/* ── Nouvelle proposition ── */}
      {composerOpen ? (
        <form
          onSubmit={addProposition}
          className="mb-8 p-4 space-y-3"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        >
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de la proposition (facultatif) : Flyer piste 1, Mailing acheteurs…"
            className="px-4 py-3 text-sm"
            style={fieldStyle}
          />
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); if (formError) setFormError(""); }}
            placeholder="Votre proposition : le texte de l'article, du mailing, ou un mot sur les visuels joints…"
            rows={5}
            autoFocus
            className="px-4 py-3 text-sm resize-y"
            style={fieldStyle}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addProposition(e as unknown as React.FormEvent); }}
          />
          <AttachPreviews att={att} />
          {formError && <p className="text-xs" style={{ color: T.danger }}>{formError}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <AttachBar att={att} />
            <div className="flex-1" />
            <button type="button" onClick={() => { setComposerOpen(false); setFormError(""); }} className={btnGhostClass} style={btnGhostStyle}>
              Annuler
            </button>
            <button
              type="submit"
              disabled={adding || (!content.trim() && att.pending.length === 0)}
              className={btnPrimaryClass}
              style={btnPrimaryStyle}
            >
              {adding ? "Envoi…" : "Publier la proposition"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="w-full mb-8 py-4 border border-dashed flex items-center justify-center gap-2 text-sm transition-colors"
          style={{ borderColor: T.border, color: T.muted }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6B9FEE"; e.currentTarget.style.color = T.textHover; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        >
          <Plus size={15} />
          Nouvelle proposition : un texte, des visuels, ou les deux
        </button>
      )}

      {/* ── Fil des propositions ── */}
      {projet.propositions.length === 0 ? (
        <div className="py-14 px-6 text-center border border-dashed" style={{ borderColor: T.border }}>
          <p className="text-sm mb-1.5" style={{ color: T.textDim }}>Ce projet attend sa première proposition.</p>
          <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: T.muted }}>
            Déposez un texte, un ou plusieurs visuels : l&apos;autre donne son avis d&apos;un
            pouce, visuel par visuel, et précise sa pensée en commentaire.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {projet.propositions.map(p => (
            <PropositionCard
              key={p.id}
              proposition={p}
              authorName={authorName}
              onReact={react}
              onComment={addComment}
              onDeleteComment={deleteComment}
              onEdit={editProposition}
              onDelete={deleteProposition}
              onOpenImage={(urls, index) => setOverlay({ urls, index })}
            />
          ))}
        </div>
      )}

      {/* ── Visionneuse plein écran ── */}
      {overlay && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ backgroundColor: "rgba(4,11,22,0.92)" }}
          onClick={() => setOverlay(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={overlay.urls[overlay.index]}
            alt="visuel en grand"
            className="max-w-[94vw] max-h-[88vh] object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Fermer"
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-lg"
            style={{ color: "#C8D8EE" }}
            onClick={() => setOverlay(null)}
          >
            ✕
          </button>
          {overlay.urls.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Visuel précédent"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-xl"
                style={{ color: "#C8D8EE", backgroundColor: "rgba(11,25,48,0.6)" }}
                onClick={e => { e.stopPropagation(); setOverlay(o => o && { ...o, index: (o.index - 1 + o.urls.length) % o.urls.length }); }}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Visuel suivant"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-xl"
                style={{ color: "#C8D8EE", backgroundColor: "rgba(11,25,48,0.6)" }}
                onClick={e => { e.stopPropagation(); setOverlay(o => o && { ...o, index: (o.index + 1) % o.urls.length }); }}
              >
                ›
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs" style={{ color: "#C8D8EE" }}>
                {overlay.index + 1} / {overlay.urls.length}
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce projet ?"
        description={`« ${projet.title} » et toutes ses propositions disparaîtront des écrans.`}
        busy={deleting}
        onConfirm={deleteProjet}
        onCancel={() => setConfirmDelete(false)}
      />
    </AdminPage>
  );
}

/* ─── Carte d'une proposition ──────────────────────────── */

function PropositionCard({ proposition: p, authorName, onReact, onComment, onDeleteComment, onEdit, onDelete, onOpenImage }: {
  proposition: Proposition;
  authorName: string;
  onReact: (propositionId: string, imageUrl: string, value: 1 | -1 | 0) => void;
  onComment: (propositionId: string, text: string) => Promise<boolean>;
  onDeleteComment: (propositionId: string, commentId: string) => void;
  onEdit: (id: string, data: { title: string; content: string }) => void;
  onDelete: (id: string) => void;
  onOpenImage: (urls: string[], index: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(p.title);
  const [editContent, setEditContent] = useState(p.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  const attachments = parseAttachments(p.attachments);
  const images = attachments.filter(a => a.kind === "image");
  const files = attachments.filter(a => a.kind === "file");
  const imageUrls = images.map(a => a.url);

  const waiting = attendRetour(p);
  const globalReactions = p.reactions.filter(r => r.imageUrl === "");

  function startEdit() {
    setEditTitle(p.title);
    setEditContent(p.content);
    setIsEditing(true);
  }
  function saveEdit() {
    onEdit(p.id, { title: editTitle.trim(), content: editContent.trim() });
    setIsEditing(false);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await onComment(p.id, text);
    if (ok) setCommentText("");
    setSending(false);
  }

  return (
    <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
      {/* En-tête : auteur, date, badge de retour, actions */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
        <span className="text-xs font-medium" style={{ color: T.textDim }}>{p.author}</span>
        <span className="text-xs" style={{ color: T.border }}>·</span>
        <span className="text-xs" style={{ color: T.muted }} title={fmtDateLong(p.createdAt)}>{fmtDate(p.createdAt)}</span>
        <span
          className="text-[10px] tracking-[0.12em] uppercase px-2 py-0.5"
          style={waiting
            ? { backgroundColor: "rgba(240,180,90,0.10)", border: "1px solid rgba(240,180,90,0.38)", color: T.warning }
            : { backgroundColor: "rgba(78,209,161,0.10)", border: "1px solid rgba(78,209,161,0.40)", color: T.success }}
        >
          {waiting ? "En attente de retour" : "Retour donné"}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          {confirmDelete ? (
            <>
              <span className="text-xs mr-1" style={{ color: T.textDim }}>Supprimer ?</span>
              <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-0.5 border" style={{ color: T.textDim, borderColor: T.border }}>Non</button>
              <button onClick={() => { setConfirmDelete(false); onDelete(p.id); }} className="text-xs px-2 py-0.5 border" style={{ color: "#E5635A", borderColor: "#3A1B1B" }}>Oui</button>
            </>
          ) : (
            <>
              {p.author === authorName && (
                <button
                  onClick={startEdit}
                  title="Modifier la proposition"
                  className="w-7 h-7 flex items-center justify-center"
                  style={{ color: T.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.textHover)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                >
                  <Pencil size={12} />
                </button>
              )}
              <button
                onClick={() => setConfirmDelete(true)}
                title="Supprimer la proposition"
                className="w-7 h-7 flex items-center justify-center"
                style={{ color: T.muted }}
                onMouseEnter={e => (e.currentTarget.style.color = T.danger)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 pb-4 pt-3 space-y-3">
        {isEditing ? (
          <div className="space-y-2">
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Titre (facultatif)"
              className="px-3 py-2 text-sm"
              style={fieldStyle}
            />
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={5}
              autoFocus
              className="px-3 py-2 text-sm resize-y"
              style={fieldStyle}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <div className="flex items-center gap-2">
              <button onClick={saveEdit} className="text-xs px-3 py-1.5 font-semibold tracking-widest uppercase" style={{ backgroundColor: T.accent, color: T.bg }}>Sauvegarder</button>
              <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1.5" style={{ color: T.textDim }}>Annuler</button>
            </div>
          </div>
        ) : (
          <>
            {p.title && <h3 className="text-sm font-medium" style={{ color: T.text }}>{p.title}</h3>}
            {p.content && (
              <p className="text-sm leading-relaxed" style={{ color: T.textDim, whiteSpace: "pre-wrap" }}>{p.content}</p>
            )}
          </>
        )}

        {/* Visuels : en grand, chacun son pouce quand il y en a plusieurs */}
        {images.length > 0 && (
          <div className={images.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
            {images.map((img, i) => (
              <ImageBlock
                key={img.url}
                image={img}
                index={i}
                showOwnThumbs={images.length > 1}
                reactions={p.reactions.filter(r => r.imageUrl === img.url)}
                authorName={authorName}
                onOpen={() => onOpenImage(imageUrls, i)}
                onReact={(value) => onReact(p.id, img.url, value)}
              />
            ))}
          </div>
        )}

        <FileChips files={files} />

        {/* Pouce d'ensemble */}
        <ReactionBar
          reactions={globalReactions}
          authorName={authorName}
          label={images.length > 1 ? "La proposition dans son ensemble :" : ""}
          onReact={(value) => onReact(p.id, "", value)}
        />

        {/* Commentaires */}
        {p.comments.length > 0 && (
          <div className="space-y-2 pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
            {p.comments.map(c => (
              <div key={c.id} className="flex items-start gap-2 pt-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: T.textDim }}>{c.author}</span>
                    <span className="text-[11px]" style={{ color: T.muted }}>{fmtDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-0.5 leading-relaxed" style={{ color: T.textDim, whiteSpace: "pre-wrap" }}>{c.content}</p>
                </div>
                {c.author === authorName && (
                  <button
                    onClick={() => onDeleteComment(p.id, c.id)}
                    title="Supprimer le commentaire"
                    className="w-6 h-6 flex items-center justify-center text-xs flex-shrink-0"
                    style={{ color: T.border }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.danger)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.border)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submitComment} className="flex items-end gap-2">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Votre commentaire…"
            rows={1}
            className="flex-1 px-3 py-2 text-sm resize-none"
            style={fieldStyle}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(e as unknown as React.FormEvent); } }}
          />
          <button
            type="submit"
            disabled={sending || !commentText.trim()}
            className="px-4 py-2 text-xs font-semibold tracking-widest uppercase disabled:opacity-40 flex-shrink-0"
            style={{ backgroundColor: T.accent, color: T.bg }}
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Un visuel et son pouce ───────────────────────────── */

function ImageBlock({ image, index, showOwnThumbs, reactions, authorName, onOpen, onReact }: {
  image: Attachment;
  index: number;
  showOwnThumbs: boolean;
  reactions: Reaction[];
  authorName: string;
  onOpen: () => void;
  onReact: (value: 1 | -1 | 0) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onOpen}
        title="Voir en plein écran"
        className="block w-full border overflow-hidden"
        style={{ borderColor: T.border, backgroundColor: T.float }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={`visuel ${index + 1}`}
          loading="lazy"
          className="w-full object-contain"
          style={{ maxHeight: showOwnThumbs ? 320 : 460 }}
        />
      </button>
      {showOwnThumbs && (
        <div className="mt-1.5">
          <ReactionBar reactions={reactions} authorName={authorName} compact onReact={onReact} />
        </div>
      )}
    </div>
  );
}

/* ─── Barre de pouces (j'aime / j'aime pas) ────────────── */

function ReactionBar({ reactions, authorName, onReact, label = "", compact = false }: {
  reactions: Reaction[];
  authorName: string;
  onReact: (value: 1 | -1 | 0) => void;
  label?: string;
  compact?: boolean;
}) {
  const likes = reactions.filter(r => r.value === 1);
  const dislikes = reactions.filter(r => r.value === -1);
  const mine = reactions.find(r => r.author === authorName)?.value ?? 0;

  function press(value: 1 | -1) {
    // Recliquer sur son propre pouce le retire.
    onReact(mine === value ? 0 : value);
  }

  const btnBase = `inline-flex items-center gap-1.5 border ${compact ? "px-2 py-1" : "px-3 py-1.5"} text-xs transition-colors`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="text-xs" style={{ color: T.muted }}>{label}</span>}
      <button
        type="button"
        onClick={() => press(1)}
        title={mine === 1 ? "Retirer mon pouce" : "J'aime"}
        className={btnBase}
        style={mine === 1
          ? { borderColor: "rgba(78,209,161,0.55)", backgroundColor: "rgba(78,209,161,0.12)", color: T.success }
          : { borderColor: T.border, color: T.muted }}
      >
        <ThumbsUp size={13} />
        {likes.length > 0 && <span>{likes.map(r => r.author).join(", ")}</span>}
      </button>
      <button
        type="button"
        onClick={() => press(-1)}
        title={mine === -1 ? "Retirer mon pouce" : "J'aime pas"}
        className={btnBase}
        style={mine === -1
          ? { borderColor: "rgba(255,107,53,0.5)", backgroundColor: "rgba(255,107,53,0.10)", color: T.danger }
          : { borderColor: T.border, color: T.muted }}
      >
        <ThumbsDown size={13} />
        {dislikes.length > 0 && <span>{dislikes.map(r => r.author).join(", ")}</span>}
      </button>
    </div>
  );
}
