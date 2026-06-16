import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import {
  T,
  AdminPage,
  PageHeader,
  StatCard,
  StatusBadge,
  Thumb,
  firstImage,
  btnGhostClass,
  btnGhostStyle,
} from "./ui";

export default async function AdminDashboard() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const [total, disponibles, vendus] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: "disponible" } }),
    prisma.vehicle.count({ where: { status: "vendu" } }),
  ]);

  const recentVehicules = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <AdminPage>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre stock." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total véhicules" value={total} />
        <StatCard label="Disponibles" value={disponibles} />
        <StatCard label="Vendus" value={vendus} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm tracking-widest uppercase" style={{ color: T.textDim }}>
          Dernières entrées
        </h2>
        <Link href="/admin/vehicules" className={btnGhostClass} style={btnGhostStyle}>
          Tout le stock →
        </Link>
      </div>

      <div style={{ border: `1px solid ${T.border}` }}>
        {recentVehicules.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: T.textDim }}>
            Aucun véhicule pour l&apos;instant.{" "}
            <Link href="/admin/vehicules/nouveau" style={{ color: T.accent }}>
              Ajouter le premier.
            </Link>
          </div>
        ) : (
          recentVehicules.map((v, i) => (
            <Link
              key={v.id}
              href={`/admin/vehicules/${v.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[#0A1628]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <Thumb src={firstImage(v.images)} alt={`${v.make} ${v.model}`} w={64} h={48} />
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xs tracking-widest uppercase" style={{ color: T.accent }}>
                  {v.make}
                </span>
                <span className="text-sm truncate" style={{ color: T.text }}>
                  {v.model}
                </span>
                <span className="text-xs hidden sm:inline" style={{ color: T.muted }}>
                  {v.year} · {formatNumber(v.mileage)} km
                </span>
              </div>
              <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                <span className="text-sm font-semibold hidden sm:inline" style={{ color: T.text }}>
                  {formatNumber(v.price)} €
                </span>
                <StatusBadge status={v.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </AdminPage>
  );
}
