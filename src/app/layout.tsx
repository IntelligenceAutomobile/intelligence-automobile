import type { Metadata } from "next";
import { Geist, DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/i18n/context";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd } from "@/lib/jsonld";
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

const SITE_NAME = "Intelligence Automobile";
const SITE_TITLE = "Intelligence Automobile — Import Premium Européen";
const SITE_DESCRIPTION =
  "Importateur spécialisé dans la sélection et l'acquisition de véhicules premium en provenance de l'Union européenne. Sécurité, transparence et accompagnement complet.";

export const metadata: Metadata = {
  // Requis pour que les og:image relatives des pages soient servies en URL absolue :
  // les robots des messageries (WhatsApp, LinkedIn…) rejettent les chemins relatifs.
  metadataBase: new URL("https://intelligenceautomobile.fr"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: "import automobile, véhicules premium, Union européenne, BMW, Audi, Mercedes, Porsche",
  // Repli hérité par les pages qui gardent ce bloc openGraph par défaut.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [{ url: "/og/accueil.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og/accueil.jpg"],
  },
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
        <JsonLd data={organizationJsonLd()} />
        <LocaleProvider initialLocale={locale}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
