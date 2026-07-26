import { AdminPage, Skeleton, T } from "../ui";
import { GRID_H } from "@/lib/planning";

export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={220} h={26} className="mb-2" />
        <Skeleton w={300} h={12} />
      </div>
      <div className="flex gap-4 mb-4">
        <Skeleton w={340} h={12} />
      </div>
      {/* Même hauteur que la grille réelle : le squelette cesse de sauter au chargement. */}
      <Skeleton h={GRID_H + 42} />
    </AdminPage>
  );
}
