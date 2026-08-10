import { AdminPage, Skeleton, T } from "../ui";

// Le squelette suit le gabarit RÉEL de l'écran : en-tête à deux blocs, trois
// tuiles sur deux colonnes en petit écran, bande de colonnes puis lignes à
// quatre cellules. Un squelette qui annonce une autre page fait sauter le
// contenu à l'arrivée.
export default function Loading() {
  return (
    <AdminPage>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
          <Skeleton w={280} h={26} className="mb-2" />
          <Skeleton w={340} h={12} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton w={210} h={42} />
          <Skeleton w={240} h={11} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
        <Skeleton h={118} />
        <Skeleton h={118} />
        <Skeleton h={118} />
      </div>
      <Skeleton w={380} h={11} className="mb-8" />

      <div style={{ border: `1px solid ${T.border}` }}>
        <div className="px-4 py-2.5" style={{ backgroundColor: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
          <Skeleton w={120} h={10} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-3 px-4 py-3.5"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
          >
            <Skeleton w={56} h={42} />
            <div className="flex-1 min-w-[140px] flex flex-col gap-1.5">
              <Skeleton w="70%" h={13} />
              <Skeleton w="45%" h={11} />
            </div>
            <div className="flex gap-2">
              <Skeleton w={84} h={39} />
              <Skeleton w={84} h={39} />
              <Skeleton w={84} h={39} />
              <Skeleton w={84} h={39} />
            </div>
            <Skeleton w={62} h={12} />
            <Skeleton w={96} h={16} />
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
