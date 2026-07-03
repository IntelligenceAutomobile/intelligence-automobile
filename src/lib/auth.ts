import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("ia_session")?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { admin: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // deleteMany : idempotent si deux requêtes concurrentes purgent la même session expirée.
    await prisma.session.deleteMany({ where: { id: sessionId } });
    return null;
  }

  return session;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  return session;
}
