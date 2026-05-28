"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const inputStyle = {
    backgroundColor: "#112240",
    borderColor: "#1B3055",
    color: "#F0F5FF",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#8AABD4" }}
        >
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 border text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#8AABD4" }}
        >
          Mot de passe
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 border text-sm outline-none"
          style={inputStyle}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#8AABD4" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-sm font-semibold tracking-widest uppercase py-4 transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
