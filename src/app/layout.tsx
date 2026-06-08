import type { Metadata } from "next";
import { Geist, DM_Sans } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Intelligence Automobile — Import Premium Européen",
  description:
    "Importateur spécialisé dans la sélection et l'acquisition de véhicules premium en provenance d'Allemagne et de Belgique. Sécurité, transparence et accompagnement complet.",
  keywords: "import automobile, véhicules premium, Allemagne, Belgique, BMW, Audi, Mercedes, Porsche",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geist.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
