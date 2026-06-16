import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import { T, AdminPage, PageHeader, StatCard, StatusBadge, Thumb, firstImage } from "./ui";

type VehLite = { id: string; make: string; model: string; images: string; price: number };

function reasons(v: VehLite): string[] {
  const r: string[] = [];
  if (firstImage(v.images) === null) r.push("Sans photo");
  if (v.price <= 0) r.push("Prix manquant");
  return r;
}

function InsightPanel({
  title,
  items,
  emptyLabel,
  showReasons = false,
}: {
  title: string;
  items: VehLite[];
  emptyLabel: string;
  showReasons?: boolean;
}) {
  return (
    <div className="p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
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
                        style={{ border: "1px solid rgba(240,180,90,0.38)", color: "#F0B45A" }}
                      >
                        {r}
                      </span>
                    ))}
                  <span className="text-[11px] uppercase tracking-widest" style={{ color: T.accent }}>Compléter →</span>
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

  const [total, disponibles, reserves, vendus, valueAgg, recent, aCompleter, masquees] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: "disponible" } }),
    prisma.vehicle.count({ where: { status: "reserve" } }),
    prisma.vehicle.count({ where: { status: "vendu" } }),
    prisma.vehicle.aggregate({ _sum: { price: true }, where: { status: "disponible" } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.vehicle.findMany({
      where: { OR: [{ images: "[]" }, { price: { lte: 0 } }] },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.vehicle.findMany({ where: { isPublished: false }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const stockValue = valueAgg._sum.price ?? 0;

  return (
    <AdminPage>
      <PageHeader title="Tableau de bord" subtitle={`${total} véhicule${total > 1 ? "s" : ""} au total.`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Disponibles" value={disponibles} href="/admin/vehicules?statut=disponible" />
        <StatCard label="Réservés" value={reserves} href="/admin/vehicules?statut=reserve" />
        <StatCard label="Vendus" value={vendus} href="/admin/vehicules?statut=vendu" />
        <StatCard label="Valeur du stock" value={`${formatNumber(stockValue)} €`} hint="Annonces disponibles" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        <InsightPanel title="À compléter" items={aCompleter} emptyLabel="Tout est complet ✓" showReasons />
        <InsightPanel title="Masquées du public" items={masquees} emptyLabel="Aucune annonce masquée." />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm tracking-widest uppercase" style={{ color: T.textDim }}>Dernières entrées</h2>
        <Link href="/admin/vehicules" className="text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]" style={{ color: T.textDim }}>
          Tout le stock →
        </Link>
      </div>

      <div style={{ border: `1px solid ${T.border}` }}>
        {recent.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: T.textDim }}>
            Aucun véhicule pour l&apos;instant.{" "}
            <Link href="/admin/vehicules/nouveau" style={{ color: T.accent }}>
              Ajouter le premier.
            </Link>
          </div>
        ) : (
          recent.map((v, i) => (
            <Link
              key={v.id}
              href={`/admin/vehicules/${v.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[#0A1628]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <Thumb src={firstImage(v.images)} alt={`${v.make} ${v.model}`} w={64} h={48} />
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xs tracking-widest uppercase" style={{ color: T.accent }}>{v.make}</span>
                <span className="text-sm truncate" style={{ color: T.text }}>{v.model}</span>
                <span className="text-xs hidden sm:inline" style={{ color: T.muted }}>
                  {v.year} · {formatNumber(v.mileage)} km
                </span>
              </div>
              <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                <span className="text-sm font-semibold hidden sm:inline" style={{ color: T.text }}>{formatNumber(v.price)} €</span>
                {!v.isPublished && (
                  <span className="text-[10px] tracking-[0.15em] uppercase px-2 py-0.5" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
                    Masqué
                  </span>
                )}
                <StatusBadge status={v.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </AdminPage>
  );
}
