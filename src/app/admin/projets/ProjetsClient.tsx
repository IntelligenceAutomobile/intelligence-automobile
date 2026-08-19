"use client";

// Liste des projets d'équipe : les chantiers de fond (blog signature, mailings,
// flyers…) avec, par projet, le nombre de propositions et surtout combien
// attendent encore un retour.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { T, AdminPage, PageHeader, fieldStyle, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "@/app/admin/ui";
import { STATUS_META, attendRetour, fmtDate, type ProjetLight } from "./shared";

export default function ProjetsClient({ authorName, autoCreate = false }: { authorName: string; autoCreate?: boolean }) {
  const [projets, setProjets] = useState<ProjetLight[]>([]);
  const [loading, setLoading] = useState(true);
  // La palette de commandes arrive avec ?nouveau=1 : le formulaire est déjà ouvert.
  const [creating, setCreating] = useState(autoCreate);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchProjets = useCallback(async () => {
    const res = await fetch("/api/collab/projets");
    if (res.ok) setProjets(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjets(); }, [fetchProjets]);

  async function createProjet(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/collab/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const projet = await res.json();
        setProjets(prev => [{ ...projet, propositions: [] }, ...prev]);
        setTitle("");
        setDescription("");
        setCreating(false);
      } else {
        setFormError("La création a échoué. Réessayez dans un instant.");
      }
    } catch {
      setFormError("La connexion a coupé. Réessayez dans un instant.");
    } finally {
      setSaving(false);
    }
  }

  async function changeName() {
    await fetch("/api/collab/identity", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <AdminPage>
      <PageHeader
        title="Projets"
        subtitle={
          <>
            Chantiers de fond suivis à deux : propositions, retours, décisions.
            <span className="ml-2" style={{ color: T.muted }}>
              Signé : {authorName}{" "}
              <button onClick={changeName} style={{ textDecoration: "underline" }}>changer</button>
            </span>
          </>
        }
        action={
          <button
            type="button"
            onClick={() => setCreating(v => !v)}
            className={btnPrimaryClass}
            style={btnPrimaryStyle}
          >
            <Plus size={14} />
            Nouveau projet
          </button>
        }
      />

      {/* ── Création d'un projet ── */}
      {creating && (
        <form
          onSubmit={createProjet}
          className="mb-6 p-4 space-y-3"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        >
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); if (formError) setFormError(""); }}
            placeholder="Titre du projet : Blog signature, Mailings prospects…"
            autoFocus
            className="px-4 py-3 text-sm"
            style={fieldStyle}
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="En une ou deux phrases : de quoi il s'agit, ce qu'on attend l'un de l'autre. (facultatif)"
            rows={2}
            className="px-4 py-3 text-sm resize-none"
            style={fieldStyle}
          />
          {formError && <p className="text-xs" style={{ color: T.danger }}>{formError}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !title.trim()} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {saving ? "Création…" : "Créer le projet"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className={btnGhostClass} style={btnGhostStyle}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* ── Grille des projets ── */}
      {loading ? (
        <div className="text-sm text-center py-16" style={{ color: T.border }}>Chargement...</div>
      ) : projets.length === 0 ? (
        <div className="py-14 px-6 text-center border border-dashed" style={{ borderColor: T.border }}>
          <FolderKanban size={22} className="mx-auto mb-3" style={{ color: T.muted }} />
          <p className="text-sm mb-1.5" style={{ color: T.textDim }}>Votre premier projet démarre ici.</p>
          <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: T.muted }}>
            Un projet est un chantier qui dure : blog signature, mailings types, flyers,
            cartes de visite. Vous y déposez vos propositions au fil des jours, l&apos;autre
            donne son avis d&apos;un pouce et d&apos;un commentaire.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {projets.map(projet => {
            const meta = STATUS_META[projet.status] ?? STATUS_META.en_cours;
            const total = projet.propositions.length;
            const pending = projet.propositions.filter(attendRetour).length;
            return (
              <Link
                key={projet.id}
                href={`/admin/projets/${projet.id}`}
                className="block p-5 transition-all duration-200 hover:-translate-y-px hover:border-[#6B9FEE]"
                style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${meta.color}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-medium leading-snug min-w-0" style={{ color: T.text }}>
                    {projet.title}
                  </h2>
                  <span
                    className="inline-block text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 whitespace-nowrap flex-shrink-0"
                    style={{ backgroundColor: meta.bg, border: `1px solid ${meta.bd}`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>
                {projet.description && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: T.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {projet.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 text-xs" style={{ color: T.muted }}>
                  <span>{total === 0 ? "Aucune proposition" : total === 1 ? "1 proposition" : `${total} propositions`}</span>
                  {pending > 0 && (
                    <span
                      className="px-2 py-0.5"
                      style={{ backgroundColor: "rgba(240,180,90,0.10)", border: "1px solid rgba(240,180,90,0.38)", color: T.warning }}
                    >
                      {pending === 1 ? "1 en attente de retour" : `${pending} en attente de retour`}
                    </span>
                  )}
                  <span className="ml-auto">Activité : {fmtDate(projet.updatedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
