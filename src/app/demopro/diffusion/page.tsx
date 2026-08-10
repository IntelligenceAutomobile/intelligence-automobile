// Diffusion multi-portails de la démonstration /demopro (lecture seule).
// L'habillage vient du module partagé src/app/admin/diffusion/presentation.tsx :
// ce qui change dans le back-office change ici du même coup. Cet écran ne
// fournit que les valeurs (fixtures figées de src/lib/demo-data.ts) et des
// boutons de démonstration, qui affichent un toast au lieu d'agir.
import { FileCode2, CircleOff, Radio } from "lucide-react";
import { formatNumber } from "@/lib/format";
import {
  PORTALS, controleDiffusion, daysOnline, digestAnnonce, etatPortail, FENETRE_ARRIVEES_JOURS,
  type EtatPortail, type Portal,
} from "@/lib/diffusion";
import { T, AdminPage, PageHeader, Tag, btnGhostClass, btnGhostStyle, firstImage } from "@/app/admin/ui";
import { KpiTile } from "@/app/admin/charts";
import {
  BandeColonnes, ContenuCellule, LigneDiffusion, MentionArrivees, MentionPied,
  actionLigneClass, celluleClass, libelleCellule, tonDe, type LigneVue,
} from "@/app/admin/diffusion/presentation";
import { getDemoVehicles, getDemoListings, getDemoArrivees } from "@/lib/demo-data";
import DemoActionButton from "../DemoActionButton";

function compte(json: string): number {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && x.trim() !== "").length : 0;
  } catch {
    return 0;
  }
}

export default async function DemoDiffusionPage() {
  // On diffuse le stock encore en vente (comme le back-office).
  const vehicles = getDemoVehicles().filter((v) => v.status === "disponible" || v.status === "reserve");
  const listings = getDemoListings();
  const arrivees = getDemoArrivees();
  const maintenant = new Date().getTime();

  const parCle = new Map(listings.map((l) => [`${l.vehicleId}:${l.portal}`, l]));

  const lignes: LigneVue[] = vehicles.map((v) => {
    const empreinte = digestAnnonce({
      price: v.price,
      mileage: v.mileage,
      photoCount: compte(v.images),
      description: v.description,
      features: v.features,
    });
    const etats = {} as Record<Portal, EtatPortail>;
    const dates: number[] = [];
    for (const p of PORTALS) {
      const l = parCle.get(`${v.id}:${p}`);
      const publishedAt = l?.publishedAt ?? null;
      etats[p] = etatPortail(l?.status, l?.publishedDigest ?? "", empreinte);
      if (etats[p] !== "retire" && publishedAt) dates.push(publishedAt.getTime());
    }
    const mesure = arrivees[v.id];
    const controle = controleDiffusion({
      photoCount: compte(v.images),
      price: v.price,
      mileage: v.mileage,
      descriptionLength: v.description.trim().length,
      featureCount: compte(v.features),
    });
    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      price: v.price,
      status: v.status,
      image: firstImage(v.images),
      etats,
      joursEnLigne: dates.length ? daysOnline(new Date(Math.min(...dates)), maintenant) : null,
      joursEnStock: daysOnline(v.createdAt, maintenant),
      arrivees: mesure?.total ?? 0,
      arriveesParPortail: (mesure?.parPortail ?? {}) as Record<Portal, number>,
      bloquants: controle.bloquants,
      aSignaler: controle.aSignaler,
      dansLeFlux: v.status === "disponible",
    };
  });

  const pris = lignes.reduce((n, l) => n + PORTALS.filter((p) => l.etats[p] !== "retire").length, 0);
  const complets = lignes.filter((l) => PORTALS.every((p) => l.etats[p] !== "retire")).length;
  const aRepublier = lignes.filter((l) => PORTALS.some((p) => l.etats[p] === "a-republier")).length;
  const totalArrivees = lignes.reduce((n, l) => n + l.arrivees, 0);
  const emplacements = lignes.length * PORTALS.length;
  const libres = emplacements - pris;
  const dansLeFlux = lignes.filter((l) => l.dansLeFlux).length;

  return (
    <AdminPage>
      <PageHeader
        title="Diffusion des annonces"
        badge={<Tag tone="warning">Simulation</Tag>}
        subtitle={
          <>
            {formatNumber(lignes.length)} véhicules diffusables · {formatNumber(pris)} emplacements sur{" "}
            {formatNumber(emplacements)} occupés · flux XML actif
          </>
        }
        action={
          <div className="flex flex-col items-stretch sm:items-end gap-1.5 max-w-full">
            <DemoActionButton className={btnGhostClass} style={btnGhostStyle}>
              <FileCode2 size={14} />
              Télécharger le flux XML
            </DemoActionButton>
            <span className="text-[11px] leading-snug sm:text-right max-w-xs" style={{ color: T.muted }}>
              {`Transmettez ce fichier à votre agrégateur, il publiera votre stock. ${formatNumber(dansLeFlux)} véhicules à l'intérieur.`}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
        <KpiTile
          label="Diffusion complète"
          value={complets}
          icon="radio"
          index={0}
          hint={`sur ${formatNumber(lignes.length)} véhicules`}
        />
        <KpiTile
          label="À compléter"
          value={lignes.length - complets}
          icon="grid"
          index={1}
          hint={`${formatNumber(libres)} emplacement${libres > 1 ? "s" : ""} libre${libres > 1 ? "s" : ""}`}
        />
        <KpiTile
          label="À republier"
          value={aRepublier}
          icon="clock"
          index={2}
          hint="fiche modifiée depuis la mise en ligne"
        />
        <KpiTile
          label={`Arrivées sur ${FENETRE_ARRIVEES_JOURS} j`}
          value={totalArrivees}
          icon="eye"
          index={3}
          hint="visites mesurées sur vos fiches"
        />
      </div>
      <MentionArrivees />

      <div className="@container" style={{ border: `1px solid ${T.border}` }}>
        <BandeColonnes />

        {lignes.map((vue, i) => {
          const tout = PORTALS.every((p) => vue.etats[p] === "en-ligne");
          const aRepublierIci = PORTALS.some((p) => vue.etats[p] === "a-republier");
          return (
            <LigneDiffusion
              key={vue.id}
              vue={vue}
              first={i === 0}
              href="/demopro/vehicules"
              cellules={PORTALS.map((p) => {
                const ton = tonDe(vue.etats[p]);
                return (
                  <DemoActionButton
                    key={p}
                    ariaLabel={libelleCellule(`${vue.make} ${vue.model}`, p, vue.etats[p])}
                    className={celluleClass}
                    style={{ backgroundColor: ton.bg, border: `1px solid ${ton.bd}`, color: ton.fg }}
                  >
                    <ContenuCellule portal={p} etat={vue.etats[p]} />
                  </DemoActionButton>
                );
              })}
              action={
                <DemoActionButton
                  className={actionLigneClass}
                  style={{ color: tout ? T.muted : aRepublierIci ? T.warning : T.accent }}
                >
                  {tout ? <CircleOff size={12} /> : <Radio size={12} />}
                  {tout ? "Tout retirer" : aRepublierIci ? "Republier" : "Diffuser"}
                </DemoActionButton>
              }
            />
          );
        })}
      </div>

      <MentionPied />
    </AdminPage>
  );
}
