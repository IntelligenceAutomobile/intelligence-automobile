"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm({
  defaultVehicule,
  defaultService,
}: {
  defaultVehicule?: string;
  defaultService?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  const getDefaultMessage = () => {
    if (defaultVehicule) return `Bonjour, je suis intéressé(e) par le véhicule : ${defaultVehicule}. Pouvez-vous me donner plus d'informations ?`;
    if (defaultService === "mandat") return "Bonjour, je souhaite vous confier un mandat d'import. Voici mon besoin : ";
    if (defaultService === "vente") return "Bonjour, je souhaite être accompagné(e) dans la vente de mon véhicule. ";
    return "";
  };

  const getDefaultSubject = () => {
    if (defaultVehicule) return "achat";
    if (defaultService === "mandat") return "mandat";
    if (defaultService === "vente") return "vente";
    return "achat";
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: data.get("nom"),
          email: data.get("email"),
          telephone: data.get("telephone"),
          sujet: data.get("sujet"),
          message: data.get("message"),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const fieldStyle: React.CSSProperties = {
    backgroundColor: "#040B16",
    borderColor: "#1B3055",
    color: "#F0F5FF",
    outline: "none",
    width: "100%",
    padding: "14px 16px",
    fontSize: "0.875rem",
    border: "1px solid #1B3055",
    transition: "border-color 0.2s",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            className="block text-xs tracking-widest uppercase mb-3"
            style={{ color: "#8AABD4" }}
          >
            Nom *
          </label>
          <input
            name="nom"
            required
            type="text"
            placeholder="Votre nom"
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
          />
        </div>
        <div>
          <label
            className="block text-xs tracking-widest uppercase mb-3"
            style={{ color: "#8AABD4" }}
          >
            Email *
          </label>
          <input
            name="email"
            required
            type="email"
            placeholder="votre@email.fr"
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
          />
        </div>
      </div>

      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-3"
          style={{ color: "#8AABD4" }}
        >
          Téléphone
        </label>
        <input
          name="telephone"
          type="tel"
          placeholder="+33 6 00 00 00 00"
          style={fieldStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
        />
      </div>

      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-3"
          style={{ color: "#8AABD4" }}
        >
          Sujet *
        </label>
        <select
          name="sujet"
          required
          defaultValue={getDefaultSubject()}
          style={{ ...fieldStyle, cursor: "pointer" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
        >
          <option value="achat">Achat d&apos;un véhicule</option>
          <option value="mandat">Mandat d&apos;import</option>
          <option value="vente">Aide à la vente</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-3"
          style={{ color: "#8AABD4" }}
        >
          Message *
        </label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Décrivez votre projet..."
          defaultValue={getDefaultMessage()}
          style={{ ...fieldStyle, resize: "none" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full text-sm font-semibold tracking-widest uppercase py-4 rounded-full transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
      >
        {status === "sending" ? "Envoi en cours..." : "Envoyer le message"}
      </button>

      {status === "success" && (
        <div
          className="p-5 text-sm"
          style={{
            borderLeft: "2px solid #6B9FEE",
            backgroundColor: "#040B16",
            color: "#6B9FEE",
          }}
        >
          Message envoyé. Nous vous répondrons sous 24h ouvrées.
        </div>
      )}
      {status === "error" && (
        <div
          className="p-5 text-sm"
          style={{
            borderLeft: "2px solid #8AABD4",
            backgroundColor: "#040B16",
            color: "#8AABD4",
          }}
        >
          Une erreur s&apos;est produite. Contactez-nous directement par email.
        </div>
      )}
    </form>
  );
}
