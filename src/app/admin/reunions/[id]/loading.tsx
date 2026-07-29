// Squelette au gabarit de la fiche : en-tête, photo de situation, puis les
// cartes Décisions / Actions / Synthèse.
import { T, AdminPage, Skeleton } from "../../ui";

function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="p-5 sm:p-6 space-y-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
      <Skeleton w={130} h={11} />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} w={i % 2 === 0 ? "88%" : "64%"} h={13} />
      ))}
    </div>
  );
}

export default function LoadingReunion() {
  return (
    <AdminPage width="narrow">
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={300} h={28} className="mb-3" />
        <div className="flex gap-3">
          <Skeleton w={120} h={26} />
          <Skeleton w={100} h={26} />
        </div>
      </div>
      {/* Cinq cartes, comme la fiche : photo de situation, décisions, actions,
          synthèse, documents. Trois seulement faisaient doubler la hauteur de la
          page à l'arrivée des données. */}
      <div className="space-y-5">
        <CardSkeleton lines={2} />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={1} />
      </div>
    </AdminPage>
  );
}
