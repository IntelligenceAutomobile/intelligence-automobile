import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AideVenteForm from "./AideVenteForm";

export const metadata = {
  title: "Aide à la Vente — Intelligence Automobile",
  description:
    "Estimation au prix du marché réel, diffusion ciblée, transaction sécurisée. Vendez votre véhicule premium au juste prix, sans vous en occuper.",
};

const steps = [
  {
    num: "01",
    title: "Estimation",
    desc: "Analyse du marché, de l'historique et de l'état du véhicule. Nous vous soumettons une valorisation argumentée — pas un chiffre sorti de nulle part.",
  },
  {
    num: "02",
    title: "Mise en valeur",
    desc: "Photos professionnelles, description experte, diffusion sur les canaux ciblés et dans notre réseau d'acheteurs qualifiés.",
  },
  {
    num: "03",
    title: "Gestion des contacts",
    desc: "Nous filtrons chaque demande. Seuls les acheteurs sérieux et solvables vous sont présentés — ou nous gérons directement en votre nom.",
  },
  {
    num: "04",
    title: "Transaction",
    desc: "Sécurisation du paiement, transfert de propriété, démarches administratives. Vous touchez le prix convenu. Nous gérons le reste.",
  },
];

const comparatif = [
  {
    critere: "Prix obtenu",
    dealer: "−20 à −35 % du marché",
    seul: "Prix marché − friction",
    ia: "Prix marché réel",
  },
  {
    critere: "Délai moyen",
    dealer: "Immédiat",
    seul: "6 à 16 semaines",
    ia: "2 à 4 semaines",
  },
  {
    critere: "Contacts à gérer",
    dealer: "Aucun",
    seul: "100+, dont 80 % non qualifiés",
    ia: "Aucun — nous filtrons tout",
  },
  {
    critere: "Paperwork",
    dealer: "Dealer s'en occupe",
    seul: "Vous",
    ia: "Nous",
  },
  {
    critere: "Sécurité paiement",
    dealer: "✓",
    seul: "Variable",
    ia: "✓ vérifiée",
  },
];

const garanties = [
  "Estimation gratuite sous 24h",
  "Prix marché réel, pas de reprise",
  "Zéro contact non qualifié à gérer",
  "Transaction 100 % sécurisée",
  "Démarches administratives incluses",
  "Honoraires transparents, annoncés avant accord",
];

const vehiculesAcceptes = {
  types: ["Berlines premium", "SUV", "Coupés", "Sportives", "Cabriolets"],
  marques: ["Audi", "BMW", "Mercedes", "Porsche", "Volkswagen", "Lexus", "Volvo"],
  criteres: ["Moins de 12 ans", "Jusqu'à 180 000 km", "Entretien documenté"],
};

