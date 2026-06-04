import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export default async function AccueilV2Page() {
  const vehiculesDisponibles = await prisma.vehicle.count({
    where: { status: "disponible" },
  });

  const derniersVehicules = await prisma.vehicle.findMany({
    where: { status: "disponible" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "#070F1E", color: "#F0F5FF" }}>

        {/* ── HERO — plein écran, halo studio ── */}
        <section
          className="relative min-h-screen flex items-center overflow-hidden"
          style={{ backgroundColor: "#070F1E", paddingTop: "200px" }}
        >
          {/* Image plein écran (plus de 62%) */}
          <div className="absolute inset-0">
            <img
              src="/Photo du Site/V2 Porshe Accueil.png"
              alt="Porsche 911 GT3 en montagne"
              className="w-full h-full object-cover object-center"
              style={{ opacity: 0.80 }}
            />
            {/* Dégradé gauche — plus doux pour laisser la voiture respirer */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(7,15,30,0.97) 0%, rgba(7,15,30,0.82) 28%, rgba(7,15,30,0.38) 55%, rgba(7,15,30,0.08) 78%, transparent 100%)",
              }}
            />
            {/* Fondu bas */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to top, #070F1E 0%, transparent 32%)",
              }}
            />
            {/* Halo lumineux studio derrière la carrosserie */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 75% at 72% 46%, rgba(107,159,238,0.07) 0%, transparent 100%)",
              }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full">
            <div className="max-w-xl lg:max-w-2xl py-20">
              <h1
                className="font-black leading-[0.9] mb-10"
                style={{
                  fontSize: "clamp(3rem, 7vw, 6.5rem)",
                  letterSpacing: "-0.03em",
                }}
              >
                L&apos;importation
                <br />
                automobile,
                <br />
                <span style={{ color: "#6B9FEE" }}>autrement.</span>
              </h1>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/vehicules"
                  className="px-8 py-4 text-sm font-semibold tracking-widest uppercase rounded-full border-2 transition-all duration-300"
                  style={{ borderColor: "#F0F5FF", color: "#F0F5FF" }}
                >
                  Voir les véhicules
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 text-sm font-semibold tracking-widest uppercase rounded-full transition-all duration-300"
                  style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 left-6 lg:left-12 flex items-center gap-3">
            <div className="w-8 h-px" style={{ backgroundColor: "#1B3055" }} />
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#1B3055" }}>
              Défiler
            </span>
          </div>
        </section>

        {/* ── SPLIT : SOURCING EUROPÉEN ── */}
        <section
          className="border-t"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">

              {/* Texte + stats */}
              <div className="py-28 lg:pr-16">
                <h2
                  className="font-black uppercase leading-none mb-12"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Les meilleurs prix
                  <br />
                  du marché européen.
                </h2>

                <div className="space-y-0">
                  {[
                    { value: "+2 000", label: "Annonces analysées par mois sur les marchés européens" },
                    { value: "20–30%", label: "D'économie moyenne constatée vs. marché français" },
                    { value: "100%", label: "Des coûts détaillés avant tout engagement de votre part" },
                  ].map((s, i) => (
                    <div
                      key={s.value}
                      className="flex items-start gap-6 py-8"
                      style={{ borderTop: "1px solid #1B3055" }}
                    >
                      <span
                        className="font-black leading-none flex-shrink-0"
                        style={{
                          fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                          color: "#F0F5FF",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {s.value}
                      </span>
                      <span
                        className="text-sm leading-relaxed pt-1"
                        style={{ color: "#8AABD4" }}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #1B3055" }} className="pt-8">
                    <Link
                      href="/vehicules"
                      className="inline-flex items-center gap-3 text-xs tracking-widest uppercase font-semibold group"
                      style={{ color: "#6B9FEE" }}
                    >
                      <span>Parcourir les véhicules</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Car image */}
              <div
                className="relative hidden lg:block"
                style={{ height: "600px" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=85"
                  alt="Véhicule premium sélectionné"
                  className="w-full h-full object-cover object-center"
                  style={{ opacity: 0.85 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to left, transparent 40%, #070F1E 100%), linear-gradient(to top, #070F1E 0%, transparent 30%)",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── PAUSE CINÉMATIQUE — plein écran, aucun texte ── */}
        <section className="relative w-full overflow-hidden" style={{ height: "85vh", minHeight: "480px" }}>
          <img
            src="/Photo du Site/Porshe Acceuil.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          {/* Fondu haut */}
          <div
            className="absolute inset-x-0 top-0"
            style={{ height: "140px", background: "linear-gradient(to bottom, #070F1E, transparent)" }}
          />
          {/* Fondu bas */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: "140px", background: "linear-gradient(to top, #040B16, transparent)" }}
          />
        </section>

        {/* ── POURQUOI NOUS — section sombre plein écran ── */}
        <section
          className="relative overflow-hidden"
          style={{ backgroundColor: "#040B16" }}
        >
          <div className="border-t" style={{ borderColor: "#1B3055" }} />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-0">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Pourquoi Intelligence Automobile ?
            </p>
            <h2
              className="font-black uppercase leading-[0.9] mb-12"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
                letterSpacing: "-0.025em",
                maxWidth: "950px",
              }}
            >
              Une approche différente,
              <br />
              un résultat garanti.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16 max-w-3xl">
              <div>
                <p className="text-base leading-[1.8]" style={{ color: "#8AABD4" }}>
                  Cabinet d&apos;import automobile premium fondé par des passionnés du secteur.
                  Nous sourçons sur les{" "}
                  <span style={{ color: "#F0F5FF" }}>marchés européens les plus attractifs</span>
                  {" "}— des prix introuvables en France.
                </p>
              </div>
              <div>
                <p className="text-base leading-[1.8]" style={{ color: "#8AABD4" }}>
                  Une expérience d&apos;achat{" "}
                  <span style={{ color: "#F0F5FF" }}>100% transparente et sur-mesure</span>.
                  Aucune surprise, aucun frais caché. De la recherche au volant, nous gérons tout.
                </p>
              </div>
            </div>

            <Link
              href="/methode"
              className="inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase rounded-full mb-24 transition-all duration-300"
              style={{ backgroundColor: "#6B9FEE", color: "#040B16" }}
            >
              Notre méthode
            </Link>
          </div>

          {/* Voiture qui émerge du bas — plus visible */}
          <div className="relative w-full" style={{ height: "50vh", minHeight: "300px" }}>
            <img
              src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="w-full h-full object-cover object-top"
              style={{ opacity: 0.78 }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, #040B16 0%, rgba(4,11,22,0.3) 40%, transparent 70%, #070F1E 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to top, #070F1E 0%, transparent 50%)",
              }}
            />
          </div>
        </section>

        {/* ── LIVRAISON SPLIT — voiture gauche, étapes droite ── */}
        <section
          className="border-t"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">

              {/* Car image gauche */}
              <div
                className="relative hidden lg:block order-last lg:order-first"
                style={{ height: "580px" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=85"
                  alt="Livraison véhicule"
                  className="w-full h-full object-cover object-center"
                  style={{ opacity: 0.8 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to right, transparent 40%, #070F1E 100%), linear-gradient(to top, #070F1E 0%, transparent 30%)",
                  }}
                />
              </div>

              {/* Étapes droite */}
              <div className="py-24 lg:pl-16">
                <p
                  className="text-xs tracking-[0.35em] uppercase mb-6"
                  style={{ color: "#6B9FEE" }}
                >
                  Un processus simple
                </p>
                <h2
                  className="font-black uppercase leading-none mb-12"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.2rem)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  Livré chez vous,
                  <br />
                  prêt à rouler.
                </h2>

                <div className="space-y-0">
                  {[
                    {
                      n: "1",
                      title: "Vous choisissez",
                      desc: "Parmi notre stock ou via mandat d'import sur-mesure.",
                    },
                    {
                      n: "2",
                      title: "Nous gérons tout",
                      desc: "Achat, transport, homologation, immatriculation française.",
                    },
                    {
                      n: "3",
                      title: "Vous recevez les clés",
                      desc: "Livraison à domicile sous 2 à 3 semaines, véhicule prêt à conduire.",
                    },
                  ].map((step) => (
                    <div
                      key={step.n}
                      className="flex items-start gap-6 py-8"
                      style={{ borderTop: "1px solid #1B3055" }}
                    >
                      <span
                        className="font-black leading-none flex-shrink-0"
                        style={{
                          fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                          color: "#1B3055",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {step.n}
                      </span>
                      <div>
                        <div
                          className="text-sm font-bold uppercase tracking-widest mb-1"
                          style={{ color: "#F0F5FF" }}
                        >
                          {step.title}
                        </div>
                        <div className="text-sm leading-relaxed" style={{ color: "#8AABD4" }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #1B3055" }} className="pt-8">
                    <Link
                      href="/methode"
                      className="inline-flex items-center gap-3 text-xs tracking-widest uppercase font-semibold group"
                      style={{ color: "#6B9FEE" }}
                    >
                      <span>Lire plus</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── SERVICES — images plus présentes (opacité 0.58 vs 0.22) ── */}
        <section
          className="border-t"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-10">
            <div className="flex items-end justify-between mb-16">
              <div>
                <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: "#6B9FEE" }}>
                  Ce que nous faisons
                </p>
                <h2
                  className="font-black uppercase leading-none"
                  style={{ fontSize: "clamp(2rem, 4.5vw, 3.8rem)", letterSpacing: "-0.025em" }}
                >
                  Nos services
                </h2>
              </div>
              <Link
                href="/services"
                className="hidden md:inline-flex items-center gap-2 text-xs tracking-widest uppercase group"
                style={{ color: "#6B9FEE" }}
              >
                <span>Tout voir</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-px"
            style={{ backgroundColor: "#1B3055" }}
          >
            {[
              {
                num: "01",
                title: "Achat · Revente",
                desc: "Véhicules premium sélectionnés sur les marchés allemand et belge, importés et proposés prêts à immatriculer en France.",
                href: "/services#achat-revente",
                img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
              },
              {
                num: "02",
                title: "Mandat d'import",
                desc: "Nous trouvons, vérifions et importons le véhicule de vos rêves. Vous choisissez, nous gérons l'intégralité du dossier.",
                href: "/services#mandat-import",
                img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80",
              },
              {
                num: "03",
                title: "Aide à la vente",
                desc: "Dossier complet, photos pro, diffusion optimisée et qualification des acheteurs pour vendre au meilleur prix.",
                href: "/services#aide-vente",
                img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80",
              },
            ].map((s) => (
              <div
                key={s.num}
                className="relative overflow-hidden group"
                style={{ backgroundColor: "#070F1E", minHeight: "480px" }}
              >
                {/* Opacité augmentée : 0.22 → 0.58 */}
                <img
                  src={s.img}
                  alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ opacity: 0.58 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, #070F1E 40%, rgba(7,15,30,0.35) 100%)",
                  }}
                />
                <div
                  className="relative z-10 p-10 flex flex-col justify-end"
                  style={{ minHeight: "480px" }}
                >
                  <span className="text-xs tracking-widest font-bold mb-5" style={{ color: "#6B9FEE" }}>
                    {s.num}
                  </span>
                  <h3 className="text-xl font-black uppercase mb-3 leading-tight" style={{ color: "#F0F5FF" }}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: "#8AABD4" }}>
                    {s.desc}
                  </p>
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-2 text-xs tracking-widest uppercase font-semibold group/link"
                    style={{ color: "#6B9FEE" }}
                  >
                    <span>En savoir plus</span>
                    <span className="transition-transform duration-300 group-hover/link:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DERNIERS VÉHICULES — photos plus hautes (380px vs 260px) ── */}
        {derniersVehicules.length > 0 && (
          <section
            className="border-t"
            style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-10">
              <div className="flex items-end justify-between mb-16">
                <div>
                  <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: "#6B9FEE" }}>
                    Stock actuel
                  </p>
                  <h2
                    className="font-black uppercase leading-none"
                    style={{ fontSize: "clamp(2rem, 4.5vw, 3.8rem)", letterSpacing: "-0.025em" }}
                  >
                    Derniers arrivages
                  </h2>
                </div>
                <Link
                  href="/vehicules"
                  className="hidden md:inline-flex items-center gap-2 text-xs tracking-widest uppercase group"
                  style={{ color: "#6B9FEE" }}
                >
                  <span>Tout le stock</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-px"
              style={{ backgroundColor: "#1B3055" }}
            >
              {derniersVehicules.map((v) => {
                const images = JSON.parse(v.images) as string[];
                const img = images[0] ?? null;
                return (
                  <Link
                    href={`/vehicules/${v.id}`}
                    key={v.id}
                    className="group block overflow-hidden"
                    style={{ backgroundColor: "#070F1E" }}
                  >
                    {/* Hauteur photo : 260px → 380px */}
                    <div className="relative overflow-hidden" style={{ height: "380px" }}>
                      {img ? (
                        <img
                          src={img}
                          alt={`${v.make} ${v.model}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-xs tracking-widest uppercase"
                          style={{ backgroundColor: "#0D1A2D", color: "#1B3055" }}
                        >
                          Photo à venir
                        </div>
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(to top, #070F1E 0%, transparent 55%)",
                        }}
                      />
                    </div>
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[10px] tracking-widest uppercase font-bold"
                          style={{ color: "#6B9FEE" }}
                        >
                          {v.make}
                        </span>
                        <span className="text-[10px] tracking-wide" style={{ color: "#8AABD4" }}>
                          {v.year} · {v.mileage.toLocaleString("fr-FR")} km
                        </span>
                      </div>
                      <h3
                        className="text-xl font-black uppercase mb-5 leading-tight"
                        style={{ color: "#F0F5FF" }}
                      >
                        {v.model}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black" style={{ color: "#F0F5FF" }}>
                          {v.price.toLocaleString("fr-FR")} €
                        </span>
                        <span className="text-xs tracking-widest uppercase" style={{ color: "#6B9FEE" }}>
                          Détail →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center py-6 md:hidden">
              <Link
                href="/vehicules"
                className="text-sm tracking-widest uppercase"
                style={{ color: "#6B9FEE" }}
              >
                Tout le stock →
              </Link>
            </div>
          </section>
        )}

        {/* ── CTA FINAL ── */}
        <section
          className="relative overflow-hidden border-t"
          style={{ borderColor: "#1B3055", backgroundColor: "#070F1E" }}
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=70"
              alt=""
              className="w-full h-full object-cover object-center"
              style={{ opacity: 0.07 }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-36 text-center">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Prêt à commencer ?
            </p>
            <h2
              className="font-black uppercase leading-[0.92] mx-auto mb-12"
              style={{
                fontSize: "clamp(2.8rem, 6.5vw, 5.5rem)",
                letterSpacing: "-0.025em",
                maxWidth: "900px",
              }}
            >
              Votre prochain véhicule
              <br />
              <span style={{ color: "#6B9FEE" }}>Vous Attend.</span>
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="px-10 py-4 text-sm font-semibold tracking-widest uppercase rounded-full border-2 transition-all duration-300"
                style={{ borderColor: "#F0F5FF", color: "#F0F5FF" }}
              >
                Prendre contact
              </Link>
              <Link
                href="/vehicules"
                className="px-10 py-4 text-sm font-semibold tracking-widest uppercase rounded-full transition-all duration-300"
                style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
              >
                Voir le stock
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
