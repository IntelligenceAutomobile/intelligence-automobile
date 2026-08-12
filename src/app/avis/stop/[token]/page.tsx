import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import StopForm from "./StopForm";

export const metadata = {
  title: "Vos préférences de messages",
  robots: { index: false, follow: false },
};

/** Masque l'adresse : la page se lit sans exposer l'email en clair. */
function masque(email: string): string {
  const [avant, apres] = email.split("@");
  if (!apres) return "votre adresse";
  const debut = avant.slice(0, 2);
  return `${debut}${"•".repeat(Math.max(3, avant.length - 2))}@${apres}`;
}

// Page d'opposition, ouverte depuis le pied des invitations à laisser un avis.
//
// Le geste demande une confirmation explicite plutôt que de s'appliquer à
// l'ouverture : les robots des messageries suivent les liens des emails, et un
// simple survol aurait suffi à désinscrire quelqu'un qui n'a rien demandé.
export default async function StopAvisPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { reviewToken: token },
    select: { email: true, reviewOutcome: true },
  });
  if (!client) notFound();

  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-lg">
          <div style={{ width: 28, height: 2, backgroundColor: "#6B9FEE" }} className="mb-6" />
          <h1 className="text-2xl font-light mb-4" style={{ color: "#FFFFFF", letterSpacing: "-0.01em" }}>
            Vos préférences de messages
          </h1>
          <StopForm
            token={token}
            adresse={masque(client.email)}
            dejaFait={client.reviewOutcome === "stop"}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
