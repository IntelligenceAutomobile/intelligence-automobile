import { cookies } from "next/headers";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import Board from "./Board";

export const metadata: Metadata = { title: "—" };

export default async function AtelierPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("ia_collab")?.value;
  const isAuthed = !!auth && auth === process.env.COLLAB_PASSWORD;

  if (!isAuthed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0B1930" }}
      >
        <div className="w-full max-w-sm px-4">
          <LoginForm />
        </div>
      </div>
    );
  }

  const name = cookieStore.get("ia_collab_name")?.value ?? "Anonyme";
  return <Board authorName={name} />;
}
