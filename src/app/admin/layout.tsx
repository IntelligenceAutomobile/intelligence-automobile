import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { relancesDues } from "@/lib/relances-server";
import { asRole, voitAudience } from "@/lib/roles";
import { LogoFull } from "@/components/Header";
import AdminNav from "./AdminNav";
import AdminLogout from "./AdminLogout";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AcceptationsWatcher from "./AcceptationsWatcher";
import { ToastProvider } from "./toast";
import { T } from "./ui";
import "./admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // Non connecté (page de login) : aucun habillage, la page gère son plein écran.
  if (!session) return <>{children}</>;

  const cookieStore = await cookies();
  const name = cookieStore.get("ia_collab_name")?.value?.trim() || session.admin.email.split("@")[0];

  // Thème marque blanche (une ligne "default" ; valeurs de repli sans écriture).
  const theme = await prisma.brandTheme.findUnique({ where: { id: "default" } });
  const brandName = theme?.name || "Intelligence Automobile";
  const brandTagline = theme?.tagline || "Back-office";
  const accent = theme?.accent || "#6B9FEE";
  const isShowroom = process.env.SHOWROOM === "1";
  const role = asRole(session.admin.role);
  // Écran d'audience : réservé nominativement, la ligne de menu et la palette
  // de commandes l'ignorent pour tous les autres comptes.
  const audience = voitAudience(session.admin.email);

  // Badge « relances à faire » de la navigation : la page travaille seulement
  // si on pense à l'ouvrir, le compteur y amène.
  const relances = await relancesDues();

  return (
    <ToastProvider>
      <div
        className="adm-root min-h-screen flex"
        style={{ backgroundColor: T.bg, color: T.text, ["--adm-accent" as never]: accent }}
      >
        {/* Annonce des devis signés en ligne, où que l'on soit dans l'outil. */}
        <AcceptationsWatcher />

        <Sidebar name={name} role={role} audience={audience} brandName={brandName} brandTagline={brandTagline} showroom={isShowroom} relanceCount={relances.count} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile : logo + nav horizontale (la sidebar est masquée sous lg) */}
          <div className="lg:hidden" style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.surfaceAlt }}>
            <div className="flex items-center justify-between px-4 pt-3">
              <Link href="/admin">
                <LogoFull markHeight={32} layout="row" textScale={0.66} />
              </Link>
              <AdminLogout />
            </div>
            <div className="px-2 overflow-x-auto">
              <AdminNav />
            </div>
          </div>

          <Topbar role={role} audience={audience} />

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
