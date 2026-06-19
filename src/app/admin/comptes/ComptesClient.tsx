"use client";

import { useState, useMemo, useRef, type CSSProperties, type FormEvent } from "react";
import {
  T, SectionCard, fieldClass, labelClass,
  btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle,
} from "../ui";
import {
  PARTNERS, type Partner, type Scope, type LedgerEntry,
  CATEGORIES, category, PARTNER_COLOR, LABEL_SUGGESTIONS, SETTLE_CATEGORY,
  computeBalance, formatEuroCents, parseAmountToCents,
  effectLabel, monthKey, monthLabel, dayMonth, type Balance,
} from "@/lib/comptes";

/* ── Données d'une nouvelle écriture (sans id ni timestamps) ── */
type NewEntry = {
  date: string;
  label: string;
  category: string;
  amountCents: number;
  paidBy: Partner;
  scope: Scope;
  share: number;
  note: string;
};

/* ── Styles de champ (thème back-office) ── */
const fld: CSSProperties = { backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.text, outline: "none", width: "100%" };
const cell: CSSProperties = { backgroundColor: T.float, border: `1px solid ${T.border}`, color: T.text, outline: "none", colorScheme: "dark" };

const todayISO = () => new Date().toISOString().slice(0, 10);

let tmpSeq = 0;
const tmpId = () => `tmp-${++tmpSeq}`;

function centsToInput(c: number): string {
  const euros = (Number(c) || 0) / 100;
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2).replace(".", ",");
}

function normalize(r: Record<string, unknown>): LedgerEntry {
  const paidBy = r.paidBy === "César" || r.paidBy === "Fab" ? (r.paidBy as Partner) : "Fab";
  const scope = r.scope === "commun" || r.scope === "César" || r.scope === "Fab" ? (r.scope as Scope) : "commun";
  return {
    id: String(r.id),
    date: String(r.date ?? ""),
    label: String(r.label ?? ""),
    category: String(r.category ?? "autre"),
    amountCents: Number(r.amountCents) || 0,
    paidBy,
    scope,
    share: Number(r.share) || 50,
    note: String(r.note ?? ""),
    createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : undefined,
  };
}

// Tri : date décroissante, puis création décroissante.
function cmp(a: LedgerEntry, b: LedgerEntry): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const ca = a.createdAt ?? "", cb = b.createdAt ?? "";
  return ca < cb ? 1 : ca > cb ? -1 : 0;
}

/* ════════════════════════════════════════════════════════════════ */

