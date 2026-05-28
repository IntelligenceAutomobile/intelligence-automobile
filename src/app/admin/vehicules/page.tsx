import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DeleteVehiculeButton from "./DeleteVehiculeButton";

export default async function AdminVehiculesList() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const vehicules = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0B1930", color: "#F0F5FF" }}
    >
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
      >
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs tracking-widest uppercase" style={{ color: "#8AABD4" }}>
            ← Dashboard
          </Link>
          <span className="text-sm font-semibold" style={{ color: "#F0F5FF" }}>
            Gestion du stock
          </span>
        </div>
        <Link
          href="/admin/vehicules/nouveau"
          className="text-xs font-semibold tracking-widest uppercase px-4 py-2"
          style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
        >
          + Ajouter
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="border" style={{ borderColor: "#1B3055" }}>
          {vehicules.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: "#8AABD4" }}>
              Aucun véhicule.{" "}
              <Link href="/admin/vehicules/nouveau" style={{ color: "#6B9FEE" }}>
                Ajouter le premier.
              </Link>
            </div>
          ) : (
            vehicules.map((v, i) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 gap-3"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid #1B3055",
                }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs tracking-widest uppercase"
                      style={{ color: "#6B9FEE" }}
                    >
                      {v.make}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "#F0F5FF" }}>
                      {v.model}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "#8AABD4" }}>
                    {v.year} · {v.mileage.toLocaleString("fr-FR")} km · {v.fuel} · {v.origin}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#F0F5FF" }}
                  >
                    {v.price.toLocaleString("fr-FR")} €
                  </span>
                  <span
                    className="text-xs px-2 py-0.5"
                    style={{
                      backgroundColor: v.status === "disponible" ? "#6B9FEE" : "#1B3055",
                      color: v.status === "disponible" ? "#0B1930" : "#8AABD4",
                    }}
                  >
                    {v.status}
                  </span>
                  <Link
                    href={`/vehicules/${v.id}`}
                    className="text-xs tracking-widest uppercase"
                    style={{ color: "#8AABD4" }}
                    target="_blank"
                  >
                    Voir
                  </Link>
                  <Link
                    href={`/admin/vehicules/${v.id}`}
                    className="text-xs tracking-widest uppercase"
                    style={{ color: "#6B9FEE" }}
                  >
                    Modifier
                  </Link>
                  <DeleteVehiculeButton id={v.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
