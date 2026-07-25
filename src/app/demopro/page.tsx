// Tableau de bord de la démonstration /demopro.
// Reproduit le tableau de bord du back-office, alimenté par des données
// d'exemple figées (src/lib/demo-data.ts). Aucun accès base.
import Link from "next/link";
import { BadgeCheck, Car, CalendarClock, ChevronRight, FileText, ReceiptText, ShieldCheck, MessagesSquare, Send, Users } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { computeTotals, formatEuro } from "@/lib/devis";
import { computeBalance, formatEuroCents, PARTNER_COLOR } from "@/lib/comptes";
import { PIPELINE_STAGES, type Stage } from "@/lib/crm";
import { TYPE_LABEL, TYPE_COLOR, formatMin, toDateKey, type AppointmentType } from "@/lib/planning";
import { T, CHART, AdminPage, StatusBadge, firstImage } from "@/app/admin/ui";
import { KpiTile, AreaChart, Donut, Bars } from "@/app/admin/charts";
import {
  getDemoVehicles, getDemoQuotes, getDemoLeads, getDemoAppointments, getDemoWarranties, getDemoNotes, getDemoLedger, lastMonths,
} from "@/lib/demo-data";
import { DEMO_BASE } from "./demo";

// Séries mensuelles d'exemple (les libellés de mois restent glissants).
const ENTRIES_SERIES = [1, 0, 2, 1, 3, 2, 1, 2, 3, 2, 1, 2];
const QUOTES_SERIES_6 = [1, 2, 1, 3, 2, 2];
const QUOTES_SERIES_12 = [0, 1, 1, 2, 1, 2, 3, 2, 1, 2, 2, 2];
const LEADS_SERIES = [0, 1, 0, 2, 1, 1, 2, 1, 3, 2, 2, 3];

function timeAgo(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return `il y a ${Math.floor(s / 86400)} j`;
}

