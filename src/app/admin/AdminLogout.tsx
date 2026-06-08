"use client";

import { useRouter } from "next/navigation";

export default function AdminLogout() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs tracking-widest uppercase transition-colors"
      style={{ color: "#C8D8EE" }}
    >
      Déconnexion
    </button>
  );
}
