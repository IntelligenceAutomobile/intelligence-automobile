import { AdminPage, Skeleton, SkeletonRows, T } from "../ui";

export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={120} h={26} className="mb-2" />
        <Skeleton w={160} h={12} />
      </div>
      <SkeletonRows count={6} />
    </AdminPage>
  );
}
