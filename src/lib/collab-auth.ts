import { cookies } from "next/headers";
import { getAdminSession } from "./auth";

// L'Atelier est désormais intégré au back-office : l'accès est protégé par la
// session admin, et le nom (César / Fab) sert uniquement à signer les notes.
export async function getCollabSession() {
  const admin = await getAdminSession();
  if (!admin) return null;

  const cookieStore = await cookies();
  const name = cookieStore.get("ia_collab_name")?.value;
  return { name: name?.trim() || "Anonyme" };
}
