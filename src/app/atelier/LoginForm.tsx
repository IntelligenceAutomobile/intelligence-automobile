"use client";

import { useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/collab/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: data.get("password"),
        name: data.get("name"),
      }),
    });

    if (res.ok) {
      window.location.href = "/atelier";
    } else {
      const json = await res.json();
      setError(json.error ?? "Mot de passe incorrect");
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: "#0B1930",
    borderColor: "#1B3055",
    color: "#F0F5FF",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-8 border"
      style={{ borderColor: "#1B3055", backgroundColor: "#112240" }}
    >
      <div className="mb-6">
        <div
          className="text-xs tracking-widest uppercase mb-1"
          style={{ color: "#8AABD4" }}
        >
          Intelligence Automobile
        </div>
        <div className="text-lg font-light" style={{ color: "#F0F5FF" }}>
          Espace équipe
        </div>
      </div>

      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#8AABD4" }}
        >
          Qui êtes-vous ?
        </label>
        <select
          name="name"
          required
          defaultValue=""
          className="w-full px-4 py-3 border text-sm outline-none"
          style={inputStyle}
        >
          <option value="" disabled>—</option>
          <option value="César">César</option>
          <option value="Fab">Fab</option>
        </select>
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
          autoComplete="off"
          className="w-full px-4 py-3 border text-sm outline-none"
          style={inputStyle}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#E5635A" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-sm font-semibold tracking-widest uppercase py-4 transition-opacity disabled:opacity-50"
        style={{ backgroundColor: "#6B9FEE", color: "#0B1930" }}
      >
        {loading ? "..." : "Accéder"}
      </button>
    </form>
  );
}