export default function ComptesClient({ initialEntries, me }: { initialEntries: LedgerEntry[]; me: Partner | null }) {
  const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
  const [filterPerson, setFilterPerson] = useState<"all" | Partner>("all");
  const [filterCat, setFilterCat] = useState<"all" | string>("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [topErr, setTopErr] = useState("");
  const [settling, setSettling] = useState(false);

  const balance = useMemo(() => computeBalance(entries), [entries]);

  const groups = useMemo(() => {
    const sorted = [...entries].sort(cmp).filter(
      (e) =>
        (filterPerson === "all" || e.paidBy === filterPerson) &&
        (filterCat === "all" || e.category === filterCat),
    );
    const out: { key: string; label: string; items: LedgerEntry[]; total: number }[] = [];
    for (const e of sorted) {
      const k = monthKey(e.date);
      const last = out[out.length - 1];
      if (!last || last.key !== k) out.push({ key: k, label: monthLabel(k), items: [e], total: e.amountCents });
      else { last.items.push(e); last.total += e.amountCents; }
    }
    return out;
  }, [entries, filterPerson, filterCat]);

  async function addEntry(p: NewEntry): Promise<boolean> {
    setTopErr("");
    const temp: LedgerEntry = { ...p, id: tmpId(), createdAt: new Date().toISOString() };
    setEntries((prev) => [temp, ...prev]);
    try {
      const res = await fetch("/api/admin/comptes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error();
      const saved = normalize(await res.json());
      setEntries((prev) => prev.map((e) => (e.id === temp.id ? saved : e)));
      return true;
    } catch {
      setEntries((prev) => prev.filter((e) => e.id !== temp.id));
      return false;
    }
  }

  async function saveEdit(id: string, p: NewEntry): Promise<boolean> {
    const original = entries.find((e) => e.id === id);
    setTopErr("");
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...p } : e)));
    try {
      const res = await fetch(`/api/admin/comptes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error();
      const saved = normalize(await res.json());
      setEntries((prev) => prev.map((e) => (e.id === id ? saved : e)));
      setEditId(null);
      return true;
    } catch {
      // Rollback ciblé sur la seule écriture éditée (préserve les ajouts/suppressions concurrents).
      if (original) setEntries((prev) => prev.map((e) => (e.id === id ? original : e)));
      setTopErr("Échec de la mise à jour.");
      return false;
    }
  }

  async function removeEntry(id: string) {
    if (!window.confirm("Supprimer cette écriture ?")) return;
    const removed = entries.find((e) => e.id === id);
    setTopErr("");
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/admin/comptes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      // Réinsère l'écriture supprimée sans écraser d'éventuels ajouts concurrents (tri géré par le memo).
      if (removed) setEntries((prev) => (prev.some((e) => e.id === id) ? prev : [removed, ...prev]));
      setTopErr("Échec de la suppression.");
    }
  }

  async function settle() {
    if (balance.settled || !balance.debtor || !balance.creditor) return;
    if (!window.confirm(`Enregistrer un règlement de ${formatEuroCents(balance.amountCents)} de ${balance.debtor} à ${balance.creditor} ?`)) return;
    setSettling(true);
    const ok = await addEntry({
      paidBy: balance.debtor,
      scope: balance.creditor,
      share: 50, // ignoré quand scope ≠ "commun" (présent pour le typage)
      category: SETTLE_CATEGORY,
      label: "Règlement des comptes",
      amountCents: balance.amountCents,
      date: todayISO(),
      note: "",
    });
    setSettling(false);
    if (!ok) setTopErr("Échec du règlement. Réessayez.");
  }

  return (
    <div className="space-y-6">
      <BalanceHero balance={balance} onSettle={settle} settling={settling} />

      <Composer me={me} onAdd={addEntry} />

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <Segment
          value={filterPerson}
          onChange={setFilterPerson}
          options={[{ value: "all", label: "Tous" }, ...PARTNERS.map((p) => ({ value: p, label: p, color: PARTNER_COLOR[p] }))]}
          size="sm"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="text-xs px-3 py-2"
          style={cell}
        >
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <span className="text-[11px] tracking-widest uppercase ml-auto" style={{ color: T.muted }}>
          {entries.length} écriture{entries.length > 1 ? "s" : ""}
        </span>
      </div>

      {topErr && <p className="text-xs" style={{ color: T.danger }}>{topErr}</p>}

      {/* Journal */}
      {groups.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          {entries.length === 0
            ? "Aucune écriture pour l’instant. Ajoutez la première ci-dessus."
            : "Aucune écriture pour ce filtre."}
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {groups.map((g) => (
            <div key={g.key}>
              <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: T.surfaceAlt, borderTop: `1px solid ${T.border}` }}>
                <span className="text-[11px] tracking-widest uppercase" style={{ color: T.textDim }}>{g.label}</span>
                <span className="text-[11px] tabular-nums" style={{ color: T.muted }}>{formatEuroCents(g.total)}</span>
              </div>
              {g.items.map((e, i) =>
                editId === e.id ? (
                  <EntryEditor
                    key={e.id}
                    entry={e}
                    first={i === 0}
                    onSave={(p) => saveEdit(e.id, p)}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    first={i === 0}
                    onEdit={() => setEditId(e.id)}
                    onDelete={() => removeEntry(e.id)}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════ Sous-composants ════════════════════ */

function Segment<V extends string>({
  value, options, onChange, size = "md",
}: {
  value: V;
  options: { value: V; label: string; color?: string }[];
  onChange: (v: V) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex flex-shrink-0" style={{ border: `1px solid ${T.border}`, backgroundColor: T.float }}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`text-xs tracking-wide transition-colors ${size === "sm" ? "px-2.5 py-1.5" : "px-3.5 py-2"}`}
            style={{
              backgroundColor: active ? (o.color ?? T.accent) : "transparent",
              color: active ? T.bg : T.textDim,
              fontWeight: active ? 600 : 400,
              borderLeft: i === 0 ? "none" : `1px solid ${T.border}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function CategoryChips({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-wide px-2.5 py-1.5 transition-colors"
            style={{
              border: `1px solid ${active ? c.color : T.border}`,
              backgroundColor: active ? `${c.color}1A` : "transparent",
              color: active ? T.text : T.muted,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: c.color, display: "inline-block" }} />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function PaidByBadge({ who }: { who: Partner }) {
  return (
    <span
      className="text-[10px] tracking-wide uppercase px-2 py-0.5 flex-shrink-0 whitespace-nowrap"
      style={{ border: `1px solid ${PARTNER_COLOR[who]}80`, backgroundColor: `${PARTNER_COLOR[who]}14`, color: PARTNER_COLOR[who] }}
    >
      {who}
    </span>
  );
}

function BalanceHero({ balance, onSettle, settling }: { balance: Balance; onSettle: () => void; settling: boolean }) {
  const total = balance.disbursed["César"] + balance.disbursed["Fab"];
  const pctCesar = total > 0 ? (balance.disbursed["César"] / total) * 100 : 50;

  return (
    <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }} className="p-6 sm:p-8">
      <div style={{ width: 24, height: 2, backgroundColor: T.accent }} className="mb-5" />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          {balance.settled ? (
            <p className="text-2xl sm:text-3xl font-light" style={{ color: T.text }}>
              Comptes équilibrés <span style={{ color: "#4ED1A1" }}>✓</span>
            </p>
          ) : (
            <p className="text-2xl sm:text-3xl font-light" style={{ color: T.text }}>
              <span style={{ color: PARTNER_COLOR[balance.debtor!] }}>{balance.debtor}</span> doit{" "}
              <span style={{ color: T.accent }}>{formatEuroCents(balance.amountCents)}</span> à{" "}
              <span style={{ color: PARTNER_COLOR[balance.creditor!] }}>{balance.creditor}</span>
            </p>
          )}
          <p className="text-[11px] tracking-widest uppercase mt-2" style={{ color: T.muted }}>Solde courant</p>
        </div>
        {!balance.settled && (
          <button onClick={onSettle} disabled={settling} className={btnGhostClass} style={btnGhostStyle}>
            {settling ? "…" : "Régler les comptes"}
          </button>
        )}
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between text-[11px] tracking-widest uppercase mb-2">
          <span style={{ color: PARTNER_COLOR["César"] }}>César · {formatEuroCents(balance.disbursed["César"])}</span>
          <span style={{ color: PARTNER_COLOR["Fab"] }}>Fab · {formatEuroCents(balance.disbursed["Fab"])}</span>
        </div>
        <div className="flex h-2 w-full overflow-hidden" style={{ backgroundColor: T.float }}>
          <div style={{ width: `${pctCesar}%`, backgroundColor: PARTNER_COLOR["César"] }} />
          <div style={{ width: `${100 - pctCesar}%`, backgroundColor: PARTNER_COLOR["Fab"] }} />
        </div>
        <p className="text-[11px] mt-2" style={{ color: T.muted }}>Total déboursé · {formatEuroCents(total)}</p>
      </div>
    </div>
  );
}

function Composer({ me, onAdd }: { me: Partner | null; onAdd: (p: NewEntry) => Promise<boolean> }) {
  const [paidBy, setPaidBy] = useState<Partner>(me ?? "Fab");
  const [scope, setScope] = useState<Scope>("commun");
  const [showShare, setShowShare] = useState(false);
  const [share, setShare] = useState(50);
  const [cat, setCat] = useState("abonnement");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (busy) return;
    const cents = parseAmountToCents(amount);
    if (cents === null || cents <= 0) { setErr("Montant invalide."); return; }
    setErr("");
    setBusy(true);
    const ok = await onAdd({
      paidBy,
      scope,
      share: scope === "commun" ? share : 50,
      category: cat,
      label: label.trim(),
      amountCents: cents,
      date,
      note: note.trim(),
    });
    setBusy(false);
    if (ok) {
      setLabel("");
      setAmount("");
      setNote("");
      labelRef.current?.focus();
    } else {
      setErr("Échec de l’enregistrement. Réessayez.");
    }
  }

  return (
    <form onSubmit={submit}>
      <SectionCard title="Nouvelle écriture">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <div>
            <span className={labelClass} style={{ color: T.muted }}>Payé par</span>
            <Segment value={paidBy} onChange={setPaidBy} options={PARTNERS.map((p) => ({ value: p, label: p, color: PARTNER_COLOR[p] }))} />
          </div>
          <div>
            <span className={labelClass} style={{ color: T.muted }}>Pour</span>
            <div className="flex items-center gap-3">
              <Segment
                value={scope}
                onChange={(v) => setScope(v)}
                options={[{ value: "commun", label: "Commun" }, { value: "César", label: "César" }, { value: "Fab", label: "Fab" }]}
              />
              {scope === "commun" &&
                (showShare ? (
                  <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: T.textDim }}>
                    Part {paidBy}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={share}
                      onChange={(e) => setShare(Math.min(100, Math.max(0, Math.round(Number(e.target.value)) || 0)))}
                      aria-label={`Part de ${paidBy} en pourcentage`}
                      className="w-14 px-2 py-1 text-center text-sm"
                      style={cell}
                    />
                    %
                  </span>
                ) : (
                  <button type="button" onClick={() => setShowShare(true)} className="text-[11px] tracking-wide hover:underline underline-offset-2" style={{ color: T.muted }}>
                    50/50 · ajuster
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div>
          <span className={labelClass} style={{ color: T.muted }}>Catégorie</span>
          <CategoryChips value={cat} onChange={setCat} />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <span className={labelClass} style={{ color: T.muted }}>Libellé</span>
            <input ref={labelRef} list="ledger-labels" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Claude Code" className={fieldClass} style={fld} />
          </div>
          <div className="w-32">
            <span className={labelClass} style={{ color: T.muted }}>Montant</span>
            <div className="relative">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" className={`${fieldClass} pr-7`} style={fld} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: T.muted }}>€</span>
            </div>
          </div>
          <div className="w-44">
            <span className={labelClass} style={{ color: T.muted }}>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} style={{ ...fld, colorScheme: "dark" }} />
          </div>
          <button type="submit" disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>
            {busy ? "…" : "Ajouter"}
          </button>
        </div>

        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (facultatif)" className="w-full px-4 py-2 text-sm" style={fld} />

        {err && <p className="text-xs" style={{ color: T.danger }}>{err}</p>}

        <datalist id="ledger-labels">
          {LABEL_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </SectionCard>
    </form>
  );
}

function EntryRow({ entry, first, onEdit, onDelete }: { entry: LedgerEntry; first: boolean; onEdit: () => void; onDelete: () => void }) {
  const c = category(entry.category);
  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#0A1628]" style={{ borderTop: first ? "none" : `1px solid ${T.border}` }}>
      <span className="text-xs tabular-nums flex-shrink-0" style={{ color: T.muted, width: 42 }}>{dayMonth(entry.date)}</span>

      <span className="flex items-center gap-1.5 flex-shrink-0" style={{ width: 8 }} title={c.label}>
        <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: c.color, display: "inline-block" }} />
      </span>
      <span className="hidden lg:inline text-[11px] flex-shrink-0 truncate" style={{ color: T.muted, width: 132 }}>{c.label}</span>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm truncate" style={{ color: T.text }}>
          {entry.label || <span style={{ color: T.muted }}>Sans libellé</span>}
        </span>
        <span className="text-[11px] truncate" style={{ color: T.muted }}>
          {effectLabel(entry)}{entry.note ? ` · ${entry.note}` : ""}
        </span>
      </div>

      <PaidByBadge who={entry.paidBy} />
      <span className="text-sm font-semibold tabular-nums flex-shrink-0 text-right" style={{ color: T.text, width: 92 }}>{formatEuroCents(entry.amountCents)}</span>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} title="Modifier" className="px-1.5 py-1 hover:text-[#F0F5FF]" style={{ color: T.muted }}>✎</button>
        <button onClick={onDelete} title="Supprimer" className="px-1.5 py-1 hover:text-[#FF6B35]" style={{ color: T.muted }}>✕</button>
      </div>
    </div>
  );
}

