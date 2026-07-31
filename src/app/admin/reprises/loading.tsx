import { AdminPage, Skeleton, SkeletonRows, T } from "../ui";

// La silhouette montre exactement ce que la page montrera : la recherche, les
// pastilles, la liste. Le bandeau de chiffres arrive avec le lot suivant, et
// l'annoncer ici produirait un saut visible à l'arrivée des vraies données.
export default function Loading() {
  return (
    <AdminPage>
      <div className="mb-8">
        <div style={{ width: 24, height: 2, backgroundColor: T.border }} className="mb-3" />
        <Skeleton w={140} h={26} className="mb-2" />
        <Skeleton w={220} h={12} />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton w={240} h={42} />
        <Skeleton w={96} h={38} />
        <Skeleton w={112} h={38} />
        <Skeleton w={104} h={38} />
      </div>
      {/* Une estimation porte du texte, jamais de photo. */}
      <SkeletonRows count={6} thumb={false} />
    </AdminPage>
  );
}
