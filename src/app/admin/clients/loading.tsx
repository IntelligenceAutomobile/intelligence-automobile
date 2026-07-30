import { AdminPage, Skeleton, T } from "../ui";

export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={200} h={26} className="mb-2" />
        <Skeleton w={160} h={12} />
      </div>
      {/* Mêmes points de rupture que les vraies tuiles, sinon l'écran saute de
          deux à trois colonnes au moment où la page arrive. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="px-4 py-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
            <Skeleton w={110} h={9} className="mb-2" />
            <Skeleton w={130} h={24} className="mb-2" />
            <Skeleton w={90} h={10} />
          </div>
        ))}
      </div>
      <div className="mb-6 max-w-md"><Skeleton h={46} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <Skeleton h={40} className="mb-3" />
            <div className="p-4 space-y-3" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
              <Skeleton w={140} h={13} />
              <Skeleton w={100} h={11} />
              <Skeleton w={160} h={11} />
            </div>
          </div>
        ))}
      </div>
      <Skeleton w={140} h={12} className="mb-4" />
      <div style={{ border: `1px solid ${T.border}` }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
            <Skeleton w={180} h={13} />
            <Skeleton w={220} h={11} />
            <span className="ml-auto"><Skeleton w={80} h={12} /></span>
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
