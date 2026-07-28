import { AdminPage, Skeleton, SkeletonRows, SkeletonTiles, T } from "../ui";

export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={120} h={26} className="mb-2" />
        <Skeleton w={160} h={12} />
      </div>
      <SkeletonTiles />
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton w={240} h={42} />
        <Skeleton w={92} h={38} />
        <Skeleton w={112} h={38} />
        <Skeleton w={104} h={38} />
      </div>
      {/* Une ligne de devis porte du texte, jamais de photo. */}
      <SkeletonRows count={6} thumb={false} />
    </AdminPage>
  );
}
