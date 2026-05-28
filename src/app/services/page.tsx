import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Services — Intelligence Automobile",
  description:
    "Achat-revente, mandat d'import clé en main et aide à la vente. Trois services pour votre projet automobile premium.",
};

const services = [
  {
    id: "achat-revente",
    num: "01",
    tag: "Service 01",
    title: "Achat · Revente",
    subtitle: "Des véhicules sélectionnés, prêts à rouler",
    paragraphs: [
      "Nous identifions sur les marchés européens — principalement en Allemagne et en Belgique — des véhicules premium présentant un différentiel de prix intéressant par rapport au marché français.",
      "Chaque véhicule est analysé selon des critères précis : cohérence du prix, historique d'entretien vérifiable, kilométrage cohérent, configuration attractive et potentiel de revente rapide.",
      "Vous achetez un véhicule prêt à immatriculer, avec une transparence totale sur son histoire et ses coûts réels.",
    ],
    points: [
      "Sélection sur AutoScout24 DE, Mobile.de, 2ememain.be",
      "Vérification historique (carnet, CT, accidents)",
      "Analyse du différentiel de prix EU / France",
      "Import et immatriculation gérés intégralement",
      "Préparation esthétique avant livraison",
    ],
    price: "Prix du marché européen",
    priceNote: "Transparence totale — aucun frais caché",
    cta: "Voir les véhicules disponibles",
    ctaHref: "/vehicules",
    ctaSecondary: null,
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85",
    imgAlt: "Véhicule premium sélectionné sur marché européen",
    bg: "#070F1E" as const,
    imageRight: true,
  },
  {
    id: "mandat-import",
    num: "02",
    tag: "Service 02",
    title: "Mandat d'import",
    subtitle: "Vous choisissez, nous gérons tout",
    paragraphs: [
      "Vous avez un véhicule précis en tête — une marque, un modèle, une configuration — mais vous n'avez ni le temps ni les moyens de chercher en Europe et gérer les démarches d'importation.",
      "Nous prenons en charge l'intégralité du processus : analyse de votre besoin, sourcing actif, vérification approfondie, négociation du prix, transport et gestion administrative jusqu'à l'immatriculation en France.",
      "Vous profitez des prix européens sans aucune des contraintes habituellement liées à l'import.",
    ],
    points: [
      "Analyse de votre besoin et définition des critères",
      "Recherche active sur les marchés EU",
      "Vérification sur place ou via rapport détaillé",
      "Négociation et sécurisation de l'achat",
      "Import, conformité et immatriculation inclus",
    ],
    price: "Commission moyenne : 2 250 €",
    priceNote: "Aucune immobilisation de capital pour vous",
    cta: "Nous confier un mandat",
    ctaHref: "/contact?service=mandat",
    ctaSecondary: null,
    img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1400&q=85",
    imgAlt: "Mandat d'import véhicule premium Europe",
    bg: "#040B16" as const,
    imageRight: false,
  },
  {
    id: "aide-vente",
    num: "03",
    tag: "Service 03",
    title: "Aide à la vente",
    subtitle: "Vendez mieux, sans y passer des semaines",
    paragraphs: [
      "Vous possédez un véhicule premium et souhaitez le vendre dans les meilleures conditions — au bon prix, rapidement, sans les inconvénients liés aux contacts non qualifiés et aux négociations interminables.",
      "Nous prenons en charge la valorisation et la diffusion de votre véhicule : audit complet, photos professionnelles, publication ciblée et qualification des acheteurs.",
      "Votre véhicule est présenté de manière optimale, vu par les bons acheteurs, et vendu dans des conditions sereines.",
    ],
    points: [
      "Audit complet du véhicule",
      "Shooting photo professionnel",
      "Rédaction et diffusion multi-plateformes",
      "Qualification et filtrage des acheteurs",
      "Accompagnement jusqu'à la signature",
    ],
    price: "5 à 8 % du prix de vente",
    priceNote: "Commission minimum : 1 500 €",
    cta: "Confier votre véhicule",
    ctaHref: "/contact?service=vente",
    ctaSecondary: null,
    img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=85",
    imgAlt: "Aide à la vente véhicule premium",
    bg: "#070F1E" as const,
    imageRight: true,
  },
];

const positioning = [
  {
    label: "Concession premium",
    tag: null,
    pros: ["Sécurité et garantie maximales", "Réseau constructeur officiel"],
    cons: ["Prix +20 à 40 % vs marché", "Peu de marge de négociation"],
    highlight: false,
  },
  {
    label: "Intelligence Automobile",
    tag: "Notre positionnement",
    pros: [
      "Prix du marché européen",
      "Accompagnement complet et personnalisé",
      "Transparence totale sur les coûts",
      "Démarches entièrement gérées",
    ],
    cons: [],
    highlight: true,
  },
  {
    label: "Vente entre particuliers",
    tag: null,
    pros: ["Tarifs attractifs"],
    cons: ["Aucun accompagnement", "Risques non maîtrisés", "Démarches à votre charge"],
    highlight: false,
  },
];

