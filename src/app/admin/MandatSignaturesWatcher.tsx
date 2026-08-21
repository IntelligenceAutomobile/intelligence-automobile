"use client";

// Veille sur les mandats signés en ligne par le vendeur.
// Même recette que les acceptations de devis : une fenêtre qui s'ouvre où que
// l'on soit dans le back-office, et une pastille sur « Mandats » dans la barre
// latérale tant que la signature n'a pas été consultée.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSignature, X } from "lucide-react";
import { formatEuroCents } from "@/lib/comptes";
import { T, TONE, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "./ui";

export type SignatureMandat = {
  id: string;
  reference: string;
  vehicule: string;
  ownerName: string;
  signerName: string;
  signedAt: string;
  priceCents: number;
  immediateExecution: boolean;
};

const POLL_MS = 30_000;
// Dernière signature dont la pastille a été consultée (visite de la liste).
const KEY_VU = "ia_mandats_signes_vus";

function lire(cle: string): string {
  try {
    return localStorage.getItem(cle) ?? "";
  } catch {
    return "";
  }
}
function ecrire(cle: string, valeur: string) {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    /* navigation privée verrouillée : la veille reste utilisable, sans mémoire */
  }
}

/* ── Petit magasin partagé, lu par la barre latérale sans contexte autour ── */
let signatures: SignatureMandat[] = [];
let vuJusqua = "";
// Repère posé à la première lecture : la fenêtre ne s'ouvre que pour les
// signatures arrivées APRÈS, jamais pour une vieille nouvelle.
let annonceJusqua: string | null = null;
let compteur = 0;
let abonnes: Array<() => void> = [];

function recalculer() {
  const suivant = signatures.filter((s) => s.signedAt > vuJusqua).length;
  if (suivant === compteur) return;
  compteur = suivant;
  abonnes.forEach((cb) => cb());
}

function subscribeCompteur(cb: () => void) {
  abonnes.push(cb);
  return () => {
    abonnes = abonnes.filter((x) => x !== cb);
  };
}
const readCompteur = () => compteur;
const readCompteurServeur = () => 0;

// Compteur de signatures à découvrir, pour la pastille de navigation.
export function useMandatSignatureCount(): number {
  return useSyncExternalStore(subscribeCompteur, readCompteur, readCompteurServeur);
}

export default function MandatSignaturesWatcher() {
  const pathname = usePathname();
  const [file, setFile] = useState<SignatureMandat[]>([]);
  const demarre = useRef(false);
  const ecran = useRef(pathname);

  // Consulter la liste des mandats vaut prise de connaissance : la pastille s'éteint.
  const marquerVu = useCallback(() => {
    if (!ecran.current.startsWith("/admin/mandats")) return;
    const dernier = signatures[0]?.signedAt ?? "";
    if (!dernier || dernier <= vuJusqua) return;
    vuJusqua = dernier;
    ecrire(KEY_VU, dernier);
    recalculer();
  }, []);

  const verifier = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/mandats/signatures", { cache: "no-store" });
      if (!res.ok) return;
      const j: { signatures?: SignatureMandat[] } = await res.json();
      signatures = Array.isArray(j.signatures) ? j.signatures : [];
      recalculer();

      const dernier = signatures[0]?.signedAt ?? "";
      if (annonceJusqua === null) {
        // Première lecture : on note où l'on en est, sans rien annoncer.
        annonceJusqua = dernier;
      } else {
        const nouvelles = signatures.filter((s) => s.signedAt > (annonceJusqua ?? ""));
        if (nouvelles.length > 0) setFile(nouvelles);
      }

      marquerVu();
    } catch {
      /* une coupure réseau laisse simplement la veille silencieuse */
    }
  }, [marquerVu]);

  useEffect(() => {
    if (!demarre.current) {
      demarre.current = true;
      vuJusqua = lire(KEY_VU);
    }
    // La première lecture attend que la page soit posée, et s'espace de celle
    // des devis pour éviter deux requêtes dans la même seconde.
    const premier = setTimeout(() => void verifier(), 1600);
    const id = setInterval(() => void verifier(), POLL_MS);
    const auRetour = () => {
      if (document.visibilityState === "visible") void verifier();
    };
    document.addEventListener("visibilitychange", auRetour);
    window.addEventListener("focus", auRetour);
    return () => {
      clearTimeout(premier);
      clearInterval(id);
      document.removeEventListener("visibilitychange", auRetour);
      window.removeEventListener("focus", auRetour);
    };
  }, [verifier]);

  useEffect(() => {
    ecran.current = pathname;
    marquerVu();
  }, [pathname, marquerVu]);

  const vedette = file[0];
  const autres = file.length - 1;

  function refermer() {
    const dernier = file[0]?.signedAt ?? "";
    if (dernier) annonceJusqua = dernier;
    setFile([]);
  }

  if (!vedette) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Mandat signé par le vendeur"
    >
      <div
        className="adm-enter w-full max-w-md p-8 text-center relative"
        style={{
          backgroundColor: T.surface,
          border: `1px solid ${T.border}`,
          borderTop: `2px solid ${T.success}`,
          boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
        }}
      >
        <button
          type="button"
          onClick={refermer}
          aria-label="Fermer"
          className="adm-act absolute top-3 right-3 inline-flex items-center justify-center w-7 h-7"
          style={{ color: T.muted }}
        >
          <X size={15} />
        </button>

        <div className="flex justify-center mb-4">
          <span
            className="inline-flex items-center justify-center"
            style={{ width: 52, height: 52, border: `1px solid ${TONE.success.bd}`, backgroundColor: TONE.success.bg, color: T.success }}
          >
            <FileSignature size={24} />
          </span>
        </div>

        <p className="text-[11px] tracking-[0.2em] uppercase mb-2" style={{ color: T.success }}>
          Mandat signé
        </p>
        <p className="text-xl mb-1.5" style={{ color: T.text }}>
          {vedette.signerName || vedette.ownerName || "Votre client"} vient de signer.
        </p>
        <p className="text-sm mb-1" style={{ color: T.textDim, fontVariantNumeric: "tabular-nums" }}>
          {vedette.reference} · {vedette.vehicule}
          {vedette.priceCents > 0 ? ` · ${formatEuroCents(vedette.priceCents)}` : ""}
        </p>
        <p className="text-[12px] mb-7" style={{ color: T.muted }}>
          {vedette.immediateExecution
            ? "Exécution immédiate demandée : la mise en vente peut démarrer."
            : "Exécution immédiate déclinée : la mise en vente attend la fin du délai de rétractation."}
          {autres > 0 ? ` · ${autres} autre${autres > 1 ? "s" : ""} mandat${autres > 1 ? "s" : ""} signé${autres > 1 ? "s" : ""}` : ""}
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href={`/admin/mandats/${vedette.id}`}
            onClick={refermer}
            className={btnPrimaryClass + " w-full py-3.5"}
            style={btnPrimaryStyle}
          >
            Ouvrir le mandat
          </Link>
          <button type="button" onClick={refermer} className={btnGhostClass + " w-full py-3"} style={btnGhostStyle}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
