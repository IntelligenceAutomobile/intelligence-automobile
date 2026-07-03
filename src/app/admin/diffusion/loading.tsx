import { AdminPage, Skeleton, SkeletonRows, T } from "../ui";

export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={240} h={26} className="mb-2" />
        <Skeleton w={300} h={12} />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Skeleton h={110} />
        <Skeleton h={110} />
        <Skeleton h={110} />
      </div>
      <SkeletonRows count={5} />
    </AdminPage>
  );
}
