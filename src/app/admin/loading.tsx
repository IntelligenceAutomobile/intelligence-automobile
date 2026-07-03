import { AdminPage, Skeleton, SkeletonStatCard, T } from "./ui";

export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-7">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={260} h={26} />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <div className="xl:col-span-2 p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <Skeleton w={140} h={14} className="mb-2" />
          <Skeleton w={200} h={10} className="mb-6" />
          <Skeleton h={200} />
        </div>
        <div className="p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <Skeleton w={150} h={14} className="mb-2" />
          <Skeleton w={120} h={10} className="mb-6" />
          <Skeleton h={164} />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <Skeleton w={110} h={14} className="mb-6" />
          <Skeleton h={160} />
        </div>
        <div className="xl:col-span-2 p-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <Skeleton w={130} h={14} className="mb-6" />
          <div className="space-y-4">
            <Skeleton h={28} />
            <Skeleton h={28} />
            <Skeleton h={28} />
            <Skeleton h={28} />
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
