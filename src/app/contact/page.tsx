import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact — Intelligence Automobile",
  description:
    "Contactez Intelligence Automobile pour votre projet d'achat, d'import ou de vente de véhicule premium.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const vehicule = params.vehicule;
  const service = params.service;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", paddingTop: "80px", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Parlons de votre projet
            </p>
            <h1
              className="font-black uppercase leading-[0.9] mb-8"
              style={{
                fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                letterSpacing: "-0.025em",
              }}
            >
              Écrivez-
              <br />
              <span style={{ color: "#6B9FEE" }}>nous.</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-lg"
              style={{ color: "#C8D8EE", fontWeight: 400 }}
            >
              Décrivez-nous votre projet en quelques mots. Nous vous répondons
              sous 24h et vous orientons vers la solution la plus adaptée à votre
              situation.
            </p>
          </div>
        </section>

        {/* ── CONTENU PRINCIPAL ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0">

              {/* ── FORMULAIRE ── */}
              <div
                className="py-16 lg:py-24 lg:pr-16"
                style={{ borderRight: "1px solid #1B3055" }}
              >
                <p
                  className="text-xs tracking-[0.35em] uppercase mb-10"
                  style={{ color: "#6B9FEE" }}
                >
                  Envoyer un message
                </p>
                <ContactForm defaultVehicule={vehicule} defaultService={service} />
              </div>

              {/* ── SIDEBAR INFOS ── */}
              <div className="py-16 lg:py-24 lg:pl-12">

                {/* Coordonnées */}
                <p
                  className="text-xs tracking-[0.35em] uppercase mb-8"
                  style={{ color: "#6B9FEE" }}
                >
                  Nos coordonnées
                </p>

                <div className="space-y-0 mb-12">
                  {[
                    {
                      label: "Email",
                      value: "contact@intelligenceautomobile.com",
                    },
                    {
                      label: "Téléphone",
                      value: "+33 (0)6 00 00 00 00",
                    },
                    {
                      label: "Zone d'activité",
                      value: "France · Import DE & BE",
                    },
                    {
                      label: "Réponse",
                      value: "Sous 24h ouvrées",
                    },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      className="py-5"
                      style={{ borderTop: i === 0 ? "1px solid #1B3055" : "1px solid #1B3055" }}
                    >
                      <span
                        className="block text-xs tracking-widest uppercase mb-1"
                        style={{ color: "#6B9FEE" }}
                      >
                        {item.label}
                      </span>
                      <span className="text-sm" style={{ color: "#F0F5FF" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #1B3055" }} />
                </div>

                {/* Note rassurante */}
                <div
                  className="p-6"
                  style={{
                    backgroundColor: "#040B16",
                    borderLeft: "2px solid #6B9FEE",
                  }}
                >
                  <h3
                    className="font-black uppercase mb-3"
                    style={{ fontSize: "0.75rem", letterSpacing: "0.06em", color: "#F0F5FF" }}
                  >
                    Première prise de contact
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#C8D8EE" }}>
                    Pas besoin de préparer un dossier complet. Un message suffit :
                    dites-nous ce que vous cherchez — acheter, importer ou vendre —
                    et nous prendrons le temps de vous orienter.
                  </p>
                </div>

                {/* Services rapides */}
                <div className="mt-10">
                  <p
                    className="text-xs tracking-[0.35em] uppercase mb-6"
                    style={{ color: "#6B9FEE" }}
                  >
                    Nos services
                  </p>
                  <div className="space-y-0">
                    {[
                      { label: "Achat · Revente", href: "/services#achat-revente" },
                      { label: "Mandat d'import", href: "/services#mandat-import" },
                      { label: "Aide à la vente", href: "/services#aide-vente" },
                    ].map((s, i) => (
                      <a
                        key={s.label}
                        href={s.href}
                        className="flex items-center justify-between py-4 group transition-colors duration-200"
                        style={{ borderTop: i === 0 ? "1px solid #1B3055" : "1px solid #1B3055" }}
                      >
                        <span
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{ color: "#C8D8EE" }}
                        >
                          {s.label}
                        </span>
                        <span
                          className="text-xs transition-transform duration-300 group-hover:translate-x-1"
                          style={{ color: "#6B9FEE" }}
                        >
                          →
                        </span>
                      </a>
                    ))}
                    <div style={{ borderTop: "1px solid #1B3055" }} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
