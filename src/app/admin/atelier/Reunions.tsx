"use client";

// Section « Réunions » de l'atelier : les actions décidées en réunion, là où
// l'équipe travaille au quotidien. Les décisions et les comptes rendus restent
// dans le module Réunions ; ici on ne garde que ce qui reste à faire, et on le
// coche sur place.
//
// Volontairement dans le langage visuel de l'atelier (styles en ligne, palette
// #112240 / #1B3055) et pas dans celui du back-office : ce sont deux univers
// graphiques distincts, comme la vue Liens juste à côté.

import { useEffect, useState } from "react";
import Link from "next/link";
import { authorColor } from "@/lib/planning";
import { dueSentence, isOverdue, meetingTitle, shortDateFr, daysBetweenKeys } from "@/lib/reunions";

export const REUNIONS_COLOR = "#E5849B";

export interface MeetingAction {
  id: string;
  content: string;
  owner: string;
  dueDate: string;
  status: string;
  doneAt: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
}

// Jour civil à Paris, calculé côté navigateur : « fr-CA » écrit nativement en
// AAAA-MM-JJ, le format des dates de ce module.
function parisToday(): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Regroupement par urgence. « À planifier » ferme la marche : une action sans
// date attend, elle ne traîne pas.
type Bucket = { key: string; label: string; color: string; items: MeetingAction[] };

function bucketize(actions: MeetingAction[], today: string): Bucket[] {
  const late: MeetingAction[] = [];
  const week: MeetingAction[] = [];
  const later: MeetingAction[] = [];
  const undated: MeetingAction[] = [];

  for (const a of actions) {
    if (!a.dueDate) undated.push(a);
    else if (isOverdue(a.dueDate, today)) late.push(a);
    else if (daysBetweenKeys(today, a.dueDate) <= 7) week.push(a);
    else later.push(a);
  }

  return [
    { key: "late", label: "En retard", color: "#E5635A", items: late },
    { key: "week", label: "Cette semaine", color: "#F0A55A", items: week },
    { key: "later", label: "Plus tard", color: "#7C92B5", items: later },
    { key: "undated", label: "À planifier", color: "#7C92B5", items: undated },
  ].filter((b) => b.items.length > 0);
}

