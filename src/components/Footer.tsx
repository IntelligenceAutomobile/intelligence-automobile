"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16" style={{ fontFamily: "var(--font-inter)" }}>

        {/* Liens & contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3
              className="text-[10px] font-semibold tracking-widest uppercase mb-5"
              style={{ color: "#6B9FEE" }}
            >
              Navigation
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/vehicules", label: "Nos véhicules" },
                { href: "/services", label: "Services" },
                { href: "/methode", label: "Notre méthode" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#C8D8EE" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#6B9FEE")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#C8D8EE")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className="text-[10px] font-semibold tracking-widest uppercase mb-5"
              style={{ color: "#6B9FEE" }}
            >
              Services
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/services#achat-revente", label: "Achat · Revente" },
                { href: "/services#mandat-import", label: "Mandat d'import" },
                { href: "/services#aide-vente", label: "Aide à la vente" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#C8D8EE" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#6B9FEE")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#C8D8EE")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className="text-[10px] font-semibold tracking-widest uppercase mb-5"
              style={{ color: "#6B9FEE" }}
            >
              Contact
            </h3>
            <ul className="space-y-3 text-sm" style={{ color: "#C8D8EE", fontWeight: 400 }}>
              <li>contact@intelligence-automobile.fr</li>
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
            © {new Date().getFullYear()} Intelligence Automobile. Tous droits réservés.
          </p>
          <p className="text-xs" style={{ color: "#1B3055" }}>
            Import premium · Allemagne · Belgique → France
          </p>
        </div>
      </div>
    </footer>
  );
}
