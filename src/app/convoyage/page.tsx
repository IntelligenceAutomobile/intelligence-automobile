import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConvoyageForm from "./ConvoyageForm";

export const metadata = {
  title: "Convoyage — Intelligence Automobile",
  description:
    "Prise en charge, conduite et livraison de votre véhicule premium. Conducteurs professionnels assurés, photos avant/après, tarif fixe. France entière et Europe.",
};

const steps = [
  {
    num: "01",
    title: "Votre demande",
    desc: "Indiquez le point de départ, la destination, le véhicule et la date souhaitée. Nous revenons vers vous sous 24h avec un devis clair et définitif.",
  },
  {
    num: "02",
    title: "Accord & préparation",
    desc: "Vous validez le devis. Nous coordonnons la prise en charge, confirmons le créneau et documentons l'état du véhicule avant départ — photos à l'appui.",
  },
  {
    num: "03",
    title: "Prise en charge",
    desc: "Un conducteur professionnel et assuré récupère le véhicule. État des lieux contradictoire, signature, départ.",
  },
  {
    num: "04",
    title: "Livraison",
    desc: "Le véhicule vous est remis à destination dans l'état convenu. Photos de livraison transmises. Tarif inchangé, quoi qu'il arrive.",
  },
];

const garanties = [
  { text: "Conducteurs professionnels assurés RC" },
  { text: "Photos d'état avant départ et à la livraison" },
  { text: "Couverture RC pendant tout le transport" },
  { text: "Tarif fixe annoncé avant accord, sans supplément" },
  { text: "France entière + Belgique, Allemagne, Pays-Bas" },
  { text: "Interlocuteur direct tout au long de la mission" },
];

export default function ConvoyagePage() {
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
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=85"
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
                Convoyage · Livraison de véhicule
              </p>
              <h1
                className="font-black leading-[0.9] mb-8"
                style={{ fontSize: "clamp(3rem, 5.5vw, 5.5rem)", letterSpacing: "-0.03em" }}
              >
                Votre véhicule
                <br />
                livré, sans
                <br />
                <span style={{ color: "#6B9FEE" }}>vous déplacer.</span>
              </h1>
              <p
                className="text-base md:text-lg leading-relaxed max-w-md"
                style={{ color: "#8AABD4", fontWeight: 300 }}
              >
                Conducteur professionnel, couverture assurance complète, photos avant et après.
                Nous acheminons votre véhicule en toute sécurité — où que vous en ayez besoin.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4 ÉTAPES ── */}
        <section
          className="border-t border-b"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
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
                Devis gratuit
              </p>
              <h2
                className="font-black uppercase leading-[0.9]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.025em" }}
              >
                Dites-nous
                <br />
                où livrer.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">

              {/* Colonne gauche — garanties */}
              <div className="lg:col-span-2 space-y-10">
                <p className="text-base leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                  Que vous ayez acheté un véhicule à distance, récupéré un achat à l'étranger ou ayez
                  simplement besoin d'acheminer une voiture d'un point A à un point B —{" "}
                  <strong style={{ color: "#F0F5FF" }}>nous nous en chargeons.</strong>
                </p>

                <div style={{ borderTop: "1px solid #1B3055" }}>
                  {garanties.map((g) => (
                    <div
                      key={g.text}
                      className="flex items-center gap-4 py-4"
                      style={{ borderBottom: "1px solid #1B3055" }}
                    >
                      <span style={{ color: "#6B9FEE", fontSize: "10px", flexShrink: 0 }}>✓</span>
                      <span className="text-sm" style={{ color: "#C8D8EE", fontWeight: 300 }}>{g.text}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="p-5"
                  style={{
                    backgroundColor: "rgba(107,159,238,0.06)",
                    border: "1px solid rgba(107,159,238,0.18)",
                  }}
                >
                  <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "#6B9FEE" }}>
                    Zones couvertes
                  </p>
                  <p className="text-sm" style={{ color: "#8AABD4", fontWeight: 300 }}>
                    France entière · Belgique · Allemagne · Pays-Bas
                  </p>
                  <div
                    className="my-4"
                    style={{ height: "1px", backgroundColor: "rgba(107,159,238,0.18)" }}
                  />
                  <p className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: "#6B9FEE" }}>
                    Délai de livraison
                  </p>
                  <p className="text-sm" style={{ color: "#8AABD4", fontWeight: 300 }}>
                    J+1 à J+3 selon la distance · Sur rendez-vous
                  </p>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "#8AABD4", fontWeight: 300 }}>
                  Besoin d&apos;un convoyage récurrent ou d&apos;un trajet hors zone ?
                  Décrivez votre besoin — nous étudions toutes les demandes.
                </p>
              </div>

              {/* Colonne droite — formulaire */}
              <div className="lg:col-span-3">
                <ConvoyageForm />
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
