import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { BadgeCheck, BellRing, Car, CalendarClock, ChevronRight, FileText, FileBadge, ReceiptText, ShieldCheck, MessagesSquare, NotebookPen, XCircle, Send, Users, HandCoins } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import { computeTotals, formatEuro, DOCS_HORS_DEVIS, type QuoteItem, type TvaMode, type DepositMode } from "@/lib/devis";
import { relancesDues } from "@/lib/relances-server";
import { computeBalance, formatEuroCents, PARTNER_COLOR, type Partner, type Scope } from "@/lib/comptes";
import { PIPELINE_STAGES, EVENT_LABEL, type EventType, type Stage } from "@/lib/crm";
import { TYPE_LABEL, TYPE_COLOR, formatMin, toDateKey, authorColor, signatureOf, type AppointmentType } from "@/lib/planning";
import { missingEssentials, parisDay } from "@/lib/vehicules";
import { validite } from "@/lib/reprises";
import { deadlines as regDeadlines, isRegType } from "@/lib/immatriculation";
import { T, CHART, AdminPage, StatusBadge, firstImage } from "./ui";
import { KpiTile, AreaChart, Donut, Bars } from "./charts";

type VehLite = { id: string; make: string; model: string; images: string; price: number };

// Même règle que l'écran de stock : les deux comptes se contredisaient, l'un
// cherchant une liste de photos strictement vide en base, l'autre lisant vraiment
// son contenu.
function reasons(v: VehLite): string[] {
  return missingEssentials({ image: firstImage(v.images), price: v.price });
}

