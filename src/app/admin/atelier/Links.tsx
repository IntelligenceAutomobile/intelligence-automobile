"use client";

// Espace « Liens » de l'atelier : bibliothèque durable de liens utiles
// (concurrents, idées, inspiration, outils). Une seule colonne centrale,
// classée par mois, avec aperçu du site, note signée, recherche et étiquettes.
// Volontairement distinct des tableaux de tâches : ici tout reste, rien ne
// « s'avance » ni ne se termine.

import { useState, useEffect, useCallback } from "react";
import { LINK_TAGS } from "@/lib/collab-links";

export const LINKS_COLOR = "#5AC8E8";

export interface CollabLink {
  id: string;
  url: string;
  note: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string | null;
  siteName: string;
  domain: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

const TAG_META: Record<string, { label: string; color: string; bg: string }> = {
  concurrent:  { label: "Concurrent",  color: "#E5635A", bg: "#3A1B1B" },
  idée:        { label: "Idée",        color: "#F0A55A", bg: "#3A2F1B" },
  inspiration: { label: "Inspiration", color: "#A78BFA", bg: "#251B3A" },
  outil:       { label: "Outil",       color: "#4EB87B", bg: "#1B3A2C" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Repli des accents et de la casse, pour que la recherche accepte les deux
// écritures : « vehicules » retrouve « Véhicules d'occasion ».
function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

// Un lien passe-t-il la recherche et l'étiquette en cours ? `q` arrive déjà replié.
function matches(link: CollabLink, q: string, filterTag: string): boolean {
  if (filterTag && link.tag !== filterTag) return false;
  if (!q) return true;
  return [link.title, link.note, link.domain, link.url, link.siteName, link.description]
    .some(field => field && fold(field).includes(q));
}

export default function LinksView({ onCount }: { onCount: (n: number) => void }) {
  const [links, setLinks]         = useState<CollabLink[]>([]);
  const [loading, setLoading]     = useState(true);
  const [url, setUrl]             = useState("");
  const [note, setNote]           = useState("");
  const [tag, setTag]             = useState("");
  const [adding, setAdding]       = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch]       = useState("");
  const [filterTag, setFilterTag] = useState("");

  // Le compteur de la barre latérale suit chaque changement de la liste
  // (chargement, ajout, suppression). La liste neuve est calculée d'abord,
  // puis posée dans les deux états : le parent reste juste, et sa mise à jour
  // part d'un gestionnaire plutôt que d'un rendu en cours.
  const applyLinks = useCallback((next: CollabLink[]) => {
    setLinks(next);
    onCount(next.length);
  }, [onCount]);

  const fetchLinks = useCallback(async () => {
    const res = await fetch("/api/collab/links");
    if (res.ok) applyLinks(await res.json());
    setLoading(false);
  }, [applyLinks]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || adding) return;
    setAdding(true);
    setFormError("");

    // Une coupure réseau fait échouer l'appel : le « finally » rend la main,
    // sinon le bouton restait sur « Aperçu en cours… » jusqu'au rechargement.
    try {
      const res = await fetch("/api/collab/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, note, tag }),
      });

      if (res.ok) {
        const link = await res.json();
        applyLinks([link, ...links]);
        setUrl("");
        setNote("");
        setTag("");
        // Une recherche ou une étiquette active masquerait le lien qui vient
        // d'être ajouté : les filtres s'effacent alors pour le laisser voir.
        if (!matches(link, q, filterTag)) {
          setSearch("");
          setFilterTag("");
        }
      } else if (res.status === 400) {
        setFormError("Adresse invalide. Vérifiez le lien et réessayez.");
      } else {
        setFormError("L'ajout a échoué. Réessayez dans un instant.");
      }
    } catch {
      setFormError("La connexion a coupé. Réessayez dans un instant.");
    } finally {
      setAdding(false);
    }
  }

