// Comptes associés de la démonstration /demoprooo (lecture seule).
// Reproduit le registre entre les deux associés (César / Fab) du back-office,
// alimenté par des données d'exemple figées (src/lib/demo-data.ts). Aucun accès
// base : les boutons d'action affichent un simple toast « démonstration ».
import { Plus } from "lucide-react";
import {
  computeBalance,
  formatEuroCents,
  PARTNER_COLOR,
  category,
  effectLabel,
  monthKey,
  monthLabel,
  dayMonth,
  type Partner,
} from "@/lib/comptes";
import {
  T,
  AdminPage,
  PageHeader,
  btnPrimaryClass,
  btnPrimaryStyle,
  btnGhostClass,
  btnGhostStyle,
} from "@/app/admin/ui";
import { getDemoLedger, type DemoLedgerEntry } from "@/lib/demo-data";
import DemoActionButton from "@/app/demoprooo/DemoActionButton";

type Group = { key: string; label: string; items: DemoLedgerEntry[]; total: number };

/* Badge « payé par » coloré à l'identité de l'associé. */
function PaidByBadge({ who }: { who: Partner }) {
  return (
    <span
      className="text-[10px] tracking-wide uppercase px-2 py-0.5 flex-shrink-0 whitespace-nowrap"
      style={{
        border: `1px solid ${PARTNER_COLOR[who]}80`,
        backgroundColor: `${PARTNER_COLOR[who]}14`,
        color: PARTNER_COLOR[who],
      }}
    >
      {who}
    </span>
  );
}

export default function DemoComptesPage() {
  const ledger = getDemoLedger();
  const balance = computeBalance(ledger);

  // Journal groupé par mois (date décroissante), comme le back-office.
  const sorted = [...ledger].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  const groups: Group[] = [];
  for (const e of sorted) {
    const k = monthKey(e.date);
    const last = groups[groups.length - 1];
    if (!last || last.key !== k) {
      groups.push({ key: k, label: monthLabel(k), items: [e], total: e.amountCents });
    } else {
      last.items.push(e);
      last.total += e.amountCents;
    }
  }

  const totalDisbursed = balance.disbursed["César"] + balance.disbursed["Fab"];
  const pctCesar = totalDisbursed > 0 ? (balance.disbursed["César"] / totalDisbursed) * 100 : 50;

  return (
    <AdminPage>
      <PageHeader
        title="Comptes associés"
        subtitle="Dépenses communes, avances et règlements entre César et Fab."
        action={
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Plus size={14} />
            Nouvelle écriture
          </DemoActionButton>
        }
      />

      {/* Solde courant + total déboursé par associé */}
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
            <p className="text-[11px] tracking-widest uppercase mt-2" style={{ color: T.muted }}>
              Solde courant
            </p>
          </div>
          {!balance.settled && (
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              Régler les comptes
            </DemoActionButton>
          )}
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between text-[11px] tracking-widest uppercase mb-2">
            <span style={{ color: PARTNER_COLOR["César"] }}>
              César · {formatEuroCents(balance.disbursed["César"])}
            </span>
            <span style={{ color: PARTNER_COLOR["Fab"] }}>
              Fab · {formatEuroCents(balance.disbursed["Fab"])}
            </span>
          </div>
          <div className="flex h-2 w-full overflow-hidden" style={{ backgroundColor: T.float }}>
            <div style={{ width: `${pctCesar}%`, backgroundColor: PARTNER_COLOR["César"] }} />
            <div style={{ width: `${100 - pctCesar}%`, backgroundColor: PARTNER_COLOR["Fab"] }} />
          </div>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            Total déboursé · {formatEuroCents(totalDisbursed)}
          </p>
        </div>
      </div>

      {/* Journal des écritures */}
      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>
          Journal des écritures
        </h2>
        <span className="text-[11px] tracking-widest uppercase" style={{ color: T.muted }}>
          {ledger.length} écriture{ledger.length > 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ border: `1px solid ${T.border}` }}>
        {groups.map((g) => (
          <div key={g.key}>
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ backgroundColor: T.surfaceAlt, borderTop: `1px solid ${T.border}` }}
            >
              <span className="text-[11px] tracking-widest uppercase" style={{ color: T.textDim }}>
                {g.label}
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: T.muted }}>
                {formatEuroCents(g.total)}
              </span>
            </div>
            {g.items.map((e, i) => {
              const c = category(e.category);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
                >
                  <span className="text-xs tabular-nums flex-shrink-0" style={{ color: T.muted, width: 42 }}>
                    {dayMonth(e.date)}
                  </span>

                  <span className="flex items-center flex-shrink-0" style={{ width: 8 }} title={c.label}>
                    <span
                      style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: c.color, display: "inline-block" }}
                    />
                  </span>
                  <span
                    className="hidden lg:inline text-[11px] flex-shrink-0 truncate"
                    style={{ color: T.muted, width: 132 }}
                  >
                    {c.label}
                  </span>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm truncate" style={{ color: T.text }}>
                      {e.label || <span style={{ color: T.muted }}>Sans libellé</span>}
                    </span>
                    <span className="text-[11px] truncate" style={{ color: T.muted }}>
                      {effectLabel(e)}
                      {e.note ? ` · ${e.note}` : ""}
                    </span>
                  </div>

                  <PaidByBadge who={e.paidBy} />
                  <span
                    className="text-sm font-semibold tabular-nums flex-shrink-0 text-right"
                    style={{ color: T.text, width: 92 }}
                  >
                    {formatEuroCents(e.amountCents)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
