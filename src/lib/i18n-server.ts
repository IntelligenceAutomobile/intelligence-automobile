import { cookies } from "next/headers";
import { fr } from "@/i18n/fr";
import { en } from "@/i18n/en";

export async function getTranslations() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "fr";
  return { t: locale === "en" ? en : fr, locale };
}