export default function ServicesPage() {
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
              Ce que nous proposons
            </p>
            <h1
              className="font-black uppercase leading-[0.9] mb-8"
              style={{
                fontSize: "clamp(3.2rem, 7.5vw, 7rem)",
                letterSpacing: "-0.025em",
              }}
            >
              Nos
              <br />
              <span style={{ color: "#6B9FEE" }}>services.</span>
            </h1>
            <p
              className="text-base leading-relaxed max-w-lg mb-16"
              style={{ color: "#8AABD4", fontWeight: 300 }}
            >
              Trois activités complémentaires pour vous accompagner dans tous
              vos projets automobiles, de l&apos;achat à la vente.
            </p>

            {/* Navigation rapide */}
            <div style={{ borderTop: "1px solid #1B3055" }}>
              <div className="flex flex-wrap">
                {services.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="group flex items-center gap-5 py-5 transition-colors duration-200"
                    style={{
                      paddingRight: "2.5rem",
                      paddingLeft: i === 0 ? "0" : "2.5rem",
                      borderLeft: i === 0 ? "none" : "1px solid #1B3055",
                    }}
                  >
                    <span
                      className="font-black text-base"
                      style={{ color: "#1B3055", letterSpacing: "-0.02em" }}
                    >
                      {s.num}
                    </span>
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "#8AABD4" }}
                    >
                      {s.title}
                    </span>
                    <span
                      className="text-xs transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: "#6B9FEE" }}
                    >
                      →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES ── */}
        {services.map((service) => (
          <div key={service.id} id={service.id} style={{ backgroundColor: service.bg }}>

            {/* Split : texte + image */}
            <section className="border-t" style={{ borderColor: "#1B3055" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-12">
                {service.imageRight ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">

                    {/* Contenu — gauche */}
                    <div className="py-20 lg:pr-16">
                      <span
                        className="font-black block leading-none mb-6"
                        style={{
                          fontSize: "clamp(5rem, 12vw, 10rem)",
                          color: "#1B3055",
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {service.num}
                      </span>
                      <p
                        className="text-xs tracking-[0.35em] uppercase mb-4"
                        style={{ color: "#6B9FEE" }}
                      >
                        {service.tag}
                      </p>
                      <h2
                        className="font-black uppercase leading-none mb-4"
                        style={{
                          fontSize: "clamp(2rem, 4vw, 3.2rem)",
                          letterSpacing: "-0.025em",
                        }}
                      >
                        {service.title}
                      </h2>
                      <p
                        className="text-sm mb-10"
                        style={{ color: "#6B9FEE", fontStyle: "italic" }}
                      >
                        {service.subtitle}
                      </p>
                      <div className="space-y-4 mb-10">
                        {service.paragraphs.map((para, j) => (
                          <p
                            key={j}
                            className="text-sm leading-relaxed"
                            style={{ color: "#8AABD4" }}
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                      <div className="mb-10">
                        <span
                          className="block font-black mb-1"
                          style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", color: "#F0F5FF" }}
                        >
                          {service.price}
                        </span>
                        <span
                          className="text-xs tracking-widest uppercase"
                          style={{ color: "#8AABD4" }}
                        >
                          {service.priceNote}
                        </span>
                      </div>
                      <Link
                        href={service.ctaHref}
                        className="inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase rounded-full transition-all duration-300"
                        style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                      >
                        {service.cta}
                      </Link>
                    </div>

                    {/* Image — droite */}
                    <div
                      className="relative hidden lg:block"
                      style={{ height: "680px" }}
                    >
                      <img
                        src={service.img}
                        alt={service.imgAlt}
                        className="w-full h-full object-cover"
                        style={{ opacity: 0.85 }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to left, transparent 35%, ${service.bg} 100%), linear-gradient(to top, ${service.bg} 0%, transparent 30%)`,
                        }}
                      />
                    </div>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">

                    {/* Image — gauche */}
                    <div
                      className="relative hidden lg:block"
                      style={{ height: "680px" }}
                    >
                      <img
                        src={service.img}
                        alt={service.imgAlt}
                        className="w-full h-full object-cover"
                        style={{ opacity: 0.85 }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to right, transparent 35%, ${service.bg} 100%), linear-gradient(to top, ${service.bg} 0%, transparent 30%)`,
                        }}
                      />
                    </div>

                    {/* Contenu — droite */}
                    <div className="py-20 lg:pl-16">
                      <span
                        className="font-black block leading-none mb-6"
                        style={{
                          fontSize: "clamp(5rem, 12vw, 10rem)",
                          color: "#1B3055",
                          letterSpacing: "-0.04em",
                        }}
                      >
                        {service.num}
                      </span>
                      <p
                        className="text-xs tracking-[0.35em] uppercase mb-4"
                        style={{ color: "#6B9FEE" }}
                      >
                        {service.tag}
                      </p>
                      <h2
                        className="font-black uppercase leading-none mb-4"
                        style={{
                          fontSize: "clamp(2rem, 4vw, 3.2rem)",
                          letterSpacing: "-0.025em",
                        }}
                      >
                        {service.title}
                      </h2>
                      <p
                        className="text-sm mb-10"
                        style={{ color: "#6B9FEE", fontStyle: "italic" }}
                      >
                        {service.subtitle}
                      </p>
                      <div className="space-y-4 mb-10">
                        {service.paragraphs.map((para, j) => (
                          <p
                            key={j}
                            className="text-sm leading-relaxed"
                            style={{ color: "#8AABD4" }}
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                      <div className="mb-10">
                        <span
                          className="block font-black mb-1"
                          style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", color: "#F0F5FF" }}
                        >
                          {service.price}
                        </span>
                        <span
                          className="text-xs tracking-widest uppercase"
                          style={{ color: "#8AABD4" }}
                        >
                          {service.priceNote}
                        </span>
                      </div>
                      <Link
                        href={service.ctaHref}
                        className="inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold tracking-widest uppercase rounded-full transition-all duration-300"
                        style={{ backgroundColor: "#6B9FEE", color: "#070F1E" }}
                      >
                        {service.cta}
                      </Link>
                    </div>

                  </div>
                )}
              </div>
            </section>

            {/* Points inclus */}
            <section className="border-t" style={{ borderColor: "#1B3055" }}>
              <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
                <p
                  className="text-xs tracking-[0.35em] uppercase mb-0"
                  style={{ color: "#6B9FEE" }}
                />
                <div className="space-y-0">
                  {service.points.map((point, i) => (
                    <div
                      key={point}
                      className="flex items-center gap-6 py-5"
                      style={{ borderTop: "1px solid #1B3055" }}
                    >
                      <span
                        className="font-black flex-shrink-0 leading-none"
                        style={{
                          fontSize: "1.5rem",
                          color: "#1B3055",
                          letterSpacing: "-0.02em",
                          minWidth: "2.5rem",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="text-sm leading-relaxed"
                        style={{ color: "#8AABD4" }}
                      >
                        {point}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #1B3055" }} />
                </div>
              </div>
            </section>

          </div>
        ))}

        {/* ── POSITIONNEMENT ── */}
        <section
          className="border-t"
          style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-10">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-6"
              style={{ color: "#6B9FEE" }}
            >
              Où nous nous situons
            </p>
            <h2
              className="font-black uppercase leading-[0.9] mb-16"
              style={{
                fontSize: "clamp(2.5rem, 5.5vw, 5rem)",
                letterSpacing: "-0.025em",
                maxWidth: "780px",
              }}
            >
              Entre la concession
              <br />
              <span style={{ color: "#6B9FEE" }}>et le particulier.</span>
            </h2>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-px"
            style={{ backgroundColor: "#1B3055" }}
          >
            {positioning.map((col) => (
              <div
                key={col.label}
                className="p-8 lg:p-10"
                style={{ backgroundColor: col.highlight ? "#070F1E" : "#040B16" }}
              >
                {col.tag && (
                  <span
                    className="text-xs tracking-widest uppercase font-bold block mb-5"
                    style={{ color: "#6B9FEE" }}
                  >
                    {col.tag}
                  </span>
                )}
                <h3
                  className="font-black uppercase mb-8"
                  style={{
                    fontSize: "1rem",
                    letterSpacing: "0.04em",
                    color: col.highlight ? "#F0F5FF" : "#8AABD4",
                  }}
                >
                  {col.label}
                </h3>
                <div className="space-y-4">
                  {col.pros.map((p) => (
                    <div key={p} className="flex items-start gap-3">
                      <span style={{ color: "#6B9FEE", flexShrink: 0 }}>+</span>
                      <span
                        className="text-sm leading-snug"
                        style={{ color: col.highlight ? "#8AABD4" : "#8AABD4" }}
                      >
                        {p}
                      </span>
                    </div>
                  ))}
                  {col.cons.map((c) => (
                    <div key={c} className="flex items-start gap-3">
                      <span style={{ color: "#2A4470", flexShrink: 0 }}>−</span>
                      <span className="text-sm leading-snug" style={{ color: "#2A4470" }}>
                        {c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

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
              Pas sûr du service qui vous convient ?
            </p>
            <h2
              className="font-black uppercase leading-[0.92] mx-auto mb-12"
              style={{
                fontSize: "clamp(2.8rem, 6.5vw, 5.5rem)",
                letterSpacing: "-0.025em",
                maxWidth: "900px",
              }}
            >
              Décrivez-nous
              <br />
              <span style={{ color: "#6B9FEE" }}>votre projet.</span>
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
