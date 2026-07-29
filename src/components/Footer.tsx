"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/context";
import WhatsAppIcon from "@/components/WhatsAppIcon";

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
            <div style={{ width: "34px", height: "2px", background: "linear-gradient(to right, #C6CCD6, rgba(198,204,214,0))", borderRadius: "2px", boxShadow: "0 0 8px rgba(198,204,214,0.35)", marginBottom: "0.9rem" }} />
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
            <div style={{ width: "34px", height: "2px", background: "linear-gradient(to right, #C6CCD6, rgba(198,204,214,0))", borderRadius: "2px", boxShadow: "0 0 8px rgba(198,204,214,0.35)", marginBottom: "0.9rem" }} />
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
            <div style={{ width: "34px", height: "2px", background: "linear-gradient(to right, #C6CCD6, rgba(198,204,214,0))", borderRadius: "2px", boxShadow: "0 0 8px rgba(198,204,214,0.35)", marginBottom: "0.9rem" }} />
            <h3
              className="text-[10px] font-semibold tracking-widest uppercase mb-5"
              style={{ color: "#6B9FEE" }}
            >
              {t.footer.contact}
            </h3>
            <ul className="space-y-3.5 text-sm" style={{ color: "#D4E2F4", fontWeight: 400 }}>
              <li>
                <a
                  href="https://wa.me/33620243879"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors duration-200"
                  style={{ color: "#D4E2F4" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#25D366")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#D4E2F4")}
                >
                  <WhatsAppIcon size={16} />
                  +33 6 20 24 38 79
                </a>
              </li>
              <li>Paris France</li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors duration-200"
                  style={{ color: "#D4E2F4" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#6B9FEE")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#D4E2F4")}
                >
                  {t.footer.contactCta}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="border-t mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "#1B3055" }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-xs" style={{ color: "#C8D8EE" }}>
              © {new Date().getFullYear()} Intelligence Automobile. {t.footer.rights}
            </p>
            <Link
              href="/mentions-legales"
              className="text-xs transition-colors duration-200"
              style={{ color: "#9DBFF2" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6B9FEE")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9DBFF2")}
            >
              {t.footer.legalLink}
            </Link>
            <Link
              href="/cgv"
              className="text-xs transition-colors duration-200"
              style={{ color: "#9DBFF2" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6B9FEE")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9DBFF2")}
            >
              {t.footer.cgvLink}
            </Link>
          </div>
          <p className="text-xs" style={{ color: "#9DBFF2" }}>
            {t.footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
