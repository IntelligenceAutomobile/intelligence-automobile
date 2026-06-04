import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AideVenteForm from "@/app/aide-vente/AideVenteForm";

export const metadata = {
  title: "Aide à la Vente V2 — Intelligence Automobile",
};

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

const steps = [
  {
    num: "01",
    title: "Estimation",
    desc: "Analyse du marché, de l'historique et de l'état du véhicule. Valorisation argumentée.",
  },
  {
    num: "02",
    title: "Mise en valeur",
    desc: "Photos professionnelles, description experte, diffusion sur les canaux ciblés.",
  },
  {
    num: "03",
    title: "Gestion des contacts",
    desc: "Nous filtrons chaque demande. Seuls les acheteurs sérieux vous sont présentés.",
  },
  {
    num: "04",
    title: "Transaction",
    desc: "Sécurisation du paiement, transfert de propriété, démarches administratives.",
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

export default function AideVenteV2Page() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO 100vh — image locale, texte bas-gauche ── */}
        <section
          className="relative overflow-hidden"
          style={{ height: "100vh", minHeight: "600px" }}
        >
          {/* Image plein écran */}
          <div className="absolute inset-0">
            <img
              src="/Photo du Site/New Photo HD/robin-le-mee-yvKr1_36NQo-unsplash.jpg"
              alt=""
              className="w-full h-full object-cover object-center"
              style={{ opacity: 0.45 }}
            />
            {/* Dégradé bas → fond principal */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, #070F1E 0%, rgba(7,15,30,0.78) 32%, rgba(7,15,30,0.22) 65%, transparent 100%)",
              }}
            />
            {/* Dégradé gauche — renforce lisibilité du texte */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(7,15,30,0.88) 0%, rgba(7,15,30,0.52) 38%, transparent 70%)",
              }}
            />
          </div>

          {/* Texte positionné en bas-gauche */}
          <div
            className="absolute z-10 w-full"
            style={{ bottom: "clamp(3rem, 8vh, 6rem)", left: 0 }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div style={{ maxWidth: "680px" }}>
                <p
                  className="text-[10px] tracking-[0.38em] uppercase mb-6"
                  style={{ color: "#6B9FEE" }}
                >
                  Aide à la vente · Véhicules premium
                </p>
                <h1
                  className="font-black"
                  style={{
                    fontSize: "clamp(3rem, 5.5vw, 5.5rem)",
                    lineHeight: 0.88,
                    letterSpacing: "-0.04em",
                    marginBottom: "clamp(1.5rem, 3vh, 2.5rem)",
                  }}
                >
                  Votre véhicule
                  <br />
                  vaut plus que
                  <br />
                  <span style={{ color: "#6B9FEE" }}>ce qu&apos;on propose.</span>
                </h1>
                <p
                  className="text-base md:text-lg leading-relaxed"
                  style={{
                    color: "#8AABD4",
                    fontWeight: 300,
                    maxWidth: "520px",
                    marginBottom: "clamp(1.8rem, 4vh, 3rem)",
                  }}
                >
                  Estimation au prix du marché réel, diffusion ciblée, transaction sécurisée.
                  Vous vendez mieux — sans vous en occuper.
                </p>
                <a
                  href="#formulaire"
                  style={{
                    display: "inline-block",
                    backgroundColor: "#F0F5FF",
                    color: "#070F1E",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "14px 28px",
                    borderRadius: 0,
                    textDecoration: "none",
                  }}
                >
                  Estimation gratuite →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARATIF ── */}
        <section
          className="border-t border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <p
              className="text-[10px] tracking-[0.38em] uppercase mb-4 text-center"
              style={{ color: "#8AABD4" }}
            >
              Pourquoi pas la reprise concessionnaire ?
            </p>
            <h2
              className="font-black uppercase leading-[0.9] text-center mb-20"
              style={{
                fontSize: "clamp(2rem, 3.8vw, 3.4rem)",
                letterSpacing: "-0.03em",
              }}
            >
              Les faits, sans détour.
            </h2>

            {/* Table desktop */}
            <div
              className="hidden md:block overflow-hidden"
              style={{ border: "1px solid #1B3055" }}
            >
              {/* Header */}
              <div
                className="grid grid-cols-4"
                style={{ backgroundColor: "#080F1C", borderBottom: "1px solid #1B3055" }}
              >
                <div className="px-6 py-5" />
                {["Reprise concessionnaire", "Vente seul", "Aide à la Vente IA"].map(
                  (col, i) => (
                    <div
                      key={col}
                      className="px-6 py-5"
                      style={{
                        borderLeft: "1px solid #1B3055",
                        backgroundColor:
                          i === 2 ? "rgba(107,159,238,0.04)" : undefined,
                      }}
                    >
                      <span
                        className="text-[9px] tracking-[0.32em] uppercase font-semibold"
                        style={{ color: i === 2 ? "#6B9FEE" : "#8AABD4" }}
                      >
                        {col}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Rows */}
              {comparatif.map((row, i) => (
                <div
                  key={row.critere}
                  className="grid grid-cols-4"
                  style={{
                    borderBottom: i < comparatif.length - 1 ? "1px solid #1B3055" : "none",
                  }}
                >
                  <div className="px-6 py-5">
                    <span
                      className="text-[10px] tracking-[0.25em] uppercase"
                      style={{ color: "#8AABD4" }}
                    >
                      {row.critere}
                    </span>
                  </div>
                  <div className="px-6 py-5" style={{ borderLeft: "1px solid #1B3055" }}>
                    <span className="text-sm" style={{ color: "#C4D8EE", fontWeight: 300 }}>
                      {row.dealer}
                    </span>
                  </div>
                  <div className="px-6 py-5" style={{ borderLeft: "1px solid #1B3055" }}>
                    <span className="text-sm" style={{ color: "#C4D8EE", fontWeight: 300 }}>
                      {row.seul}
                    </span>
                  </div>
                  <div
                    className="px-6 py-5"
                    style={{
                      borderLeft: "1px solid #1B3055",
                      backgroundColor: "rgba(107,159,238,0.04)",
                    }}
                  >
                    <span className="text-sm font-medium" style={{ color: "#F0F5FF" }}>
                      {row.ia}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table mobile — cartes empilées */}
            <div className="md:hidden space-y-4">
              {comparatif.map((row) => (
                <div key={row.critere} style={{ border: "1px solid #1B3055" }}>
                  <div
                    className="px-4 py-3"
                    style={{
                      backgroundColor: "#080F1C",
                      borderBottom: "1px solid #1B3055",
                    }}
                  >
                    <span
                      className="text-[9px] tracking-[0.3em] uppercase"
                      style={{ color: "#8AABD4" }}
                    >
                      {row.critere}
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "#1B3055" }}>
                    {[
                      {
                        label: "Reprise concessionnaire",
                        val: row.dealer,
                        highlight: false,
                      },
                      { label: "Vente seul", val: row.seul, highlight: false },
                      { label: "Aide à la Vente IA", val: row.ia, highlight: true },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center px-4 py-3"
                        style={{
                          backgroundColor: item.highlight
                            ? "rgba(107,159,238,0.04)"
                            : undefined,
                        }}
                      >
                        <span
                          className="text-[10px]"
                          style={{ color: item.highlight ? "#6B9FEE" : "#8AABD4" }}
                        >
                          {item.label}
                        </span>
                        <span
                          className="text-sm text-right"
                          style={{
                            maxWidth: "55%",
                            color: item.highlight ? "#F0F5FF" : "#C4D8EE",
                            fontWeight: item.highlight ? 500 : 300,
                          }}
                        >
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

        {/* ── ÉTAPES — liste éditoriale horizontale ── */}
        <section
          className="border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <p
              className="text-[10px] tracking-[0.38em] uppercase mb-20"
              style={{ color: "#8AABD4" }}
            >
              Comment ça marche
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.num} className="relative">
                  {/* Séparateur gradient entre colonnes */}
                  {i > 0 && (
                    <div
                      className="hidden lg:block absolute left-0 top-0 bottom-0 w-px"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 0%, #1B3055 20%, #1B3055 80%, transparent 100%)",
                      }}
                    />
                  )}
                  <div
                    className="px-8 py-6"
                    style={{
                      borderLeft:
                        i > 0 ? "2px solid #6B9FEE" : undefined,
                      ...(i > 0 && { borderLeftColor: "#6B9FEE" }),
                    }}
                  >
                    {/* Numéro avec accent gauche sur mobile/tablet */}
                    <div
                      style={{
                        borderLeft: "2px solid #6B9FEE",
                        paddingLeft: "16px",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <span
                        className="font-black leading-none"
                        style={{
                          fontSize: "clamp(2.4rem, 4vw, 3.2rem)",
                          color: "#6B9FEE",
                          letterSpacing: "-0.04em",
                          display: "block",
                        }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3
                      className="font-black uppercase mb-4"
                      style={{ fontSize: "0.9rem", letterSpacing: "0.06em" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#8AABD4", fontWeight: 300 }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORMULAIRE — même structure que recherche-2 ── */}
        <section
          id="formulaire"
          style={{ backgroundColor: "#040B16", borderTop: "1px solid #1B3055" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">

            {/* Titre section */}
            <div className="mb-20">
              <p
                className="text-[10px] tracking-[0.38em] uppercase mb-4"
                style={{ color: "#6B9FEE" }}
              >
                Estimation gratuite
              </p>
              <h2
                className="font-black uppercase leading-[0.88]"
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 5rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                Décrivez votre
                <br />
                véhicule.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">

              {/* Colonne gauche — garanties + véhicules acceptés */}
              <div className="lg:col-span-2 space-y-10">

                {/* Liste garanties */}
                <div style={{ borderTop: "1px solid #1B3055" }}>
                  {garanties.map((g) => (
                    <div
                      key={g}
                      className="flex items-center gap-4 py-4"
                      style={{ borderBottom: "1px solid #1B3055" }}
                    >
                      <span
                        style={{ color: "#6B9FEE", fontSize: "10px", flexShrink: 0 }}
                      >
                        ✓
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: "#C4D8EE", fontWeight: 300 }}
                      >
                        {g}
                      </span>
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
                    {
                      label: "Types de véhicules",
                      values: vehiculesAcceptes.types,
                      separator: " · ",
                    },
                    {
                      label: "Marques traitées",
                      values: vehiculesAcceptes.marques,
                      separator: " · ",
                    },
                    {
                      label: "Critères",
                      values: vehiculesAcceptes.criteres,
                      separator: " · ",
                    },
                  ].map((block, i, arr) => (
                    <div
                      key={block.label}
                      style={{
                        paddingBottom: i < arr.length - 1 ? "20px" : undefined,
                        borderBottom:
                          i < arr.length - 1
                            ? "1px solid rgba(107,159,238,0.18)"
                            : "none",
                      }}
                    >
                      <p
                        className="text-[9px] tracking-[0.38em] uppercase mb-2"
                        style={{ color: "#6B9FEE" }}
                      >
                        {block.label}
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "#8AABD4", fontWeight: 300 }}
                      >
                        {block.values.join(block.separator)}
                      </p>
                    </div>
                  ))}
                </div>

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
