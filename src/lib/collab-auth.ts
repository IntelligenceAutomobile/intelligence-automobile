import { cookies } from "next/headers";

export async function getCollabSession() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("ia_collab")?.value;
  const name = cookieStore.get("ia_collab_name")?.value;

  if (!auth || auth !== process.env.COLLAB_PASSWORD) return null;

  return { name: name ?? "Anonyme" };
}
