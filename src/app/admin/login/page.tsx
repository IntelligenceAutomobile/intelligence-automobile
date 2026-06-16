import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import LoginForm from "./LoginForm";
import { LogoFull } from "@/components/Header";
import { T } from "../ui";

export const metadata = { title: "Admin — Intelligence Automobile" };

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: T.bg }}
    >
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8">
            <LogoFull markHeight={100} layout="col" />
          </div>
          <h1 className="text-xl font-light" style={{ color: T.text }}>
            Administration
          </h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
