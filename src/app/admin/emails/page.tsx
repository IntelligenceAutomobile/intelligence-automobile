import { redirect } from "next/navigation";

// L'écran Emails (liste rouge, journal) a rejoint la Messagerie : la liste
// rouge vit dans la vue Réglages, le journal dans la vue Envoyés.
export default function AncienneEmailsPage() {
  redirect("/admin/messagerie?vue=reglages");
}
