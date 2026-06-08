import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminLogout from "./AdminLogout";
import { LogoFull } from "@/components/Header";

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
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0B1930", color: "#F0F5FF" }}
    >
      {/* Header admin */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
      >
        <div className="flex items-center gap-5">
          <LogoFull markHeight={44} layout="row" />
          <div className="h-5 w-px" style={{ backgroundColor: "#1B3055" }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: "#C8D8EE" }}>
            Administration
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs tracking-widest uppercase"
            style={{ color: "#C8D8EE" }}
          >
            Voir le site →
          </Link>
          <AdminLogout />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total véhicules", value: total },
            { label: "Disponibles", value: disponibles },
            { label: "Vendus", value: vendus },
          ].map((s) => (
            <div
              key={s.label}
              className="p-6 border"
              style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
            >
              <div
                className="text-3xl font-light mb-1"
                style={{ color: "#6B9FEE" }}
              >
                {s.value}
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "#C8D8EE" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="flex gap-4 mb-10">
          <Link
            href="/admin/vehicules/nouveau"
            className="text-sm font-semibold tracking-widest uppercase px-6 py-3"
            style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
          >
            + Ajouter un véhicule
          </Link>
          <Link
            href="/admin/vehicules"
            className="text-sm font-semibold tracking-widest uppercase px-6 py-3 border"
            style={{ borderColor: "#1B3055", color: "#C8D8EE" }}
          >
            Gérer le stock
          </Link>
        </div>

        {/* Derniers véhicules */}
        <div>
          <h2
            className="text-lg font-light mb-4"
            style={{ color: "#F0F5FF" }}
          >
            Dernières entrées
          </h2>
          <div className="border" style={{ borderColor: "#1B3055" }}>
            {recentVehicules.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "#C8D8EE" }}>
                Aucun véhicule pour l&apos;instant.{" "}
                <Link href="/admin/vehicules/nouveau" style={{ color: "#6B9FEE" }}>
                  Ajouter le premier.
                </Link>
              </div>
            ) : (
              recentVehicules.map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid #1B3055",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="text-xs tracking-widest uppercase"
                      style={{ color: "#6B9FEE" }}
                    >
                      {v.make}
                    </span>
                    <span className="text-sm" style={{ color: "#F0F5FF" }}>
                      {v.model}
                    </span>
                    <span className="text-xs" style={{ color: "#C8D8EE" }}>
                      {v.year} · {v.mileage.toLocaleString("fr-FR")} km
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#F0F5FF" }}
                    >
                      {v.price.toLocaleString("fr-FR")} €
                    </span>
                    <span
                      className="text-xs px-2 py-0.5"
                      style={{
                        backgroundColor: v.status === "disponible" ? "#6B9FEE" : "#1B3055",
                        color: v.status === "disponible" ? "#0B1930" : "#C8D8EE",
                      }}
                    >
                      {v.status}
                    </span>
                    <Link
                      href={`/admin/vehicules/${v.id}`}
                      className="text-xs tracking-widest uppercase"
                      style={{ color: "#6B9FEE" }}
                    >
                      Modifier
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