export default function AideVentePage() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO ── */}
        <section
          className="relative overflow-hidden"
          style={{ backgroundColor: "#070F1E", paddingTop: "200px", paddingBottom: "100px" }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-[58%]">
            <img
              src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=85"
              alt=""
              className="w-full h-full object-cover object-center"
              style={{ opacity: 0.80 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, #070F1E 28%, rgba(7,15,30,0.6) 58%, transparent 82%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, #070F1E 0%, transparent 40%)" }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            <div className="max-w-xl">
              <p className="text-xs tracking-[0.35em] uppercase mb-8" style={{ color: "#6B9FEE" }}>
                Aide à la vente · Véhicules premium
              </p>
              <h1
                className="font-black leading-[0.9] mb-8"
                style={{ fontSize: "clamp(2.8rem, 6.5vw, 6rem)", letterSpacing: "-0.03em" }}
              >
                Votre véhicule
                <br />
                vaut plus que ce
                <br />
                <span style={{ color: "#6B9FEE" }}>qu&apos;on vous propose.</span>
              </h1>
              <p
                className="text-base md:text-lg leading-relaxed max-w-md"
                style={{ color: "#8AABD4", fontWeight: 300 }}
              >
                Estimation au prix du marché réel, diffusion ciblée, transaction sécurisée.
                Vous vendez mieux — sans vous en occuper.
              </p>
            </div>
          </div>
        </section>

        {/* ── COMPARATIF ── */}
        <section
          className="border-t border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
            <p className="text-xs tracking-[0.35em] uppercase mb-4 text-center" style={{ color: "#8AABD4" }}>
              Pourquoi pas la reprise concessionnaire ?
            </p>
            <h2
              className="font-black uppercase leading-[0.9] text-center mb-16"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", letterSpacing: "-0.025em" }}
            >
              Les faits, sans détour.
            </h2>

            {/* Table desktop */}
            <div className="hidden md:block overflow-hidden" style={{ border: "1px solid #1B3055" }}>
              {/* Header */}
              <div className="grid grid-cols-4" style={{ backgroundColor: "#0A1628", borderBottom: "1px solid #1B3055" }}>
                <div className="px-6 py-4" />
                {["Reprise concessionnaire", "Vente seul", "Aide à la Vente IA"].map((col, i) => (
                  <div
                    key={col}
                    className="px-6 py-4"
                    style={{
                      borderLeft: "1px solid #1B3055",
                      borderRight: i === 2 ? "none" : undefined,
                    }}
                  >
                    <span
                      className="text-[9px] tracking-[0.3em] uppercase font-semibold"
                      style={{ color: i === 2 ? "#6B9FEE" : "#8AABD4" }}
                    >
                      {col}
                    </span>
                  </div>
                ))}
              </div>
              {/* Rows */}
              {comparatif.map((row, i) => (
                <div
                  key={row.critere}
                  className="grid grid-cols-4"
                  style={{ borderBottom: i < comparatif.length - 1 ? "1px solid #1B3055" : "none" }}
                >
                  <div className="px-6 py-5">
                    <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "#8AABD4" }}>
                      {row.critere}
                    </span>
                  </div>
                  <div className="px-6 py-5" style={{ borderLeft: "1px solid #1B3055" }}>
                    <span className="text-sm" style={{ color: "#C8D8EE", fontWeight: 300 }}>{row.dealer}</span>
                  </div>
                  <div className="px-6 py-5" style={{ borderLeft: "1px solid #1B3055" }}>
                    <span className="text-sm" style={{ color: "#C8D8EE", fontWeight: 300 }}>{row.seul}</span>
                  </div>
                  <div
                    className="px-6 py-5"
                    style={{
                      borderLeft: "1px solid #1B3055",
                      backgroundColor: "rgba(107,159,238,0.04)",
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: "#F0F5FF" }}>{row.ia}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table mobile — cartes */}
            <div className="md:hidden space-y-4">
              {comparatif.map((row) => (
                <div key={row.critere} style={{ border: "1px solid #1B3055" }}>
                  <div className="px-4 py-3" style={{ backgroundColor: "#0A1628", borderBottom: "1px solid #1B3055" }}>
                    <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "#8AABD4" }}>
                      {row.critere}
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "#1B3055" }}>
                    {[
                      { label: "Reprise concessionnaire", val: row.dealer, highlight: false },
                      { label: "Vente seul", val: row.seul, highlight: false },
                      { label: "Aide à la Vente IA", val: row.ia, highlight: true },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center px-4 py-3"
                        style={{ backgroundColor: item.highlight ? "rgba(107,159,238,0.04)" : undefined }}
                      >
                        <span className="text-[10px]" style={{ color: item.highlight ? "#6B9FEE" : "#8AABD4" }}>
                          {item.label}
                        </span>
                        <span className="text-sm text-right max-w-[55%]" style={{ color: item.highlight ? "#F0F5FF" : "#C8D8EE", fontWeight: item.highlight ? 500 : 300 }}>
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4 ÉTAPES ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
            <p className="text-xs tracking-[0.35em] uppercase mb-16 text-center" style={{ color: "#8AABD4" }}>
              Comment ça marche
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
              {steps.map((step, i) => (
                <div
                  key={step.num}
                  className="px-8 py-6"
                  style={{ borderLeft: i === 0 ? "none" : "1px solid #1B3055" }}
                >
                  <span
                    className="block font-black leading-none mb-6"
                    style={{
                      fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                      color: "#6B9FEE",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {step.num}
                  </span>
                  <h3
                    className="font-black uppercase mb-4"
                    style={{ fontSize: "0.95rem", letterSpacing: "0.05em" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORMULAIRE + GARANTIES ── */}
        <section style={{ backgroundColor: "#070F1E" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">

            <div className="mb-16">
              <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: "#6B9FEE" }}>
                Estimation gratuite
              </p>
              <h2
                className="font-black uppercase leading-[0.9]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.025em" }}
              >
                Décrivez votre
                <br />
                véhicule.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">

              {/* Colonne gauche */}
              <div className="lg:col-span-2 space-y-10">
                <p className="text-base leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                  Nous connaissons les marchés allemand et belge mieux que personne.
                  Cette expertise nous permet de{" "}
                  <strong style={{ color: "#F0F5FF" }}>positionner votre véhicule au prix juste</strong>
                  {" "}— ni bradé, ni surestimé.
                </p>

                <div style={{ borderTop: "1px solid #1B3055" }}>
                  {garanties.map((g) => (
                    <div
                      key={g}
                      className="flex items-center gap-4 py-4"
                      style={{ borderBottom: "1px solid #1B3055" }}
                    >
                      <span style={{ color: "#6B9FEE", fontSize: "10px", flexShrink: 0 }}>✓</span>
                      <span className="text-sm" style={{ color: "#C8D8EE", fontWeight: 300 }}>{g}</span>
                    </div>
                  ))}
                </div>

                {/* Véhicules acceptés */}
                <div
                  className="p-5 space-y-5"
                  style={{
                    backgroundColor: "rgba(107,159,238,0.06)",
                    border: "1px solid rgba(107,159,238,0.18)",
                  }}
                >
                  {[
                    { label: "Types de véhicules", values: vehiculesAcceptes.types },
                    { label: "Marques traitées", values: vehiculesAcceptes.marques },
                    { label: "Critères", values: vehiculesAcceptes.criteres },
                  ].map((block, i, arr) => (
                    <div
                      key={block.label}
                      style={{ paddingBottom: i < arr.length - 1 ? "16px" : undefined, borderBottom: i < arr.length - 1 ? "1px solid rgba(107,159,238,0.18)" : "none" }}
                    >
                      <p className="text-[9px] tracking-[0.35em] uppercase mb-2" style={{ color: "#6B9FEE" }}>
                        {block.label}
                      </p>
                      <p className="text-sm" style={{ color: "#8AABD4", fontWeight: 300 }}>
                        {block.values.join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                  Vous n&apos;êtes pas sûr que votre véhicule entre dans nos critères ?
                  Décrivez-le quand même — nous vous répondrons sous 24h.
                </p>
              </div>

              {/* Colonne droite — formulaire */}
              <div className="lg:col-span-3">
                <AideVenteForm />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
