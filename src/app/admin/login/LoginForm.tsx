"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle } from "../ui";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
      }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const json = await res.json();
      setError(json.error ?? "Erreur de connexion");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 sm:p-8"
      style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
    >
      <div>
        <label className={labelClass} style={{ color: T.textDim }}>
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 text-sm outline-none focus:border-[#6B9FEE]"
          style={fieldStyle}
        />
      </div>

      <div>
        <label className={labelClass} style={{ color: T.textDim }}>
          Mot de passe
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 text-sm outline-none focus:border-[#6B9FEE]"
          style={fieldStyle}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: T.danger }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={btnPrimaryClass + " w-full py-4"}
        style={btnPrimaryStyle}
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
