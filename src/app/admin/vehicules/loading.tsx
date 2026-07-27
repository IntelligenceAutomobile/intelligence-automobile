import { AdminPage, Skeleton, T } from "../ui";

// Le squelette reprend le gabarit réel de l'écran : trois tuiles, la barre de
// recherche et ses pastilles, la ligne de tri, puis des lignes de tableau. Sans
// cela la page se réajustait d'un coup à l'arrivée des données.
export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={220} h={26} className="mb-2" />
        <Skeleton w={300} h={12} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <Skeleton h={74} />
        <Skeleton h={74} />
        <Skeleton h={74} className="col-span-2 lg:col-span-1" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
        <Skeleton w={320} h={46} />
        <div className="flex flex-wrap gap-2">
          {[92, 116, 104, 96, 118, 106].map((w, i) => (
            <Skeleton key={i} w={w} h={40} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Skeleton w={96} h={12} />
        <div className="flex items-center gap-3 ml-auto">
          <Skeleton w={150} h={34} />
          <Skeleton w={176} h={36} />
        </div>
      </div>

      <div style={{ border: `1px solid ${T.border}` }}>
        <div style={{ height: 36, backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }} />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4"
            style={{ height: 70, borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
          >
            <Skeleton w={14} h={14} />
            <Skeleton w={56} h={42} />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Skeleton w={210} h={13} />
              <Skeleton w={260} h={10} />
            </div>
            <Skeleton w={64} h={12} />
            <Skeleton w={84} h={14} />
            <Skeleton w={88} h={20} />
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
