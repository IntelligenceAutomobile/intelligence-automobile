// Coquille de la démonstration publique /demopro.
//
// ⚠️ Zéro accès base : ce layout n'appelle NI getAdminSession NI Prisma. Il monte
// un utilisateur fictif et réutilise uniquement les briques visuelles neutres du
// back-office (styles, toasts, jetons de couleur). L'accent est figé en dur.
import Link from "next/link";
import { LogoFull } from "@/components/Header";
import { ToastProvider } from "@/app/admin/toast";
import { T } from "@/app/admin/ui";
import DemoSidebar from "./DemoSidebar";
import DemoTopbar from "./DemoTopbar";
import DemoNav from "./DemoNav";
import DemoBanner from "./DemoBanner";
import { DEMO_BASE } from "./demo";
import "@/app/admin/admin.css";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div
        className="adm-root min-h-screen flex"
        style={{ backgroundColor: T.bg, color: T.text, ["--adm-accent" as never]: "#6B9FEE" }}
      >
        <DemoSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <DemoBanner />

          {/* Mobile : logo + nav horizontale (la sidebar est masquée sous lg) */}
          <div className="lg:hidden" style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.surfaceAlt }}>
            <div className="flex items-center justify-between px-4 pt-3">
              <Link href={DEMO_BASE}>
                <LogoFull markHeight={32} layout="row" textScale={0.66} />
              </Link>
            </div>
            <div className="px-2 overflow-x-auto">
              <DemoNav />
            </div>
          </div>

          <DemoTopbar />

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
