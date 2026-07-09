import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Archive des textes — page de test",
  robots: { index: false, follow: false },
};

type Entry = {
  page: string;
  oldFr: string;
  newFr: string;
  oldEn: string;
  newEn: string;
};

const ENTRIES: Entry[] = [
  {
    page: "/vehicules — sous-titre hero (t.vehicles.heroSubtitle)",
    oldFr: "Chaque véhicule soigneusement sélectionné auprès de partenaires européens, contrôlé, documenté, prêt à livrer.",
    newFr: "Sélectionnés en Europe, contrôlés, documentés, prêts à livrer.",
    oldEn: "Every vehicle carefully selected from European partners, inspected, documented, ready to deliver.",
    newEn: "Selected across Europe, inspected, documented, ready to deliver.",
  },
  {
    page: "/recherche-personnalisee — sous-titre hero (t.search.heroSubtitle)",
    oldFr: "Dites-nous ce que vous recherchez. Nous vous soumettons une sélection validée, sans engagement.",
    newFr: "Dites-nous ce qu'il vous faut. On s'occupe du reste.",
    oldEn: "Tell us what you're looking for. We submit a validated selection, no commitment.",
    newEn: "Tell us what you need. We take it from there.",
  },
  {
    page: "/revente-sur-mesure — sous-titre hero (t.resale.heroSubtitle)",
    oldFr: "Estimation au prix du marché réel, diffusion ciblée, transaction sécurisée. Vous vendez mieux, sans vous en occuper.",
    newFr: "Estimation juste, diffusion ciblée, transaction sécurisée.",
    oldEn: "Valuation at real market price, targeted listing, secured transaction. Sell better, without the hassle.",
    newEn: "Fair valuation, targeted listing, secured transaction.",
  },
  {
    page: "/transport-livraison — sous-titre hero (t.transport.heroSubtitle)",
    oldFr: "Conducteur professionnel, couverture assurance complète, photos avant et après. Nous acheminons votre véhicule en toute sécurité.",
    newFr: "Votre véhicule acheminé, assuré, documenté.",
    oldEn: "Professional driver, full insurance cover, before and after photos. We transport your vehicle safely.",
    newEn: "Your vehicle transported, insured, documented.",
  },
  {
    page: "/methode — sous-titre hero (t.method.heroSubtitle)",
    oldFr: "L'import premium, simplement. Nous trouvons le bon véhicule, vérifions l'essentiel et sécurisons chaque étape. Notre travail, c'est votre tranquillité d'esprit.",
    newFr: "Recherche, vérification, sécurisation. Votre tranquillité d'esprit.",
    oldEn: "Premium import, simply. We find the right vehicle, check what matters and secure every step. Our job is your peace of mind.",
    newEn: "Search, verification, security. Your peace of mind.",
  },
  {
    page: "/services — sous-titre hero (t.services.heroSubtitle)",
    oldFr: "De la garantie à la carte grise définitive, nous gérons les démarches qui sécurisent votre acquisition. Vous conduisez, nous nous occupons du reste.",
    newFr: "De la garantie à la carte grise, on gère tout.",
    oldEn: "From the warranty to the final registration certificate, we manage the steps that secure your acquisition. You drive, we handle the rest.",
    newEn: "From the warranty to the registration, we handle it all.",
  },
];

export default function ArchiveTextesTestPage() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF", minHeight: "100vh" }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12" style={{ paddingTop: "140px", paddingBottom: "8rem" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.32em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "1rem" }}>
            Archive · pour revenir en arrière si besoin
          </p>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Anciennes phrases des sous-titres hero
          </h1>
          <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#8FB0DA", maxWidth: "640px", marginBottom: "3.5rem" }}>
            Le {new Date().toISOString().slice(0, 10)}, le sous-titre hero de ces 6 pages a été raccourci pour matcher les
            nouveaux textes des encarts SERVICE de l'accueil. Cette page garde une trace de l'ancienne version (FR + EN) au
            cas où tu voudrais revenir en arrière — remets simplement la valeur &quot;Ancien&quot; dans <code>src/i18n/fr.ts</code> / <code>en.ts</code>.
          </p>

          <div style={{ display: "grid", gap: "1.25rem" }}>
            {ENTRIES.map((e) => (
              <div
                key={e.page}
                style={{
                  background: "linear-gradient(160deg, #0D1F3C 0%, #0B1929 100%)",
                  border: "1px solid rgba(107,159,238,0.14)",
                  borderRadius: "10px",
                  padding: "1.5rem",
                }}
              >
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#F0F5FF", marginBottom: "1rem" }}>{e.page}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem" }}>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8FB0DA", marginBottom: "0.4rem" }}>
                      FR — Ancien
                    </p>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#C6CCD6" }}>{e.oldFr}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "0.4rem" }}>
                      FR — Nouveau (actif)
                    </p>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#F0F5FF" }}>{e.newFr}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "1rem", marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid rgba(107,159,238,0.12)" }}>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8FB0DA", marginBottom: "0.4rem" }}>
                      EN — Old
                    </p>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#C6CCD6" }}>{e.oldEn}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B9FEE", marginBottom: "0.4rem" }}>
                      EN — New (active)
                    </p>
                    <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#F0F5FF" }}>{e.newEn}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
