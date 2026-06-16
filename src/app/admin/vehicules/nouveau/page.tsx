import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import VehiculeForm from "@/components/VehiculeForm";
import { T, AdminPage, PageHeader } from "../../ui";

export default async function NouveauVehiculePage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return (
    <AdminPage width="narrow">
      <Link
        href="/admin/vehicules"
        className="inline-block text-[11px] tracking-widest uppercase mb-6 transition-colors hover:text-[#F0F5FF]"
        style={{ color: T.muted }}
      >
        ← Stock
      </Link>
      <PageHeader title="Ajouter un véhicule" subtitle="Renseignez la fiche puis ajoutez les photos." />
      <VehiculeForm />
    </AdminPage>
  );
}
