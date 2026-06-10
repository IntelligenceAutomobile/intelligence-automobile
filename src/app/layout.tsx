import type { Metadata } from "next";
import { Geist, DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/i18n/context";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "fr";

  return (
    <html lang={locale} className={`${geist.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <LocaleProvider initialLocale={locale}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
