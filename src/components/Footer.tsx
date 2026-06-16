"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/context";

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16" style={{ fontFamily: "var(--font-inter)" }}>

        {/* Liens & contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div style={{ width: "24px", height: "2px", backgroundColor: "#6B9FEE", marginBottom: "0.75rem" }} />
            <h3
              className="text-[10px] font-semibold tracking-widest uppercase mb-5"
              style={{ color: "#6B9FEE" }}
            >
              {t.footer.navigation}
            </h3>
            <ul className="space-y-3.5">
              {t.footer.navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#D4E2F4" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#6B9FEE")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#D4E2F4")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ width: "24px", height: "2px", backgroundColor: "#6B9FEE", marginBottom: "0.75rem" }} />
            <h3
              className="text-[10px] font-semibold tracking-widest uppercase mb-5"
              style={{ color: "#6B9FEE" }}
            >
              {t.footer.services}
            </h3>
            <ul className="space-y-3.5">
              {t.footer.serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#D4E2F4" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#6B9FEE")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#D4E2F4")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ width: "24px", height: "2px", backgroundColor: "#6B9FEE", marginBottom: "0.75rem" }} />
            <h3
              className="text-[10px] font-semibold tracking-widest uppercase mb-5"
              style={{ color: "#6B9FEE" }}
            >
              {t.footer.contact}
            </h3>
            <ul className="space-y-3.5 text-sm" style={{ color: "#D4E2F4", fontWeight: 400 }}>
              <li>contact@intelligenceautomobile.com</li>
              <li>+33 (0)6 00 00 00 00</li>
              <li>France</li>
            </ul>
          </div>
        </div>

        <div
          className="border-t mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "#1B3055" }}
        >
          <p className="text-xs" style={{ color: "#C8D8EE" }}>
            © {new Date().getFullYear()} Intelligence Automobile. {t.footer.rights}
          </p>
          <p className="text-xs" style={{ color: "rgba(107,159,238,0.35)" }}>
            {t.footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