function EntryEditor({ entry, first, onSave, onCancel }: { entry: LedgerEntry; first: boolean; onSave: (p: NewEntry) => Promise<boolean>; onCancel: () => void }) {
  const [paidBy, setPaidBy] = useState<Partner>(entry.paidBy);
  const [scope, setScope] = useState<Scope>(entry.scope);
  const [share, setShare] = useState(entry.share);
  const [cat, setCat] = useState(entry.category);
  const [label, setLabel] = useState(entry.label);
  const [amount, setAmount] = useState(centsToInput(entry.amountCents));
  const [date, setDate] = useState(entry.date);
  const [note, setNote] = useState(entry.note);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy) return;
    const cents = parseAmountToCents(amount);
    if (cents === null || cents <= 0) { setErr("Montant invalide."); return; }
    setErr("");
    setBusy(true);
    const ok = await onSave({
      paidBy, scope, share: scope === "commun" ? share : 50,
      category: cat, label: label.trim(), amountCents: cents, date, note: note.trim(),
    });
    setBusy(false);
    if (!ok) setErr("Échec.");
  }

  return (
    <div className="px-4 py-4 space-y-3" style={{ borderTop: first ? "none" : `1px solid ${T.border}`, backgroundColor: T.float }}>
      <div className="flex flex-wrap items-center gap-2">
        <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as Partner)} className="text-xs px-2.5 py-2" style={cell}>
          {PARTNERS.map((p) => <option key={p} value={p}>Payé par {p}</option>)}
        </select>
        <select value={scope} onChange={(e) => setScope(e.target.value as Scope)} className="text-xs px-2.5 py-2" style={cell}>
          <option value="commun">Pour : Commun</option>
          <option value="César">Pour : César</option>
          <option value="Fab">Pour : Fab</option>
        </select>
        {scope === "commun" && (
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: T.textDim }}>
            Part {paidBy}
            <input type="number" min={0} max={100} value={share} onChange={(e) => setShare(Math.min(100, Math.max(0, Math.round(Number(e.target.value)) || 0)))} aria-label={`Part de ${paidBy} en pourcentage`} className="w-14 px-2 py-1 text-center text-sm" style={cell} />%
          </span>
        )}
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="text-xs px-2.5 py-2" style={cell}>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé" className="flex-1 min-w-[160px] px-3 py-2 text-sm" style={fld} />
        <div className="relative w-28">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" className="w-full px-3 py-2 pr-6 text-sm" style={fld} />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: T.muted }}>€</span>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className="px-3 py-2 text-sm" style={{ ...cell }} />
      </div>

      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (facultatif)" className="w-full px-3 py-2 text-sm" style={fld} />

      {err && <p className="text-xs" style={{ color: T.danger }}>{err}</p>}

      <div className="flex items-center gap-2">
        <button type="button" onClick={save} disabled={busy} className={btnPrimaryClass} style={btnPrimaryStyle}>{busy ? "…" : "Enregistrer"}</button>
        <button type="button" onClick={onCancel} className={btnGhostClass} style={btnGhostStyle}>Annuler</button>
      </div>
    </div>
  );
}
