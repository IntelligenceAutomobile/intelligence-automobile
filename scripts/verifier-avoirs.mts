// Contrôles de calcul des avoirs : montant crédité, reste dû, et sortie du
// centre de relances quand une facture est annulée par un avoir.
import { creditsByInvoice, remainingDue, avoirNumber, avoirPrefix, docTitle } from "../src/lib/devis";
import { relanceDue } from "../src/lib/relances";

let ko = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = String(got) === String(want);
  if (!ok) ko++;
  console.log(`${ok ? "ok  " : "KO  "} ${label} -> ${got}${ok ? "" : ` (attendu ${want})`}`);
};

const ligne = (montant: number) => JSON.stringify([{ id: "a", designation: "Avoir", detail: "", qty: 1, unitPrice: montant }]);
const avoir = (source: string | null, montant: number) => ({
  sourceQuoteId: source,
  items: ligne(montant),
  tvaMode: "marge",
  tvaRate: 20,
  depositMode: "none",
  depositValue: 0,
});

console.log("-- Montant credite par facture --");
const credits = creditsByInvoice([avoir("f1", 500), avoir("f1", 250.5), avoir("f2", 1200), avoir(null, 999)]);
check("deux avoirs se cumulent", credits.get("f1"), 750.5);
check("chaque facture est comptee a part", credits.get("f2"), 1200);
check("un avoir orphelin est ignore", credits.has("null"), "false");
check("une facture sans avoir n'apparait pas", credits.get("f3"), "undefined");

console.log("\n-- Reste du --");
check("credit partiel", remainingDue(10000, 2500), 2500 === 0 ? 10000 : 7500);
check("credit total", remainingDue(10000, 10000), 0);
check("credit superieur : jamais negatif", remainingDue(10000, 12000), 0);
check("arrondi au centime", remainingDue(4990.03, 1990.01), 3000.02);
check("aucun credit", remainingDue(4990, 0), 4990);

console.log("\n-- Numerotation --");
check("premiere serie", avoirNumber(2026, []), "AV-2026-001");
check("suite sur le plus grand", avoirNumber(2026, ["AV-2026-001", "AV-2026-007", "AV-2026-003"]), "AV-2026-008");
check("les factures ne comptent pas", avoirNumber(2026, ["FAC-2026-014"]), "AV-2026-001");
check("l'annee separe les series", avoirNumber(2026, ["AV-2025-042"]), "AV-2026-001");
check("prefixe", avoirPrefix(2026), "AV-2026-");

console.log("\n-- Titre du document --");
check("avoir", docTitle("avoir", "complete"), "AVOIR");
check("facture d'acompte inchangee", docTitle("facture", "acompte"), "FACTURE D'ACOMPTE");
check("devis inchange", docTitle("devis", "complete"), "DEVIS");

console.log("\n-- Centre de relances --");
const base = {
  status: "envoye",
  paymentStatus: "impayee",
  issueDate: "2026-06-01",
  validityDays: 30,
  lastRelanceDate: "",
  relanceSnoozeUntil: "",
};
const aujourdhui = "2026-07-30";

check("facture en retard : relance due", relanceDue({ ...base, docType: "facture" }, aujourdhui)?.kind, "facture");
check(
  "facture annulee par avoir : plus rien a reclamer",
  relanceDue({ ...base, docType: "facture", fullyCredited: true }, aujourdhui),
  "null",
);
check(
  "facture partiellement creditee : toujours relancee",
  relanceDue({ ...base, docType: "facture", fullyCredited: false }, aujourdhui)?.kind,
  "facture",
);
check(
  "un avoir ne se relance jamais",
  relanceDue({ ...base, docType: "avoir", status: "accepte", paymentStatus: "payee" }, aujourdhui),
  "null",
);
check(
  "un avoir au statut envoye non plus",
  relanceDue({ ...base, docType: "avoir" }, aujourdhui),
  "null",
);
check("devis inchange", relanceDue({ ...base, docType: "devis", sentAt: "2026-06-01T09:00:00Z" }, aujourdhui)?.kind, "devis");

console.log(ko === 0 ? "\nTOUT PASSE" : `\n${ko} ECHEC(S)`);
process.exit(ko === 0 ? 0 : 1);
