import { AdminPage, Skeleton, SkeletonRows, T } from "../ui";

export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={130} h={26} className="mb-2" />
        <Skeleton w={230} h={12} />
      </div>
      {/* Deux sections : devis en attente, factures échues. Du texte, jamais de photo. */}
      <Skeleton w={180} h={14} className="mb-3" />
      <SkeletonRows count={3} thumb={false} />
      <div className="h-8" />
      <Skeleton w={150} h={14} className="mb-3" />
      <SkeletonRows count={2} thumb={false} />
    </AdminPage>
  );
}