export default function ReunionsView({ onCount }: { onCount: (n: number) => void }) {
  const [actions, setActions] = useState<MeetingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [today] = useState(parisToday);

  // Chargement à l'ouverture de la section. Le drapeau d'abandon évite d'écrire
  // dans un composant démonté quand on change de rubrique pendant l'appel.
  useEffect(() => {
    let abandonne = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/reunions/actions");
        const data: MeetingAction[] = res.ok ? await res.json() : [];
        if (abandonne) return;
        setActions(data);
        onCount(data.filter((a) => a.status !== "fait").length);
      } catch {
        /* la section reste vide, l'atelier continue de tourner */
      } finally {
        if (!abandonne) setLoading(false);
      }
    })();
    return () => {
      abandonne = true;
    };
  }, [onCount]);

  // Cochage optimiste : l'écran suit le doigt, et revient en arrière si le
  // serveur refuse.
  async function toggle(a: MeetingAction) {
    const next = a.status === "fait" ? "a_faire" : "fait";
    setBusy(a.id);
    // La nouvelle liste se calcule HORS du setState : appeler onCount depuis la
    // fonction de mise à jour la faisait rejouer pendant le rendu, et React
    // refusait de toucher au compteur du parent depuis là (même correction que
    // la vue Liens juste à côté).
    const updated = actions.map((x) =>
      x.id === a.id ? { ...x, status: next, doneAt: next === "fait" ? today : "" } : x,
    );
    setActions(updated);
    onCount(updated.filter((x) => x.status !== "fait").length);
    try {
      const res = await fetch(`/api/admin/reunions/${a.meetingId}/items/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      const reverted = actions.map((x) => (x.id === a.id ? { ...x, status: a.status, doneAt: a.doneAt } : x));
      setActions(reverted);
      onCount(reverted.filter((x) => x.status !== "fait").length);
    } finally {
      setBusy(null);
    }
  }

  const open = actions.filter((a) => a.status !== "fait");
  const done = actions
    .filter((a) => a.status === "fait")
    .sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || ""));
  const buckets = bucketize(open, today);

  if (loading) {
    return <div style={{ color: "#7C92B5", fontSize: "13px" }}>Chargement…</div>;
  }

  if (actions.length === 0) {
    return (
      <div style={{ backgroundColor: "#112240", border: "1px solid #1B3055", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "26px", marginBottom: "10px" }}>🗓</div>
        <div style={{ color: "#C8D8EE", fontSize: "14px", marginBottom: "6px" }}>
          Les actions décidées en réunion arrivent ici.
        </div>
        <div style={{ color: "#7C92B5", fontSize: "12px", lineHeight: 1.6 }}>
          Notez-les dans une réunion, avec un responsable et une échéance :
          <br />
          elles remontent aussitôt dans cet espace, prêtes à être cochées.
        </div>
        <Link
          href="/admin/reunions"
          style={{ display: "inline-block", marginTop: "16px", fontSize: "12px", color: REUNIONS_COLOR, textDecoration: "underline" }}
        >
          Ouvrir les réunions
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "760px" }}>
      {open.length === 0 && (
        <div style={{ backgroundColor: "#112240", border: "1px solid #1B3055", padding: "24px", textAlign: "center", marginBottom: "18px" }}>
          <div style={{ fontSize: "22px", marginBottom: "8px" }}>✓</div>
          <div style={{ color: "#C8D8EE", fontSize: "14px" }}>Tout est soldé.</div>
        </div>
      )}

      {buckets.map((b) => (
        <div key={b.key} style={{ marginBottom: "22px" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: "8px" }}>
            <span style={{ color: b.color, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {b.label}
            </span>
            <span style={{ color: "#1B3055", fontSize: "11px" }}>{b.items.length}</span>
            <span style={{ flex: 1, height: "1px", backgroundColor: "#1B3055" }} />
          </div>

          {b.items.map((a) => (
            <ActionCard key={a.id} action={a} today={today} busy={busy === a.id} edge={b.color} onToggle={() => toggle(a)} />
          ))}
        </div>
      ))}

      {done.length > 0 && (
        <div style={{ marginTop: "26px", borderTop: "1px solid #1B3055", paddingTop: "14px" }}>
          <button
            onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-2"
            style={{ color: "#7C92B5", fontSize: "12px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#C8D8EE")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#7C92B5")}
          >
            <span style={{ fontSize: "10px" }}>{showDone ? "▾" : "▸"}</span>
            {done.length} action{done.length > 1 ? "s" : ""} déjà faite{done.length > 1 ? "s" : ""}
          </button>

          {showDone && (
            <div style={{ marginTop: "12px" }}>
              {done.map((a) => (
                <ActionCard key={a.id} action={a} today={today} busy={busy === a.id} edge="#1B3055" onToggle={() => toggle(a)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Une action ── */
function ActionCard({
  action,
  today,
  busy,
  edge,
  onToggle,
}: {
  action: MeetingAction;
  today: string;
  busy: boolean;
  edge: string;
  onToggle: () => void;
}) {
  const done = action.status === "fait";
  const late = !done && isOverdue(action.dueDate, today);

  return (
    <div
      className="flex items-start gap-3 p-3"
      style={{
        backgroundColor: "#112240",
        border: "1px solid #1B3055",
        borderLeft: `3px solid ${edge}`,
        marginBottom: "6px",
        opacity: busy ? 0.6 : 1,
      }}
    >
      <button
        onClick={onToggle}
        disabled={busy}
        title={done ? "Rouvrir cette action" : "Marquer faite"}
        aria-label={done ? `Rouvrir : ${action.content}` : `Marquer faite : ${action.content}`}
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: "18px",
          height: "18px",
          marginTop: "1px",
          border: `1px solid ${done ? "#4EB87B" : "#2C4B7C"}`,
          backgroundColor: done ? "#1B3A2C" : "transparent",
          color: done ? "#4EB87B" : "transparent",
          fontSize: "11px",
          lineHeight: 1,
        }}
        onMouseEnter={(e) => { if (!done) e.currentTarget.style.borderColor = "#4EB87B"; }}
        onMouseLeave={(e) => { if (!done) e.currentTarget.style.borderColor = "#2C4B7C"; }}
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <div
          style={{
            fontSize: "13.5px",
            color: done ? "#7C92B5" : "#F0F5FF",
            textDecoration: done ? "line-through" : undefined,
            lineHeight: 1.45,
          }}
        >
          {action.content}
        </div>

        <div className="flex items-center flex-wrap gap-x-3 gap-y-1" style={{ marginTop: "5px", fontSize: "11px", color: "#7C92B5" }}>
          {action.owner && (
            <span className="inline-flex items-center gap-1.5">
              <span
                style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: authorColor(action.owner), display: "inline-block" }}
              />
              {action.owner}
            </span>
          )}
          {action.dueDate && !done && (
            <span style={{ color: late ? "#E5635A" : "#7C92B5" }}>{dueSentence(action.dueDate, today)}</span>
          )}
          {done && action.doneAt && <span style={{ color: "#4EB87B" }}>Fait le {shortDateFr(action.doneAt, today)}</span>}
          <Link
            href={`/admin/reunions/${action.meetingId}`}
            style={{ color: "#7C92B5" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = REUNIONS_COLOR)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#7C92B5")}
          >
            {meetingTitle({ title: action.meetingTitle, date: action.meetingDate })} ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
