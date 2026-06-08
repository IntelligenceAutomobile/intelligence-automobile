import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import VehiculeForm from "@/components/VehiculeForm";

export default async function NouveauVehiculePage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0B1930", color: "#F0F5FF" }}
    >
      <div
        className="border-b px-6 py-4 flex items-center gap-4"
        style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
      >
        <Link href="/admin/vehicules" className="text-xs tracking-widest uppercase" style={{ color: "#C8D8EE" }}>
          ← Stock
        </Link>
        <span className="text-sm font-semibold" style={{ color: "#F0F5FF" }}>
          Ajouter un véhicule
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <VehiculeForm />
      </div>
    </div>
  );
}