  async function editLink(id: string, data: { note: string; tag: string }) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    await fetch(`/api/collab/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function deleteLink(id: string) {
    applyLinks(links.filter(l => l.id !== id));
    await fetch(`/api/collab/links/${id}`, { method: "DELETE" });
  }

  // ── Filtres : recherche plein texte + étiquette ──
  const q = fold(search);
  const visible = links.filter(l => matches(l, q, filterTag));

  // ── Regroupement par mois d'ajout, du plus récent au plus ancien ──
  type Group = { key: string; label: string; items: CollabLink[] };
  const groups: Group[] = [];
  const byKey = new Map<string, Group>();
  [...visible]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach(link => {
      const d = new Date(link.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let group = byKey.get(key);
      if (!group) {
        const raw = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
        group = { key, label: raw.charAt(0).toUpperCase() + raw.slice(1), items: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      group.items.push(link);
    });

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>

      {/* ── Ajout d'un lien ── */}
      <form onSubmit={addLink} className="mb-6 border" style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}>
        <div className="p-4 space-y-3">
          <input
            value={url}
            onChange={e => { setUrl(e.target.value); if (formError) setFormError(""); }}
            placeholder="Collez l'adresse du site : https://…"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            className="w-full px-4 py-3 border text-sm outline-none"
            style={{ backgroundColor: "#0B1930", borderColor: formError ? "#E5635A" : "#1B3055", color: "#F0F5FF" }}
          />
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Votre note : pourquoi ce lien est intéressant…"
            rows={2}
            className="w-full px-4 py-3 border text-sm outline-none resize-none"
            style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addLink(e as unknown as React.FormEvent); }}
          />
          {formError && <p className="text-xs" style={{ color: "#E5635A" }}>{formError}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 pb-4">
          <select
            value={tag}
            onChange={e => setTag(e.target.value)}
            className="px-3 py-2 border text-xs outline-none"
            style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: TAG_META[tag]?.color ?? "#C8D8EE" }}
          >
            <option value="">Sans étiquette</option>
            {LINK_TAGS.map(t => <option key={t} value={t}>{TAG_META[t].label}</option>)}
          </select>
          <div className="flex-1" />
          <button
            type="submit"
            disabled={adding || !url.trim()}
            className="px-6 py-2 text-xs font-semibold tracking-widest uppercase disabled:opacity-40"
            style={{ backgroundColor: LINKS_COLOR, color: "#0B1930" }}
          >
            {adding ? "Aperçu en cours…" : "Ajouter"}
          </button>
        </div>
      </form>

      {/* ── Recherche + filtre par étiquette ── */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher : titre, note, site…"
          className="flex-1 px-3 py-2 border text-xs outline-none"
          style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF", minWidth: "180px" }}
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterChip label="Tous" color="#C8D8EE" active={filterTag === ""} onClick={() => setFilterTag("")} />
          {LINK_TAGS.map(t => (
            <FilterChip
              key={t}
              label={TAG_META[t].label}
              color={TAG_META[t].color}
              active={filterTag === t}
              onClick={() => setFilterTag(filterTag === t ? "" : t)}
            />
          ))}
        </div>
      </div>

      {/* ── Fil des liens, par mois ── */}
      {loading ? (
        <div className="text-sm text-center py-16" style={{ color: "#1B3055" }}>Chargement...</div>
      ) : links.length === 0 ? (
        <div className="py-14 px-6 text-center border border-dashed" style={{ borderColor: "#1B3055" }}>
          <div className="mb-3" style={{ fontSize: "22px" }}>🔗</div>
          <p className="text-sm mb-1.5" style={{ color: "#C8D8EE" }}>Votre bibliothèque de liens démarre ici.</p>
          <p className="text-xs leading-relaxed" style={{ color: "#7C92B5" }}>
            Collez une adresse ci-dessus : un concurrent à surveiller, une idée pour le site,
            un outil à retenir. Chaque lien garde sa note et reste classé par mois.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-14 px-6 text-center border border-dashed" style={{ borderColor: "#1B3055" }}>
          <p className="text-xs" style={{ color: "#7C92B5" }}>
            Modifiez la recherche ou l&apos;étiquette pour retrouver vos liens.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group.key}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs tracking-widest uppercase" style={{ color: "#C8D8EE" }}>{group.label}</span>
                <span className="text-xs px-2 py-0.5" style={{ backgroundColor: "#1B3055", color: LINKS_COLOR }}>{group.items.length}</span>
              </div>
              <div className="space-y-3">
                {group.items.map(link => (
                  <LinkCard key={link.id} link={link} onEdit={editLink} onDelete={deleteLink} onFilterTag={setFilterTag} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Pastille de filtre ───────────────────────────────── */

function FilterChip({ label, color, active, onClick }: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 whitespace-nowrap"
      style={{
        fontSize: "12px",
        borderRadius: "999px",
        border: `1px solid ${active ? color : "#1B3055"}`,
        backgroundColor: active ? "#112240" : "transparent",
        color: active ? color : "#7C92B5",
      }}
    >
      {label}
    </button>
  );
}

/* ─── Carte d'un lien ──────────────────────────────────── */

function LinkCard({ link, onEdit, onDelete, onFilterTag }: {
  link: CollabLink;
  onEdit: (id: string, data: { note: string; tag: string }) => void;
  onDelete: (id: string) => void;
  onFilterTag: (tag: string) => void;
}) {
  const [isEditing, setIsEditing]         = useState(false);
  const [editNote, setEditNote]           = useState(link.note);
  const [editTag, setEditTag]             = useState(link.tag);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgOk, setImgOk]                 = useState(true);
  const [favOk, setFavOk]                 = useState(true);

  const tagMeta = TAG_META[link.tag];
  const edgeColor = tagMeta?.color ?? LINKS_COLOR;
  const displayTitle = link.title || link.siteName || link.domain || link.url;
  const showThumb = Boolean(link.imageUrl) && imgOk;
  // Les grands sites d'annonces servent une page vide aux robots : ils arrivent
  // ici avec le seul domaine. La ligne du dessous répéterait alors le titre.
  const hasRealTitle = Boolean(link.title || link.siteName);
  // L'emblème vient du site lui-même : les grands sites d'annonces le servent
  // même quand ils refusent leur page aux robots, et la liste des sites
  // consultés reste dans la maison. L'initiale du domaine prend le relais.
  const faviconSrc = link.domain ? `https://${link.domain}/favicon.ico` : "";
  const showFavicon = Boolean(faviconSrc) && favOk;

  function startEdit() {
    setEditNote(link.note);
    setEditTag(link.tag);
    setIsEditing(true);
  }
  async function saveEdit() {
    await onEdit(link.id, { note: editNote.trim(), tag: editTag });
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col sm:flex-row" style={{ backgroundColor: "#112240", border: "1px solid #1B3055", borderLeft: `3px solid ${edgeColor}` }}>

      {/* Vignette : l'image du site, ou son emblème quand l'aperçu manque.
          Toutes les cartes gardent ainsi la même silhouette dans la colonne. */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ouvrir ${displayTitle}`}
        title={`Ouvrir ${displayTitle}`}
        className="relative flex items-center justify-center flex-shrink-0 sm:w-[200px] border-b sm:border-b-0 sm:border-r overflow-hidden"
        style={{ borderColor: "#1B3055", backgroundColor: "#0B1930" }}
      >
        {showThumb ? (
          <img
            src={link.imageUrl!}
            alt=""
            className="w-full h-40 sm:absolute sm:inset-0 sm:h-full object-cover"
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="w-full h-24 sm:h-full sm:absolute sm:inset-0 flex items-center justify-center">
            {showFavicon ? (
              <img
                src={faviconSrc}
                alt=""
                width={34}
                height={34}
                style={{ borderRadius: "4px", opacity: 0.92 }}
                loading="lazy"
                onError={() => setFavOk(false)}
              />
            ) : (
              <span style={{ fontSize: "26px", color: "#1B3055", fontWeight: 300 }}>
                {(link.domain || link.url).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
      </a>

      <div className="flex-1 min-w-0 p-4">
        {/* Titre, cliquable vers le site */}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-medium leading-snug"
          style={{ color: "#F0F5FF" }}
          onMouseEnter={e => (e.currentTarget.style.color = LINKS_COLOR)}
          onMouseLeave={e => (e.currentTarget.style.color = "#F0F5FF")}
        >
          {displayTitle}
          <span className="ml-1.5" style={{ fontSize: "10px", color: "#7C92B5" }}>↗</span>
        </a>

        {/* Site d'origine, quand il apporte plus que le titre */}
        {hasRealTitle && (
          <div className="flex items-center gap-1.5 mt-1">
            {showFavicon && (
              <img
                src={faviconSrc}
                alt=""
                width={13}
                height={13}
                style={{ borderRadius: "2px" }}
                loading="lazy"
                onError={() => setFavOk(false)}
              />
            )}
            <span className="text-xs truncate" style={{ color: "#7C92B5" }}>
              {link.siteName && link.siteName.toLowerCase() !== link.domain.toLowerCase()
                ? `${link.siteName} · ${link.domain}`
                : link.domain || link.url}
            </span>
          </div>
        )}

        {/* Note de l'équipe (ou description du site en secours) */}
        {isEditing ? (
          <div className="mt-3">
            <textarea
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              autoFocus
              rows={3}
              placeholder="Votre note…"
              className="w-full px-3 py-2 border text-sm outline-none resize-none"
              style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: "#F0F5FF" }}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <select
                value={editTag}
                onChange={e => setEditTag(e.target.value)}
                className="px-2 py-1 border text-xs outline-none"
                style={{ backgroundColor: "#0B1930", borderColor: "#1B3055", color: TAG_META[editTag]?.color ?? "#C8D8EE" }}
              >
                <option value="">Sans étiquette</option>
                {LINK_TAGS.map(t => <option key={t} value={t}>{TAG_META[t].label}</option>)}
              </select>
              <div className="flex-1" />
              <button onClick={saveEdit} className="text-xs px-3 py-1 font-semibold tracking-widest uppercase" style={{ backgroundColor: LINKS_COLOR, color: "#0B1930" }}>Sauvegarder</button>
              <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1" style={{ color: "#C8D8EE" }}>Annuler</button>
            </div>
          </div>
        ) : link.note ? (
          <p className="text-sm mt-2.5 leading-relaxed" style={{ color: "#E7EFFC", whiteSpace: "pre-wrap" }}>{link.note}</p>
        ) : link.description ? (
          <p className="text-xs mt-2.5 leading-relaxed" style={{ color: "#7C92B5", fontStyle: "italic" }}>{link.description}</p>
        ) : null}

        {/* Étiquette, signature, date, actions */}
        {!isEditing && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              {tagMeta && (
                <button
                  type="button"
                  onClick={() => onFilterTag(link.tag)}
                  title={`Filtrer : ${tagMeta.label}`}
                  className="text-xs px-2 py-0.5"
                  style={{ backgroundColor: tagMeta.bg, color: tagMeta.color }}
                >
                  {tagMeta.label}
                </button>
              )}
              <span className="text-xs" style={{ color: "#C8D8EE" }}>{link.author}</span>
              <span className="text-xs" style={{ color: "#1B3055" }}>·</span>
              <span className="text-xs" style={{ color: "#7C92B5" }}>{fmtDate(link.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {confirmDelete ? (
                <>
                  <span className="text-xs mr-1" style={{ color: "#C8D8EE" }}>Supprimer ?</span>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-0.5 border" style={{ color: "#C8D8EE", borderColor: "#1B3055" }}>Non</button>
                  <button onClick={() => { setConfirmDelete(false); onDelete(link.id); }} className="text-xs px-2 py-0.5 border" style={{ color: "#E5635A", borderColor: "#3A1B1B" }}>Oui</button>
                </>
              ) : (
                <>
                  <button onClick={startEdit} title="Modifier la note" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#C8D8EE")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✎</button>
                  <button onClick={() => setConfirmDelete(true)} title="Supprimer le lien" className="w-7 h-7 flex items-center justify-center text-xs" style={{ color: "#1B3055" }} onMouseEnter={e => (e.currentTarget.style.color = "#E5635A")} onMouseLeave={e => (e.currentTarget.style.color = "#1B3055")}>✕</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
