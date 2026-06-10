"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/context";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm({
  defaultVehicule,
  defaultService,
}: {
  defaultVehicule?: string;
  defaultService?: string;
}) {
  const { t } = useLocale();
  const f = t.contact.form;
  const [status, setStatus] = useState<Status>("idle");

  const getDefaultMessage = () => {
    if (defaultVehicule) return f.defaultVehicleMsg.replace("%v", defaultVehicule);
    if (defaultService === "mandat") return f.defaultMandatMsg;
    if (defaultService === "vente") return f.defaultVenteMsg;
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
            style={{ color: "#C8D8EE" }}
          >
            {f.nameLabel}
          </label>
          <input
            name="nom"
            required
            type="text"
            placeholder={f.namePlaceholder}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
          />
        </div>
        <div>
          <label
            className="block text-xs tracking-widest uppercase mb-3"
            style={{ color: "#C8D8EE" }}
          >
            {f.emailLabel}
          </label>
          <input
            name="email"
            required
            type="email"
            placeholder={f.emailPlaceholder}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
          />
        </div>
      </div>

      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-3"
          style={{ color: "#C8D8EE" }}
        >
          {f.phoneLabel}
        </label>
        <input
          name="telephone"
          type="tel"
          placeholder={f.phonePlaceholder}
          style={fieldStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
        />
      </div>

      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-3"
          style={{ color: "#C8D8EE" }}
        >
          {f.subjectLabel}
        </label>
        <select
          name="sujet"
          required
          defaultValue={getDefaultSubject()}
          style={{ ...fieldStyle, cursor: "pointer" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#6B9FEE")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1B3055")}
        >
          {f.subjects.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="block text-xs tracking-widest uppercase mb-3"
          style={{ color: "#C8D8EE" }}
        >
          {f.messageLabel}
        </label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder={f.messagePlaceholder}
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
        {status === "sending" ? f.submittingBtn : f.submitBtn}
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
          {f.successMsg}
        </div>
      )}
      {status === "error" && (
        <div
          className="p-5 text-sm"
          style={{
            borderLeft: "2px solid #C8D8EE",
            backgroundColor: "#040B16",
            color: "#C8D8EE",
          }}
        >
          {f.errorMsg}
        </div>
      )}
    </form>
  );
}
