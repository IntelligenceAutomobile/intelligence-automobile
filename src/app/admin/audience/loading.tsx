import { AdminPage, Skeleton, SkeletonRows, SkeletonStatCard, T } from "../ui";

// La silhouette montre exactement ce que la page montrera : quatre chiffres, la
// courbe et le camembert, puis les tableaux. Promettre un bloc absent de la page
// réelle produirait un saut visible à l'arrivée des données.
export default function Loading() {
  return (
    <AdminPage>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
          <Skeleton w={140} h={26} className="mb-2" />
          <Skeleton w={260} h={12} />
        </div>
        <div className="flex gap-2">
          <Skeleton w={96} h={38} />
          <Skeleton w={104} h={38} />
          <Skeleton w={104} h={38} />
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mb-5">
        <div className="p-5 xl:col-span-2" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <Skeleton w={90} h={14} className="mb-4" />
          <Skeleton h={210} />
        </div>
        <div className="p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <Skeleton w={90} h={14} className="mb-4" />
          <Skeleton h={164} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
            <Skeleton w={120} h={14} className="mb-4" />
            <SkeletonRows count={4} thumb={false} />
          </div>
        ))}
      </div>

      <div className="p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
        <Skeleton w={120} h={14} className="mb-4" />
        <SkeletonRows count={6} thumb={false} />
      </div>
    </AdminPage>
  );
}
