import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { LogoFull } from "@/components/Header";
import AdminNav from "./AdminNav";
import AdminLogout from "./AdminLogout";
import { T, AccentLine, btnPrimaryClass, btnPrimaryStyle } from "./ui";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // Non connecté (page de login) : aucun habillage, la page gère son plein écran.
  if (!session) return <>{children}</>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: T.bg, color: T.text }}>
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: "rgba(7,15,30,0.82)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      >
        <AccentLine />
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap" style={{ paddingTop: 14, paddingBottom: 14 }}>
            <Link href="/admin" className="flex-shrink-0">
              <LogoFull markHeight={40} layout="row" textScale={0.78} />
            </Link>
            <div className="h-5 w-px hidden sm:block" style={{ backgroundColor: T.border }} />
            <AdminNav />

            <div className="ml-auto flex items-center gap-3 sm:gap-5 flex-shrink-0">
              <Link href="/admin/vehicules/nouveau" className={btnPrimaryClass} style={btnPrimaryStyle}>
                + Ajouter
              </Link>
              <Link
                href="/"
                target="_blank"
                className="hidden sm:inline text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
                style={{ color: T.textDim }}
              >
                Voir le site →
              </Link>
              <AdminLogout />
            </div>
          </div>
        </div>
        <div style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)" }} />
      </header>

      <main>{children}</main>
    </div>
  );
}
