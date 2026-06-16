"use client";

import { useRouter } from "next/navigation";
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
      className="text-[11px] tracking-widest uppercase transition-colors hover:text-[#FF6B35]"
      style={{ color: T.muted }}
    >
      Déconnexion
    </button>
  );
}
