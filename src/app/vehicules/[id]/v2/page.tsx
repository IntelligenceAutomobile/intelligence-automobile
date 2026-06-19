import { redirect } from "next/navigation";

// La fiche v2 est désormais la page véhicule officielle (/vehicules/[id]).
// Cette route /v2 ne sert plus qu'à rediriger les anciens liens partagés.
export default async function VehiculeDetailV2Redirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/vehicules/${id}`);
}
