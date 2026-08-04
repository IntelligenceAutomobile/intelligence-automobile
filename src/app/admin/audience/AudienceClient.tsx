"use client";

// Écran Audience : ce que le site reçoit, et par quel chemin.
//
// Le composant affiche, il ne calcule rien : les fenêtres de temps, les parts,
// les libellés et les anciennetés arrivent déjà écrits par la page serveur.
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Link2 } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { T, CHART, AdminPage, PageHeader, Tag, fieldClass, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import { AreaChart, Donut, KpiTile } from "../charts";
import { useToast } from "../toast";

export type Compteurs = {
  visites: number;
  pages: number;
  visiteurs: number;
  nouveaux: number;
  visitesAujourdhui: number;
  pagesAujourdhui: number;
  /** Évolution en pourcents face à la période précédente, absente au démarrage. */
  evolution: number | null;
  spark: number[];
  /** Phrase déjà accordée, ex. « 2,0 pages par visite ». */
  pagesParVisite: string;
};

export type LigneLien = { src: string; label: string; visites: number; part: number; marque: boolean };
export type LignePage = { path: string; label: string; pages: number; arrivees: number; part: number };
export type LigneProvenance = { referrer: string; canal: string; visites: number; part: number };
export type Repartition = { label: string; valeur: number };
export type LigneJournal = {
  id: string;
  heure: string;
  quand: string;
  page: string;
  path: string;
  src: string;
  origine: string;
  appareil: string;
  pays: string;
  entree: boolean;
  nouveau: boolean;
};

const PERIODES = [
  { valeur: 7, label: "7 jours" },
  { valeur: 30, label: "30 jours" },
  { valeur: 90, label: "90 jours" },
];

// Pages publiques proposées par le fabricant de liens. `ancre` marque celles qui
// portent un formulaire : le visiteur y arrive alors sur le formulaire plutôt
// que sur la grande image du haut.
const PAGES_PUBLIQUES = [
  { path: "/", label: "Accueil", ancre: "" },
  { path: "/vehicules", label: "Nos véhicules", ancre: "vehicules-list" },
  { path: "/recherche-personnalisee", label: "Recherche personnalisée", ancre: "formulaire" },
  { path: "/revente-sur-mesure", label: "Revente sur mesure", ancre: "formulaire" },
  { path: "/transport-livraison", label: "Transport et livraison", ancre: "formulaire" },
  { path: "/methode", label: "Notre méthode", ancre: "processus" },
  { path: "/services", label: "Services", ancre: "" },
  { path: "/contact", label: "Contact", ancre: "formulaire" },
];

const SITE = "https://intelligenceautomobile.fr";

/* ── Pastille de filtre ──
   Aplat plein quand elle est active, comme dans les listes devis et stock. */
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-2.5 border transition-colors"
      style={{
        borderColor: active ? T.accent : T.border,
        backgroundColor: active ? T.accent : "transparent",
        color: active ? T.bg : T.textDim,
      }}
    >
      {label}
    </button>
  );
}

