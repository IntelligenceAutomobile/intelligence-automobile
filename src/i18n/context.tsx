"use client";

import { createContext, useContext, useState } from "react";
import { fr } from "./fr";
import { en } from "./en";
import type { Translations } from "./fr";

interface LocaleContextType {
  locale: string;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextType>({ locale: "fr", t: fr });

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: string;
  children: React.ReactNode;
}) {
  const [locale] = useState(initialLocale);
  const t = locale === "en" ? en : fr;

  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function LanguageSwitcher() {
  const { locale } = useLocale();

  function switchTo(newLocale: string) {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  const active: React.CSSProperties = {
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#F0F5FF",
    background: "none",
    border: "none",
    cursor: "default",
    padding: 0,
    lineHeight: 1,
  };

  const inactive: React.CSSProperties = {
    ...active,
    fontWeight: 400,
    color: "rgba(255,255,255,0.32)",
    cursor: "pointer",
    transition: "color 0.2s",
  };

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}
      onMouseEnter={(e) => {
        const btns = e.currentTarget.querySelectorAll("button");
        btns.forEach((b) => {
          if (b.dataset.locale !== locale) b.style.color = "rgba(255,255,255,0.65)";
        });
      }}
      onMouseLeave={(e) => {
        const btns = e.currentTarget.querySelectorAll("button");
        btns.forEach((b) => {
          if (b.dataset.locale !== locale) b.style.color = "rgba(255,255,255,0.32)";
        });
      }}
    >
      <button
        data-locale="fr"
        onClick={() => locale !== "fr" && switchTo("fr")}
        style={locale === "fr" ? active : inactive}
        aria-label="Français"
      >
        FR
      </button>
      <span style={{ fontSize: "8px", color: "#1B3055", lineHeight: 1, userSelect: "none" }}>|</span>
      <button
        data-locale="en"
        onClick={() => locale !== "en" && switchTo("en")}
        style={locale === "en" ? active : inactive}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
