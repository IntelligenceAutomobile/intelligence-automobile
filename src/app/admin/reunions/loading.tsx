// Squelette au gabarit exact du fil de l'année : en-tête, trois tuiles, barre de
// recherche, puis un mois de lignes. Sans lui, l'écran saute au chargement.
import { T, AdminPage, Skeleton, SkeletonTiles } from "../ui";

export default function LoadingReunions() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={190} h={26} className="mb-3" />
        <Skeleton w={280} h={12} />
      </div>

      <SkeletonTiles count={3} />

      <div className="flex items-center gap-2 mb-6">
        <Skeleton h={36} />
        <Skeleton w={70} h={30} />
        <Skeleton w={70} h={30} />
      </div>

      <Skeleton w={120} h={10} className="mb-3" />
      <div className="pl-4" style={{ borderLeft: `2px solid ${T.border}` }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5" style={{ borderBottom: `1px solid ${T.border}` }}>
            <Skeleton w={46} h={46} />
            <div className="flex-1 space-y-2">
              <Skeleton w={210} h={13} />
              <Skeleton w={150} h={10} />
            </div>
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