export default function DemoDashboard() {
  const now = new Date();
  const todayKey = toDateKey(now);
  const today = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const vehicles = getDemoVehicles();
  const quotes = getDemoQuotes();
  const leads = getDemoLeads();
  const appointments = getDemoAppointments();
  const warranties = getDemoWarranties();
  const notes = getDemoNotes();

  const disponibles = vehicles.filter((v) => v.status === "disponible").length;
  const reserves = vehicles.filter((v) => v.status === "reserve").length;
  const vendus = vehicles.filter((v) => v.status === "vendu").length;
  const stockValue = vehicles.filter((v) => v.status === "disponible").reduce((s, v) => s + v.price, 0);

  const devis = quotes.filter((q) => q.docType !== "facture");
  const factures = quotes.filter((q) => q.docType === "facture");
  const devisEnCours = devis.filter((q) => q.status === "brouillon" || q.status === "envoye").length;
  const devisEnvoyes = devis.filter((q) => q.status === "envoye").length;

  const leadsActifs = leads.filter((l) => PIPELINE_STAGES.includes(l.stage as Stage)).length;

  const unpaidInvoices = factures.filter((f) => f.paymentStatus === "impayee");
  const encours = unpaidInvoices.reduce((sum, r) => {
    const tot = computeTotals({ items: r.items, tvaMode: r.tvaMode as "marge", tvaRate: r.tvaRate, depositMode: r.depositMode as "none", depositValue: r.depositValue });
    return sum + (r.factureKind === "solde" ? tot.balance : tot.totalTTC);
  }, 0);
  const impayeesCount = unpaidInvoices.length;

  const warrantyToKey = toDateKey(new Date(now.getTime() + 60 * 86_400_000));
  const expiringWarranties = warranties.filter((w) => w.endDate >= todayKey && w.endDate <= warrantyToKey).length;

  const balance = computeBalance(getDemoLedger());

  const recent = [...vehicles].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);
  const upcomingRdv = appointments
    .filter((r) => r.date >= todayKey)
    .sort((a, b) => (a.date === b.date ? a.startMin - b.startMin : a.date.localeCompare(b.date)))
    .slice(0, 4);

  const months12 = lastMonths(12).map((m) => m.label);
  const months6 = lastMonths(6).map((m) => m.label);

  /* Activité récente : fiches + devis + notes + leads, fusionnés */
  const QUOTE_EVENT: Record<string, { text: (n: string) => string; color: string; icon: "accept" | "send" | "file" }> = {
    accepte: { text: (n) => `Devis ${n} accepté`, color: T.success, icon: "accept" },
    envoye: { text: (n) => `Devis ${n} envoyé`, color: T.accent, icon: "send" },
    brouillon: { text: (n) => `Devis ${n} créé`, color: T.muted, icon: "file" },
  };
  const ACTIVITY_ICON = { accept: BadgeCheck, send: Send, file: FileText, car: Car, note: MessagesSquare, lead: Users };
  const activity = [
    ...recent.map((v) => ({
      date: v.createdAt, icon: "car" as const, color: T.accent,
      text: `Fiche créée — ${v.make} ${v.model}`, detail: `${v.year} · ${formatNumber(v.mileage)} km`,
      href: `${DEMO_BASE}/vehicules/${v.id}`,
    })),
    ...devis.map((q) => {
      const ev = QUOTE_EVENT[q.status] ?? QUOTE_EVENT.brouillon;
      return { date: q.updatedAt, icon: ev.icon, color: ev.color, text: ev.text(q.number), detail: q.clientCompany || q.clientName, href: `${DEMO_BASE}/devis/${q.id}` };
    }),
    ...notes.map((n) => ({
      date: n.createdAt, icon: "note" as const, color: "#C7D3E8",
      text: `Note atelier — ${n.author}`, detail: n.content.length > 60 ? n.content.slice(0, 60) + "…" : n.content, href: `${DEMO_BASE}/atelier`,
    })),
    ...leads.flatMap((l) =>
      l.events.map((e) => {
        const who = l.client.company || l.client.name;
        return {
          date: e.createdAt, icon: "lead" as const, color: e.type === "creation" ? T.accent : "#C7D3E8",
          text: e.type === "creation" ? `Nouveau lead — ${who}` : `Note — ${who}`,
          detail: e.content.length > 60 ? e.content.slice(0, 60) + "…" : e.content, href: `${DEMO_BASE}/clients/${l.client.id}`,
        };
      }),
    ),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  return (
    <div className="relative">
      <div className="adm-halos" />
      <AdminPage>
        {/* En-tête */}
        <div className="adm-enter mb-7" style={{ animationDelay: "0ms" }}>
          <div style={{ width: 24, height: 2, background: `linear-gradient(to right, ${T.accent}, transparent)` }} className="mb-3" />
          <h1 className="text-[26px] font-light" style={{ color: T.text, letterSpacing: "-0.01em" }}>
            Bonjour
            <span className="ml-3 text-sm align-middle" style={{ color: T.muted }}>{today}</span>
          </h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
          <KpiTile index={0} label="Valeur du stock" value={stockValue} euro icon="banknote" hint="Annonces disponibles" />
          <KpiTile index={1} label="Disponibles" value={disponibles} icon="badge-check" delta={{ value: 2, label: "entrées ce mois" }} spark={ENTRIES_SERIES} />
          <KpiTile index={2} label="Vendus" value={vendus} icon="handshake" hint="Au total" />
          <KpiTile index={3} label="Devis en cours" value={devisEnCours} icon="file-text" hint={devisEnvoyes > 0 ? `${devisEnvoyes} en attente de réponse` : "Aucun devis envoyé"} spark={QUOTES_SERIES_12} />
          <KpiTile index={4} label="Leads actifs" value={leadsActifs} icon="users" delta={{ value: 3, label: "ce mois" }} spark={LEADS_SERIES} />
        </div>

        {/* Alerte factures impayées */}
        {impayeesCount > 0 && (
          <Link href={`${DEMO_BASE}/factures`} className="adm-enter flex items-center gap-3 px-5 py-3 mb-5" style={{ backgroundColor: T.surface, border: "1px solid rgba(240,180,90,0.4)" }}>
            <ReceiptText size={16} style={{ color: T.warning }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.warning }}>{impayeesCount} facture{impayeesCount > 1 ? "s" : ""} impayée{impayeesCount > 1 ? "s" : ""}</span>
              {" · encours "}
              <span className="font-semibold" style={{ color: T.text }}>{formatEuro(encours)}</span>
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>Voir les factures<ChevronRight size={12} /></span>
          </Link>
        )}

        {/* Alerte garanties à échéance */}
        {expiringWarranties > 0 && (
          <Link href={`${DEMO_BASE}/garanties`} className="adm-enter flex items-center gap-3 px-5 py-3 mb-5" style={{ backgroundColor: T.surface, border: "1px solid rgba(240,180,90,0.4)" }}>
            <ShieldCheck size={16} style={{ color: T.warning }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.warning }}>{expiringWarranties} garantie{expiringWarranties > 1 ? "s" : ""} à échéance</span>
              {" sous 60 jours · pensez à recontacter le client"}
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>Voir les garanties<ChevronRight size={12} /></span>
          </Link>
        )}

        {/* Graphiques rangée 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
          <div className="adm-card adm-enter xl:col-span-2 p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "460ms" }}>
            <div className="adm-hairline" />
            <AreaChart title="Entrées en stock" subtitle="Fiches créées sur les 12 derniers mois" data={ENTRIES_SERIES} labels={months12} format={{ unit: "fiche" }} />
          </div>
          <div className="adm-card adm-enter p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "540ms" }}>
            <div className="adm-hairline" />
            <Donut
              title="Répartition du stock"
              subtitle="État actuel des annonces"
              centerLabel="véhicules"
              segments={[
                { label: "Disponibles", value: disponibles, color: CHART.blue },
                { label: "Réservés", value: reserves, color: CHART.amber },
                { label: "Vendus", value: vendus, color: CHART.green },
              ]}
            />
          </div>
        </div>

        {/* Graphiques rangée 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
          <div className="adm-card adm-enter p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "620ms" }}>
            <div className="adm-hairline" />
            <Bars title="Devis créés" subtitle="6 derniers mois" data={QUOTES_SERIES_6} labels={months6} format={{ unit: "devis" }} />
          </div>
          <div className="adm-card adm-enter xl:col-span-2 p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "700ms" }}>
            <div className="adm-hairline" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>Activité récente</h3>
            </div>
            <ul>
              {activity.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.icon];
                return (
                  <li key={i}>
                    <Link href={a.href} className="flex items-center gap-3.5 py-2 transition-colors hover:text-[#F0F5FF]" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}>
                      <span className="flex items-center justify-center w-7 h-7 flex-shrink-0" style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${T.border}` }}>
                        <Icon size={14} style={{ color: a.color }} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] truncate" style={{ color: T.textDim }}>{a.text}</span>
                        <span className="block text-[11px] truncate" style={{ color: T.muted }}>{a.detail}</span>
                      </span>
                      <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: T.muted }}>{timeAgo(a.date)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* RDV + comptes associés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="adm-card adm-enter p-5 xl:col-span-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "760ms" }}>
            <div className="adm-hairline" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs tracking-widest uppercase" style={{ color: T.textDim }}>Prochains RDV</h3>
              <Link href={`${DEMO_BASE}/planning`} className="inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]" style={{ color: T.accent }}>Planning<ChevronRight size={12} /></Link>
            </div>
            <ul className="space-y-2">
              {upcomingRdv.map((r) => {
                const c = TYPE_COLOR[(r.type as AppointmentType) ?? "autre"] ?? TYPE_COLOR.autre;
                const tomorrow = toDateKey(new Date(now.getTime() + 86_400_000));
                const dayLabel = r.date === todayKey ? "Aujourd'hui" : r.date === tomorrow ? "Demain" : new Date(`${r.date}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
                return (
                  <li key={r.id} className="flex items-center gap-2.5 min-w-0">
                    <span style={{ width: 8, height: 8, backgroundColor: c.bd, flexShrink: 0 }} />
                    <span className="text-[12px] truncate" style={{ color: T.textDim }}>
                      {r.type === "indispo" && r.person ? `${r.person} — ` : ""}
                      {r.title || TYPE_LABEL[(r.type as AppointmentType) ?? "autre"]}
                    </span>
                    <span className="text-[10px] ml-auto flex-shrink-0 flex items-center gap-1" style={{ color: T.muted }}>
                      <CalendarClock size={10} />
                      {dayLabel} · {formatMin(r.startMin)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <Link href={`${DEMO_BASE}/comptes`} className="adm-card adm-enter p-5 flex flex-col justify-between" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "900ms" }}>
            <div className="adm-hairline" />
            <h3 className="text-xs tracking-widest uppercase mb-3" style={{ color: T.textDim }}>Comptes associés</h3>
            <span className="text-sm" style={{ color: T.text }}>
              {balance.settled ? (
                <>Comptes <span style={{ color: T.success }}>équilibrés ✓</span></>
              ) : (
                <>
                  <span style={{ color: PARTNER_COLOR[balance.debtor!] }}>{balance.debtor}</span> doit{" "}
                  <span className="text-xl font-light" style={{ color: T.accent }}>{formatEuroCents(balance.amountCents)}</span> à{" "}
                  <span style={{ color: PARTNER_COLOR[balance.creditor!] }}>{balance.creditor}</span>
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase mt-3" style={{ color: T.accent }}>Ouvrir les comptes<ChevronRight size={12} /></span>
          </Link>
        </div>

        {/* Dernières entrées */}
        <div className="adm-enter flex items-center justify-between mb-3" style={{ animationDelay: "940ms" }}>
          <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>Dernières entrées</h2>
          <Link href={`${DEMO_BASE}/vehicules`} className="inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]" style={{ color: T.textDim }}>Tout le stock<ChevronRight size={12} /></Link>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {recent.map((v, i) => (
            <Link key={v.id} href={`${DEMO_BASE}/vehicules/${v.id}`} className="adm-veh adm-card adm-enter block min-w-0" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: `${1000 + i * 80}ms` }}>
              <div className="overflow-hidden" style={{ aspectRatio: "16 / 10", backgroundColor: T.float }}>
                {firstImage(v.images) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={firstImage(v.images)!} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Car size={22} style={{ color: T.muted }} /></div>
                )}
              </div>
              <div className="p-3.5">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-[10px] tracking-widest uppercase flex-shrink-0" style={{ color: T.accent }}>{v.make}</span>
                  <span className="text-[13px] font-medium truncate" style={{ color: T.text }}>{v.model}</span>
                </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className="text-sm font-semibold" style={{ color: T.text }}>{formatNumber(v.price)} €</span>
                  <StatusBadge status={v.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </AdminPage>
    </div>
  );
}