/* ── Mois glissants ── */
function lastMonths(n: number): { key: string; label: string }[] {
  const now = new Date();
  const out: { key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const raw = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
    out.push({ key, label: raw.charAt(0).toUpperCase() + raw.slice(1) });
  }
  return out;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function countByMonth(dates: Date[], months: { key: string }[]): number[] {
  const map = new Map<string, number>();
  for (const d of dates) map.set(monthKey(d), (map.get(monthKey(d)) ?? 0) + 1);
  return months.map((m) => map.get(m.key) ?? 0);
}

function timeAgo(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  return `il y a ${Math.floor(s / 86400)} j`;
}

function InsightPanel({
  title,
  items,
  emptyLabel,
  showReasons = false,
  delay,
}: {
  title: string;
  items: VehLite[];
  emptyLabel: string;
  showReasons?: boolean;
  delay: number;
}) {
  return (
    <div className="adm-card adm-enter p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: `${delay}ms` }}>
      <div className="adm-hairline" />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs tracking-widest uppercase" style={{ color: T.textDim }}>{title}</h3>
        <span className="text-xs" style={{ color: T.muted }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: T.muted }}>{emptyLabel}</p>
      ) : (
        <ul>
          {items.map((v) => (
            <li key={v.id}>
              <Link
                href={`/admin/vehicules/${v.id}`}
                className="flex items-center justify-between gap-3 py-2 transition-colors hover:text-[#F0F5FF]"
                style={{ color: T.textDim }}
              >
                <span className="text-sm truncate min-w-0">
                  <span className="text-xs uppercase tracking-widest mr-2" style={{ color: T.accent }}>{v.make}</span>
                  {v.model}
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  {showReasons &&
                    reasons(v).map((r) => (
                      <span
                        key={r}
                        className="text-[10px] uppercase tracking-widest px-2 py-0.5 whitespace-nowrap"
                        style={{ border: "1px solid rgba(240,180,90,0.38)", color: T.warning }}
                      >
                        {r}
                      </span>
                    ))}
                  <span className="inline-flex items-center gap-0.5 text-[11px] uppercase tracking-widest" style={{ color: T.accent }}>
                    Compléter
                    <ChevronRight size={12} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminDashboard() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const relances = await relancesDues();

  const cookieStore = await cookies();
  const name = cookieStore.get("ia_collab_name")?.value?.trim() || session.admin.email.split("@")[0];

  // Fenêtre « garanties à échéance » : de aujourd'hui à +60 jours.
  const warrantyFrom = new Date().toISOString().slice(0, 10);
  const warrantyToDate = new Date();
  warrantyToDate.setDate(warrantyToDate.getDate() + 60);
  const warrantyTo = warrantyToDate.toISOString().slice(0, 10);

  const [disponibles, reserves, vendus, valueAgg, recent, tousVehicules, masquees, allVehicleDates, allQuotes, recentNotes, ledgerRows, allLeads, recentLeadEvents, upcomingRdv, unpaidInvoices, expiringWarranties, lateMeetingActions, openRegistrations, offresOuvertes] =
    await Promise.all([
      prisma.vehicle.count({ where: { status: "disponible" } }),
      prisma.vehicle.count({ where: { status: "reserve" } }),
      prisma.vehicle.count({ where: { status: "vendu" } }),
      prisma.vehicle.aggregate({ _sum: { price: true }, where: { status: "disponible" } }),
      prisma.vehicle.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
      // Le tri des fiches incomplètes se fait en mémoire : une liste de photos
      // abîmée ou remplie d'entrées vides échappait au filtre écrit en base.
      // Seules les colonnes affichées remontent.
      prisma.vehicle.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, make: true, model: true, images: true, price: true },
      }),
      prisma.vehicle.findMany({ where: { isPublished: false }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.vehicle.findMany({ select: { createdAt: true } }),
      prisma.quote.findMany({
        where: { docType: { notIn: [...DOCS_HORS_DEVIS] } },
        select: { id: true, number: true, clientName: true, clientCompany: true, status: true, createdAt: true, updatedAt: true },
      }),
      prisma.collabNote.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, author: true, content: true, createdAt: true },
      }),
      prisma.ledgerEntry.findMany(),
      prisma.lead.findMany({ select: { createdAt: true, stage: true } }),
      prisma.leadEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { lead: { include: { client: { select: { id: true, name: true, company: true } } } } },
      }),
      prisma.appointment.findMany({
        where: { date: { gte: toDateKey(new Date()) } },
        orderBy: [{ date: "asc" }, { startMin: "asc" }],
        take: 4,
      }),
      prisma.quote.findMany({ where: { docType: "facture", paymentStatus: "impayee" } }),
      prisma.warranty.count({ where: { endDate: { gte: warrantyFrom, lte: warrantyTo } } }),
      // Actions décidées en réunion dont l'échéance est dépassée : elles se
      // perdaient jusqu'ici entre deux points, faute de rappel au quotidien.
      prisma.meetingItem.count({
        where: { type: "action", status: { not: "fait" }, dueDate: { lt: parisDay(new Date()).toISOString().slice(0, 10), not: "" } },
      }),
      // Dossiers d'immatriculation encore ouverts : les délais légaux courent
      // tant que l'immatriculation n'est pas obtenue.
      prisma.registration.findMany({
        where: { registeredOn: "" },
        select: { type: true, acquiredOn: true, deliveredOn: true, registeredOn: true, quitusDate: true },
      }),
      // Offres de reprise encore ouvertes : le bandeau se calcule sur leur
      // date d'échéance, jamais sur un statut rangé en base.
      prisma.reprise.findMany({
        where: { status: { in: ["brouillon", "proposee"] } },
        select: { offerDate: true, validityDays: true },
      }),
    ]);

  // Une offre qui dort est une offre perdue : celles qui approchent de leur fin
  // remontent en tête du tableau de bord.
  const jourParis = parisDay(new Date()).toISOString().slice(0, 10);
  const offresQuiExpirent = offresOuvertes.filter((r) => {
    const v = validite(r.offerDate, r.validityDays, jourParis);
    return v !== null && (v.expiree || v.proche);
  }).length;

  const stockValue = valueAgg._sum.price ?? 0;

  // Fiches incomplètes, filtrées en mémoire pour appliquer la même règle que
  // l'écran de stock : les deux comptes divergeaient jusqu'ici.
  const aCompleter = tousVehicules.filter((v) => reasons(v).length > 0).slice(0, 5);

  // Dossiers dont au moins une échéance légale est dépassée.
  const todayKey = new Date().toISOString().slice(0, 10);
  const lateRegistrations = openRegistrations.filter((r) =>
    regDeadlines(
      { type: isRegType(r.type) ? r.type : "import_ue", acquiredOn: r.acquiredOn, deliveredOn: r.deliveredOn, registeredOn: r.registeredOn, quitusDate: r.quitusDate },
      todayKey,
    ).some((d) => d.key !== "archivage" && d.daysLeft < 0),
  ).length;

  /* Séries mensuelles réelles */
  const months12 = lastMonths(12);
  const months6 = lastMonths(6);
  const entriesSeries = countByMonth(allVehicleDates.map((v) => v.createdAt), months12);
  const quotesSeries6 = countByMonth(allQuotes.map((q) => q.createdAt), months6);
  const quotesSeries12 = countByMonth(allQuotes.map((q) => q.createdAt), months12);

  const thisMonthKey = monthKey(new Date());
  const entriesThisMonth = entriesSeries[months12.findIndex((m) => m.key === thisMonthKey)] ?? 0;
  const devisEnCours = allQuotes.filter((q) => q.status === "brouillon" || q.status === "envoye").length;
  const devisEnvoyes = allQuotes.filter((q) => q.status === "envoye").length;

  const leadsSeries = countByMonth(allLeads.map((l) => l.createdAt), months12);
  const leadsActifs = allLeads.filter((l) => PIPELINE_STAGES.includes(l.stage as Stage)).length;
  const leadsThisMonth = leadsSeries[months12.findIndex((m) => m.key === thisMonthKey)] ?? 0;
  const leadsGagnes = allLeads.filter((l) => l.stage === "gagne").length;

  // Encours des factures impayées.
  const encours = unpaidInvoices.reduce((sum, r) => {
    let fItems: QuoteItem[] = [];
    try {
      const p = JSON.parse(r.items);
      if (Array.isArray(p)) fItems = p;
    } catch {
      /* ignore */
    }
    const tot = computeTotals({
      items: fItems,
      tvaMode: r.tvaMode as TvaMode,
      tvaRate: r.tvaRate,
      depositMode: r.depositMode as DepositMode,
      depositValue: r.depositValue,
    });
    return sum + (r.factureKind === "solde" ? tot.balance : tot.totalTTC);
  }, 0);
  const impayeesCount = unpaidInvoices.length;

  /* Activité récente : fiches créées + devis + notes atelier, fusionnés */
  const QUOTE_EVENT: Record<string, { text: (n: string) => string; color: string; icon: "accept" | "send" | "refuse" | "file" }> = {
    accepte: { text: (n) => `Devis ${n} accepté`, color: T.success, icon: "accept" },
    envoye: { text: (n) => `Devis ${n} envoyé`, color: T.accent, icon: "send" },
    refuse: { text: (n) => `Devis ${n} refusé`, color: T.danger, icon: "refuse" },
    brouillon: { text: (n) => `Devis ${n} créé`, color: T.muted, icon: "file" },
  };
  const ACTIVITY_ICON = { accept: BadgeCheck, send: Send, refuse: XCircle, file: FileText, car: Car, note: MessagesSquare, lead: Users };

  const activity = [
    ...recent.map((v) => ({
      date: v.createdAt,
      icon: "car" as const,
      color: T.accent,
      text: `Fiche créée — ${v.make} ${v.model}`,
      detail: `${v.year} · ${formatNumber(v.mileage)} km`,
      href: `/admin/vehicules/${v.id}`,
    })),
    ...allQuotes
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 4)
      .map((q) => {
        const ev = QUOTE_EVENT[q.status] ?? QUOTE_EVENT.brouillon;
        return {
          date: q.updatedAt,
          icon: ev.icon,
          color: ev.color,
          text: ev.text(q.number),
          detail: q.clientCompany || q.clientName || "Sans client",
          href: `/admin/devis/${q.id}`,
        };
      }),
    ...recentNotes.map((n) => ({
      date: n.createdAt,
      icon: "note" as const,
      color: "#C7D3E8",
      text: `Note atelier — ${n.author}`,
      detail: n.content.length > 60 ? n.content.slice(0, 60) + "…" : n.content,
      href: "/admin/atelier",
    })),
    ...recentLeadEvents.map((e) => {
      const who = e.lead.client.company || e.lead.client.name;
      return {
        date: e.createdAt,
        icon: "lead" as const,
        color: e.type === "creation" ? T.accent : "#C7D3E8",
        text: e.type === "creation" ? `Nouveau lead — ${who}` : `${EVENT_LABEL[e.type as EventType] ?? e.type} — ${who}`,
        detail: e.content.length > 60 ? e.content.slice(0, 60) + "…" : e.content,
        href: `/admin/clients/${e.lead.client.id}`,
      };
    }),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  const balance = computeBalance(
    ledgerRows.map((r) => ({
      id: r.id,
      date: r.date,
      label: r.label,
      category: r.category,
      amountCents: r.amountCents,
      paidBy: r.paidBy as Partner,
      scope: r.scope as Scope,
      share: r.share,
      note: r.note,
    })),
  );

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="relative">
      <div className="adm-halos" />
      <AdminPage>
        {/* En-tête */}
        <div className="adm-enter mb-7" style={{ animationDelay: "0ms" }}>
          <div style={{ width: 24, height: 2, background: `linear-gradient(to right, ${T.accent}, transparent)` }} className="mb-3" />
          <h1 className="text-[26px] font-light" style={{ color: T.text, letterSpacing: "-0.01em" }}>
            Bonjour {name}
            <span className="ml-3 text-sm align-middle" style={{ color: T.muted }}>{today}</span>
          </h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
          <KpiTile index={0} label="Valeur du stock" value={stockValue} euro icon="banknote" hint="Annonces disponibles" />
          <KpiTile
            index={1}
            label="Disponibles"
            value={disponibles}
            icon="badge-check"
            delta={entriesThisMonth > 0 ? { value: entriesThisMonth, label: "entrée(s) ce mois" } : null}
            hint={entriesThisMonth === 0 ? "Aucune entrée ce mois" : undefined}
            spark={entriesSeries}
          />
          <KpiTile index={2} label="Vendus" value={vendus} icon="handshake" hint="Au total" />
          <KpiTile
            index={3}
            label="Devis en cours"
            value={devisEnCours}
            icon="file-text"
            hint={devisEnvoyes > 0 ? `${devisEnvoyes} en attente de réponse` : "Aucun devis envoyé"}
            spark={quotesSeries12}
          />
          <KpiTile
            index={4}
            label="Leads actifs"
            value={leadsActifs}
            icon="users"
            delta={leadsThisMonth > 0 ? { value: leadsThisMonth, label: "ce mois" } : null}
            hint={leadsThisMonth === 0 ? (leadsGagnes > 0 ? `${leadsGagnes} gagné${leadsGagnes > 1 ? "s" : ""} au total` : "Aucun lead ce mois") : undefined}
            spark={leadsSeries}
          />
        </div>

        {/* Relances à faire : le centre travaille seulement si on y pense, le bandeau y amène */}
        {relances.count > 0 && (
          <Link
            href="/admin/relances"
            className="adm-enter flex items-center gap-3 px-5 py-3 mb-5"
            style={{ backgroundColor: T.surface, border: "1px solid var(--adm-accent-border)" }}
          >
            <BellRing size={16} style={{ color: T.accent }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.accent }}>
                {relances.count} relance{relances.count > 1 ? "s" : ""} à faire
              </span>
              {" · "}
              <span className="font-semibold" style={{ color: T.text }}>{formatEuro(relances.total)}</span>
              {" en attente"}
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
              Ouvrir les relances
              <ChevronRight size={12} />
            </span>
          </Link>
        )}

        {/* Alerte factures impayées */}
        {impayeesCount > 0 && (
          <Link
            href="/admin/factures"
            className="adm-enter flex items-center gap-3 px-5 py-3 mb-5"
            style={{ backgroundColor: T.surface, border: "1px solid rgba(240,180,90,0.4)" }}
          >
            <ReceiptText size={16} style={{ color: T.warning }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.warning }}>
                {impayeesCount} facture{impayeesCount > 1 ? "s" : ""} impayée{impayeesCount > 1 ? "s" : ""}
              </span>
              {" · encours "}
              <span className="font-semibold" style={{ color: T.text }}>{formatEuro(encours)}</span>
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
              Voir les factures
              <ChevronRight size={12} />
            </span>
          </Link>
        )}

        {/* Alerte actions de réunion en retard */}
        {lateMeetingActions > 0 && (
          <Link
            href="/admin/reunions?vue=actions"
            className="adm-enter flex items-center gap-3 px-5 py-3 mb-5"
            style={{ backgroundColor: T.surface, border: "1px solid rgba(240,180,90,0.4)" }}
          >
            <NotebookPen size={16} style={{ color: T.warning }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.warning }}>
                {lateMeetingActions} action{lateMeetingActions > 1 ? "s" : ""} de réunion en retard
              </span>
              {" · décidée"}
              {lateMeetingActions > 1 ? "s" : ""} en réunion, échéance dépassée
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
              Voir les actions
              <ChevronRight size={12} />
            </span>
          </Link>
        )}

        {/* Alerte offres de reprise à relancer */}
        {offresQuiExpirent > 0 && (
          <Link
            href="/admin/reprises?statut=expiree"
            className="adm-enter flex items-center gap-3 px-5 py-3 mb-5"
            style={{ backgroundColor: T.surface, border: "1px solid rgba(240,180,90,0.4)" }}
          >
            <HandCoins size={16} style={{ color: T.warning }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.warning }}>
                {offresQuiExpirent} offre{offresQuiExpirent > 1 ? "s" : ""} de reprise
              </span>
              {` ${offresQuiExpirent > 1 ? "arrivent" : "arrive"} à échéance · un appel suffit souvent à conclure`}
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
              Voir les reprises
              <ChevronRight size={12} />
            </span>
          </Link>
        )}

        {/* Alerte garanties à échéance */}
        {expiringWarranties > 0 && (
          <Link
            href="/admin/garanties"
            className="adm-enter flex items-center gap-3 px-5 py-3 mb-5"
            style={{ backgroundColor: T.surface, border: "1px solid rgba(240,180,90,0.4)" }}
          >
            <ShieldCheck size={16} style={{ color: T.warning }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.warning }}>
                {expiringWarranties} garantie{expiringWarranties > 1 ? "s" : ""} à échéance
              </span>
              {" sous 60 jours · pensez à recontacter le client"}
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
              Voir les garanties
              <ChevronRight size={12} />
            </span>
          </Link>
        )}

        {/* Alerte dossiers d'immatriculation hors délai */}
        {lateRegistrations > 0 && (
          <Link
            href="/admin/immatriculations"
            className="adm-enter flex items-center gap-3 px-5 py-3 mb-5"
            style={{ backgroundColor: T.surface, border: "1px solid rgba(255,107,53,0.4)" }}
          >
            <FileBadge size={16} style={{ color: T.danger }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              <span className="font-semibold" style={{ color: T.danger }}>
                {lateRegistrations} dossier{lateRegistrations > 1 ? "s" : ""} d&apos;immatriculation hors délai
              </span>
              {" · quitus sous 15 jours, immatriculation sous 30 jours"}
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase" style={{ color: T.accent }}>
              Voir les dossiers
              <ChevronRight size={12} />
            </span>
          </Link>
        )}

        {/* Graphiques rangée 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
          <div className="adm-card adm-enter xl:col-span-2 p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "460ms" }}>
            <div className="adm-hairline" />
            <AreaChart
              title="Entrées en stock"
              subtitle="Fiches créées sur les 12 derniers mois"
              data={entriesSeries}
              labels={months12.map((m) => m.label)}
              format={{ unit: "fiche" }}
            />
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
            <Bars
              title="Devis créés"
              subtitle="6 derniers mois"
              data={quotesSeries6}
              labels={months6.map((m) => m.label)}
              format={{ unit: "devis" }}
            />
          </div>
          <div className="adm-card adm-enter xl:col-span-2 p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "700ms" }}>
            <div className="adm-hairline" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>Activité récente</h3>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm" style={{ color: T.muted }}>Aucune activité pour l&apos;instant.</p>
            ) : (
              <ul>
                {activity.map((a, i) => {
                  const Icon = ACTIVITY_ICON[a.icon];
                  return (
                    <li key={i}>
                      <Link
                        href={a.href}
                        className="flex items-center gap-3.5 py-2 transition-colors hover:text-[#F0F5FF]"
                        style={{ borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}
                      >
                        <span
                          className="flex items-center justify-center w-7 h-7 flex-shrink-0"
                          style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${T.border}` }}
                        >
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
            )}
          </div>
        </div>

        {/* RDV + alertes + comptes associés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="adm-card adm-enter p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "760ms" }}>
            <div className="adm-hairline" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs tracking-widest uppercase" style={{ color: T.textDim }}>Prochains RDV</h3>
              <Link href="/admin/planning" className="inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]" style={{ color: T.accent }}>
                Planning
                <ChevronRight size={12} />
              </Link>
            </div>
            {upcomingRdv.length === 0 ? (
              <p className="text-sm" style={{ color: T.muted }}>
                Rien de planifié.{" "}
                <Link href="/admin/planning" style={{ color: T.accent }}>Ouvrir le planning.</Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingRdv.map((r) => {
                  const c = TYPE_COLOR[(r.type as AppointmentType) ?? "autre"] ?? TYPE_COLOR.autre;
                  const todayK = toDateKey(new Date());
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const dayLabel =
                    r.date === todayK
                      ? "Aujourd'hui"
                      : r.date === toDateKey(tomorrow)
                        ? "Demain"
                        : new Date(`${r.date}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
                  const signature = signatureOf(r);
                  return (
                    <li key={r.id} className="flex items-center gap-2.5 min-w-0">
                      <span style={{ width: 8, height: 8, backgroundColor: c.bd, flexShrink: 0 }} />
                      <span className="text-[12px] truncate" style={{ color: T.textDim }}>
                        {r.type === "indispo" && r.person ? `${r.person} — ` : ""}
                        {r.title || TYPE_LABEL[(r.type as AppointmentType) ?? "autre"]}
                      </span>
                      {/* Même code couleur que le planning : rond = qui a créé l'événement. */}
                      {signature && (
                        <span
                          title={`Créé par ${signature}`}
                          style={{ display: "block", width: 7, height: 7, borderRadius: "50%", backgroundColor: authorColor(signature), flexShrink: 0 }}
                        />
                      )}
                      <span className="text-[10px] ml-auto flex-shrink-0 flex items-center gap-1" style={{ color: T.muted }}>
                        <CalendarClock size={10} />
                        {dayLabel} · {formatMin(r.startMin)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <InsightPanel title="À compléter" items={aCompleter} emptyLabel="Tout est complet ✓" showReasons delay={800} />
          <InsightPanel title="Masquées du public" items={masquees} emptyLabel="Aucune annonce masquée." delay={840} />
          <Link
            href="/admin/comptes"
            className="adm-card adm-enter p-5 flex flex-col justify-between"
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "900ms" }}
          >
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
            <span className="inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase mt-3" style={{ color: T.accent }}>
              Ouvrir les comptes
              <ChevronRight size={12} />
            </span>
          </Link>
        </div>

        {/* Dernières entrées : photo d'abord */}
        <div className="adm-enter flex items-center justify-between mb-3" style={{ animationDelay: "940ms" }}>
          <h2 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: T.muted }}>Dernières entrées</h2>
          <Link
            href="/admin/vehicules"
            className="inline-flex items-center gap-0.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
            style={{ color: T.textDim }}
          >
            Tout le stock
            <ChevronRight size={12} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
            Aucun véhicule pour l&apos;instant.{" "}
            <Link href="/admin/vehicules/nouveau" style={{ color: T.accent }}>Ajouter le premier.</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {recent.map((v, i) => (
              <Link
                key={v.id}
                href={`/admin/vehicules/${v.id}`}
                className="adm-veh adm-card adm-enter block min-w-0"
                style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: `${1000 + i * 80}ms` }}
              >
                <div className="overflow-hidden" style={{ aspectRatio: "16 / 10", backgroundColor: T.float }}>
                  {firstImage(v.images) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={firstImage(v.images)!} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car size={22} style={{ color: T.muted }} />
                    </div>
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
        )}
      </AdminPage>
    </div>
  );
}
