import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/app/contact/ContactForm";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getTranslations } from "@/lib/i18n-server";

export const metadata = {
  title: "Contact — Intelligence Automobile",
};

export default async function ContactV2Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const [params, { t }] = await Promise.all([searchParams, getTranslations()]);
  const vehicule = params.vehicule;
  const service = params.service;
  const s = t.contact;

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>
        <style dangerouslySetInnerHTML={{ __html: ".wa-phone{color:#F0F5FF;transition:color .2s;} .wa-phone:hover{color:#25D366;}" }} />

        {/* ── HERO ── */}
        <section
          style={{
            position: "relative",
            height: "100svh",
            minHeight: "520px",
            overflow: "hidden",
          }}
        >
          <img
            src="/Photo du Site/Contact/Contact 2.png"
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: 1,
            }}
          />

          {/* Assombrit la gauche (le texte y est posé), laisse la scène visible à droite */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(7,15,30,0.92) 0%, rgba(7,15,30,0.55) 30%, rgba(7,15,30,0) 62%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "45%",
              background: "linear-gradient(to top, #070F1E, transparent)",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: "8vh",
              left: "6vw",
              right: "6vw",
              maxWidth: "560px",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2.6rem, 6vw, 5rem)",
                fontWeight: 900,
                lineHeight: 0.88,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                marginBottom: "1.8rem",
              }}
            >
              {s.heroTitle[0]}
              <br />
              <span style={{ color: "#6B9FEE" }}>{s.heroTitle[1]}</span>
            </h1>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ width: "36px", height: "1px", backgroundColor: "#6B9FEE", opacity: 0.45, marginBottom: "0.6rem" }} />
              <p
                style={{
                  color: "rgba(168,196,240,0.68)",
                  fontSize: "clamp(0.78rem, 1.1vw, 0.88rem)",
                  lineHeight: 1.8,
                  fontWeight: 300,
                  maxWidth: "440px",
                  fontStyle: "italic",
                  letterSpacing: "0.01em",
                }}
              >
                {s.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* ── CONTENU PRINCIPAL ── */}
        <section
          style={{
            backgroundColor: "#070F1E",
            borderTop: "1px solid #1B3055",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0">

              {/* ── COLONNE GAUCHE : Formulaire ── */}
              <div
                style={{
                  borderRight: "1px solid #1B3055",
                  padding: "6vh 4vw 6vh 0",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.35em",
                    textTransform: "uppercase",
                    color: "#6B9FEE",
                    marginBottom: "2.5rem",
                  }}
                >
                  {s.sendMessage}
                </p>
                <ContactForm defaultVehicule={vehicule} defaultService={service} />
              </div>

              {/* ── COLONNE DROITE : Infos ── */}
              <div style={{ padding: "6vh 0 6vh 3vw" }}>

                {/* Coordonnées */}
                <div style={{ marginBottom: "2rem" }}>
                  {s.info.map((item, i) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "1.25rem 0",
                        borderTop: "1px solid #1B3055",
                        ...(i === s.info.length - 1 ? { borderBottom: "1px solid #1B3055" } : {}),
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "10px",
                          letterSpacing: "0.35em",
                          textTransform: "uppercase",
                          color: "#6B9FEE",
                          marginBottom: "0.3rem",
                        }}
                      >
                        {item.label}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: "#F0F5FF" }}>
                        {item.value.startsWith("+") ? (
                          <a
                            href="https://wa.me/qr/M27WU5KOY6H5D1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wa-phone inline-flex items-center gap-2"
                            style={{ textDecoration: "none" }}
                          >
                            <WhatsAppIcon size={15} />
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Encadré Première prise de contact */}
                <div
                  style={{
                    backgroundColor: "#040B16",
                    borderLeft: "2px solid #6B9FEE",
                    padding: "24px",
                    marginTop: "2rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#F0F5FF",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {s.firstContactTitle}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.65,
                      color: "#C8D8EE",
                    }}
                  >
                    {s.firstContactText}
                  </p>
                </div>

                {/* Services rapides */}
                <div style={{ marginTop: "2.5rem" }}>
                  <p
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.35em",
                      textTransform: "uppercase",
                      color: "#6B9FEE",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {s.servicesLabel}
                  </p>
                  <div>
                    {s.services.map((sv) => (
                      <a
                        key={sv.label}
                        href={sv.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "1rem 0",
                          borderTop: "1px solid #1B3055",
                          textDecoration: "none",
                          transition: "color 0.2s",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#C8D8EE",
                          }}
                        >
                          {sv.label}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#6B9FEE" }}>
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