/* ── Carte ── */
function Carte({
  titre,
  indice,
  delai = 0,
  children,
}: {
  titre: string;
  indice?: string;
  delai?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="adm-card adm-enter p-5 min-w-0"
      style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: `${80 + delai * 90}ms` }}
    >
      <div className="adm-hairline" />
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>{titre}</h3>
        {indice && <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{indice}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Ligne de tableau avec barre de proportion ──
   La barre en fond donne l'ordre de grandeur d'un coup d'œil, là où une colonne
   de pourcents demande une lecture. */
function LigneBarre({
  titre,
  sous,
  valeur,
  detail,
  part,
  etiquette,
}: {
  titre: string;
  sous?: string;
  valeur: number;
  detail?: string;
  part: number;
  etiquette?: React.ReactNode;
}) {
  return (
    <li className="relative px-3 py-2.5" style={{ borderTop: `1px solid ${T.surfaceAlt}` }}>
      <div
        className="absolute inset-y-0 left-0 pointer-events-none"
        style={{ width: `${part}%`, backgroundColor: T.accent, opacity: 0.09 }}
      />
      <div className="relative flex items-center gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm truncate" style={{ color: T.textDim }}>{titre}</span>
            {etiquette}
          </div>
          {sous && <div className="text-[11px] truncate mt-0.5" style={{ color: T.muted }}>{sous}</div>}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold" style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>
            {formatNumber(valeur)}
          </div>
          <div className="text-[11px]" style={{ color: T.muted }}>{detail ?? `${part} %`}</div>
        </div>
      </div>
    </li>
  );
}

function Vide({ message }: { message: string }) {
  return (
    <p className="text-sm px-3 py-6 text-center" style={{ color: T.muted }}>
      {message}
    </p>
  );
}

export default function AudienceClient({
  periode,
  compteurs,
  courbe,
  etiquettes,
  parSemaine,
  liens,
  pagesVues,
  provenances,
  appareils,
  canaux,
  dernieres,
  depuis,
}: {
  periode: number;
  compteurs: Compteurs;
  courbe: number[];
  etiquettes: string[];
  parSemaine: boolean;
  liens: LigneLien[];
  pagesVues: LignePage[];
  provenances: LigneProvenance[];
  appareils: Repartition[];
  canaux: Repartition[];
  dernieres: LigneJournal[];
  depuis: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  // Fabricant de liens marqués.
  const [page, setPage] = useState(PAGES_PUBLIQUES[2].path);
  const [marqueur, setMarqueur] = useState("leboncoin");
  const [versFormulaire, setVersFormulaire] = useState(true);
  const [copie, setCopie] = useState(false);

  const pageChoisie = PAGES_PUBLIQUES.find((p) => p.path === page) ?? PAGES_PUBLIQUES[0];
  const lien = useMemo(() => {
    // Le marqueur est nettoyé ici comme il le sera à l'arrivée : le lien affiché
    // est exactement celui que la mesure enregistrera.
    const slug = marqueur.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
    const base = pageChoisie.path === "/" ? `${SITE}/` : `${SITE}${pageChoisie.path}`;
    const query = slug ? `?src=${slug}` : "";
    const ancre = versFormulaire && pageChoisie.ancre ? `#${pageChoisie.ancre}` : "";
    return `${base}${query}${ancre}`;
  }, [marqueur, pageChoisie, versFormulaire]);

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      toast.success("Lien copié");
      setTimeout(() => setCopie(false), 2000);
    } catch {
      toast.error("La copie a échoué, sélectionnez le lien à la main");
    }
  }

  function changePeriode(v: number) {
    startTransition(() => router.push(`/admin/audience?periode=${v}`));
  }

  const totalCanaux = canaux.reduce((s, c) => s + c.valeur, 0);
  const vierge = compteurs.pages === 0 && depuis === "";

  return (
    <AdminPage>
      <PageHeader
        title="Audience"
        subtitle={
          depuis
            ? `Ce que le site reçoit, jour après jour. Mesure en place depuis le ${depuis}.`
            : "Ce que le site reçoit, jour après jour."
        }
        action={
          <div className="flex flex-wrap gap-2">
            {PERIODES.map((p) => (
              <Chip
                key={p.valeur}
                label={p.label}
                active={periode === p.valeur}
                onClick={() => changePeriode(p.valeur)}
              />
            ))}
          </div>
        }
      />

      {vierge && (
        <div className="p-5 mb-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-sm" style={{ color: T.textDim }}>
            La mesure vient de démarrer. Ouvrez le site dans une fenêtre de navigation privée, parcourez
            deux ou trois pages, et les visites apparaissent ici dans la foulée.
          </p>
          <p className="text-[11px] mt-2" style={{ color: T.muted }}>
            Les pages du back-office et votre propre navigation en tant qu&apos;administrateur restent hors du comptage.
          </p>
        </div>
      )}

      {/* ── Les quatre chiffres du haut ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <KpiTile
          label="Visites"
          value={compteurs.visites}
          icon="click"
          index={0}
          spark={compteurs.spark}
          delta={
            compteurs.evolution === null
              ? null
              : { value: compteurs.evolution, suffix: " %", label: "vs période précédente" }
          }
        />
        <KpiTile
          label="Pages vues"
          value={compteurs.pages}
          icon="eye"
          index={1}
          hint={compteurs.pagesParVisite}
        />
        <KpiTile
          label="Visiteurs"
          value={compteurs.visiteurs}
          icon="users"
          index={2}
          hint={`${formatNumber(compteurs.nouveaux)} pour la première fois`}
        />
        <KpiTile
          label="Aujourd'hui"
          value={compteurs.visitesAujourdhui}
          icon="clock"
          index={3}
          hint={`${formatNumber(compteurs.pagesAujourdhui)} pages vues`}
        />
      </div>

      {/* ── Courbe et appareils ── */}
      <div className="grid xl:grid-cols-3 gap-4 mb-5">
        <div
          className="adm-card adm-enter p-5 xl:col-span-2 min-w-0"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "440ms" }}
        >
          <div className="adm-hairline" />
          <AreaChart
            title="Visites"
            subtitle={parSemaine ? "Par semaine" : "Par jour"}
            data={courbe}
            labels={etiquettes}
            format={{ unit: "visite" }}
            axisLabel={parSemaine ? "Semaine du" : "Jour"}
          />
        </div>
        <div
          className="adm-card adm-enter p-5 min-w-0"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, animationDelay: "530ms" }}
        >
          <div className="adm-hairline" />
          <Donut
            title="Appareils"
            subtitle="Sur la période"
            centerLabel="visites"
            segments={[
              { label: appareils[0]?.label ?? "Mobile", value: appareils[0]?.valeur ?? 0, color: CHART.blue },
              { label: appareils[1]?.label ?? "Tablette", value: appareils[1]?.valeur ?? 0, color: CHART.amber },
              { label: appareils[2]?.label ?? "Ordinateur", value: appareils[2]?.valeur ?? 0, color: CHART.green },
            ]}
          />
        </div>
      </div>

      {/* ── Comment ils arrivent · fabricant de liens ── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Carte titre="Comment ils arrivent" indice="Origine de chaque visite" delai={6}>
          {canaux.length === 0 ? (
            <Vide message="Les premières visites apparaîtront ici." />
          ) : (
            <ul className="space-y-3">
              {canaux.map((c) => (
                <li key={c.label}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-sm truncate" style={{ color: T.textDim }}>{c.label}</span>
                    <span
                      className="text-sm font-semibold flex-shrink-0"
                      style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatNumber(c.valeur)}
                    </span>
                  </div>
                  <div style={{ height: 4, backgroundColor: T.float }}>
                    <div
                      style={{
                        height: 4,
                        width: `${Math.round((c.valeur / Math.max(1, totalCanaux)) * 100)}%`,
                        backgroundColor: T.accent,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Créer un lien marqué" indice="À poser dans une annonce, un email, un flyer" delai={7}>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: T.muted }} htmlFor="lien-page">Page d&apos;arrivée</label>
                <select
                  id="lien-page"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  className={fieldClass}
                  style={fieldStyle}
                >
                  {PAGES_PUBLIQUES.map((p) => (
                    <option key={p.path} value={p.path} style={{ backgroundColor: T.float }}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} style={{ color: T.muted }} htmlFor="lien-marqueur">Marqueur</label>
                <input
                  id="lien-marqueur"
                  value={marqueur}
                  onChange={(e) => setMarqueur(e.target.value)}
                  placeholder="leboncoin"
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
            </div>

            {pageChoisie.ancre && (
              <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: T.textDim }}>
                <input
                  type="checkbox"
                  checked={versFormulaire}
                  onChange={(e) => setVersFormulaire(e.target.checked)}
                  style={{ accentColor: "#6B9FEE" }}
                />
                Arriver directement sur le formulaire
              </label>
            )}

            <div className="flex items-center gap-2.5 px-3 py-3" style={{ backgroundColor: T.float, border: `1px solid ${T.border}` }}>
              <Link2 size={14} style={{ color: T.muted, flexShrink: 0 }} />
              <span className="text-[12px] break-all" style={{ color: T.textDim }}>{lien}</span>
            </div>

            <button type="button" onClick={copier} className={btnPrimaryClass} style={btnPrimaryStyle}>
              {copie ? <Check size={14} /> : <Copy size={14} />}
              {copie ? "Copié" : "Copier le lien"}
            </button>

            <p className="text-[11px]" style={{ color: T.muted }}>
              Le marqueur reste invisible pour le visiteur et suit sa visite de page en page.
            </p>
          </div>
        </Carte>
      </div>

      {/* ── Par lien · provenance ── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Carte titre="Par lien" indice="Visites reçues par marqueur de campagne" delai={8}>
          {liens.length === 0 ? (
            <Vide message="Posez un lien marqué quelque part, ses visites arriveront ici." />
          ) : (
            <ul>
              {liens.map((l) => (
                <LigneBarre
                  key={l.src || "sans"}
                  titre={l.label}
                  sous={l.marque ? `?src=${l.src}` : "Adresse tapée ou lien sans marqueur"}
                  valeur={l.visites}
                  part={l.part}
                  etiquette={l.marque ? <Tag tone="accent">Campagne</Tag> : undefined}
                />
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Provenance" indice="Sites qui renvoient vers le vôtre" delai={9}>
          {provenances.length === 0 ? (
            <Vide message="Les sites qui renvoient vers le vôtre apparaîtront ici." />
          ) : (
            <ul>
              {provenances.map((p) => (
                <LigneBarre key={p.referrer} titre={p.referrer} sous={p.canal} valeur={p.visites} part={p.part} />
              ))}
            </ul>
          )}
        </Carte>
      </div>

      {/* ── Pages ── */}
      <div className="mb-5">
        <Carte titre="Pages" indice="Pages vues, et parmi elles les arrivées sur le site" delai={10}>
          {pagesVues.length === 0 ? (
            <Vide message="Les pages consultées apparaîtront ici." />
          ) : (
            <ul>
              {pagesVues.map((p) => (
                <LigneBarre
                  key={p.path}
                  titre={p.label}
                  sous={p.path}
                  valeur={p.pages}
                  detail={`${formatNumber(p.arrivees)} arrivée${p.arrivees > 1 ? "s" : ""}`}
                  part={p.part}
                />
              ))}
            </ul>
          )}
        </Carte>
      </div>

      {/* ── Journal ── */}
      <Carte titre="Dernières visites" indice="Les trente derniers passages, tous liens confondus" delai={11}>
        {dernieres.length === 0 ? (
          <Vide message="Le journal se remplira dès la première visite." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 640 }}>
              <thead>
                <tr style={{ color: T.muted }}>
                  {["Heure", "Page", "Lien", "Origine", "Appareil", ""].map((h, i) => (
                    <th
                      key={h + i}
                      className={`font-normal text-[11px] uppercase tracking-widest py-2 ${i > 3 ? "text-right" : "text-left"}`}
                      style={{ borderBottom: `1px solid ${T.border}` }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ color: T.textDim }}>
                {dernieres.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 whitespace-nowrap" style={{ borderBottom: `1px solid ${T.surfaceAlt}`, fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ color: T.text }}>{v.heure}</span>
                      <span className="text-[11px] ml-2" style={{ color: T.muted }}>{v.quand}</span>
                    </td>
                    <td className="py-2 pr-3" style={{ borderBottom: `1px solid ${T.surfaceAlt}` }}>
                      <span className="block truncate" style={{ maxWidth: 220 }}>{v.page}</span>
                    </td>
                    <td className="py-2 pr-3" style={{ borderBottom: `1px solid ${T.surfaceAlt}` }}>
                      {v.src ? <Tag tone="accent">{v.src}</Tag> : <span style={{ color: T.muted }}>—</span>}
                    </td>
                    <td className="py-2 pr-3" style={{ borderBottom: `1px solid ${T.surfaceAlt}` }}>
                      <span className="block truncate" style={{ maxWidth: 180, color: T.muted }}>{v.origine}</span>
                    </td>
                    <td className="py-2 text-right whitespace-nowrap" style={{ borderBottom: `1px solid ${T.surfaceAlt}`, color: T.muted }}>
                      {v.appareil}
                      {v.pays && <span className="ml-2">{v.pays}</span>}
                    </td>
                    <td className="py-2 pl-3 text-right" style={{ borderBottom: `1px solid ${T.surfaceAlt}` }}>
                      {v.nouveau ? <Tag tone="success">Nouveau</Tag> : v.entree ? <Tag>Arrivée</Tag> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>
    </AdminPage>
  );
}
