"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { T } from "./ui";

export default function AdminLogout() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#FF6B35]"
      style={{ color: T.muted }}
    >
      <LogOut size={13} />
      Déconnexion
    </button>
  );
}
