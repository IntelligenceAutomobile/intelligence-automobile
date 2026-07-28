"use client";

// Veille sur les devis signés en ligne par le client.
// Deux signaux, comme demandé : une fenêtre qui s'ouvre où que l'on soit dans le
// back-office, et une pastille sur « Devis » dans la barre latérale tant que la
// bonne nouvelle n'a pas été consultée.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PartyPopper, X } from "lucide-react";
import { formatEuro } from "@/lib/devis";
import { T, TONE, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "./ui";

export type Acceptation = {
  id: string;
  number: string;
  client: string;
  signerName: string;
  signedAt: string;
  amount: number;
};

const POLL_MS = 30_000;
// Dernière signature dont la pastille a été consultée (visite de la liste).
const KEY_VU = "ia_acceptations_vues";
// Dernière signature pour laquelle la fenêtre s'est déjà ouverte.
const KEY_ANNONCE = "ia_acceptations_annoncees";

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

/* ── Petit magasin partagé ──
   La barre latérale lit le compteur sans qu'il faille un contexte autour de
   toute la mise en page. */
let acceptations: Acceptation[] = [];
let vuJusqua = "";
let compteur = 0;
let abonnes: Array<() => void> = [];

function recalculer() {
  const suivant = acceptations.filter((a) => a.signedAt > vuJusqua).length;
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

// Compteur d'acceptations à découvrir, pour la pastille de navigation.
export function useAcceptationCount(): number {
  return useSyncExternalStore(subscribeCompteur, readCompteur, readCompteurServeur);
}

export default function AcceptationsWatcher() {
  const pathname = usePathname();
  const [file, setFile] = useState<Acceptation[]>([]);
  const demarre = useRef(false);
  // L'écran courant, lisible depuis la boucle de veille.
  const ecran = useRef(pathname);

  // Consulter la liste des devis vaut prise de connaissance : la pastille s'éteint.
  const marquerVu = useCallback(() => {
    if (!ecran.current.startsWith("/admin/devis")) return;
    const dernier = acceptations[0]?.signedAt ?? "";
    if (!dernier || dernier <= vuJusqua) return;
    vuJusqua = dernier;
    ecrire(KEY_VU, dernier);
    recalculer();
  }, []);

  // Interroge le serveur et met à jour le magasin + la file d'annonces.
  const verifier = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/devis/acceptations", { cache: "no-store" });
      if (!res.ok) return;
      const j: { acceptations?: Acceptation[] } = await res.json();
      acceptations = Array.isArray(j.acceptations) ? j.acceptations : [];
      recalculer();

      const annoncees = lire(KEY_ANNONCE);
      const nouvelles = acceptations.filter((a) => a.signedAt > annoncees);
      if (nouvelles.length > 0) setFile(nouvelles);

      // Après un rechargement complet, l'écran est déjà affiché quand la liste
      // arrive : sans ce rappel, la pastille survivait à la visite.
      marquerVu();
    } catch {
      /* une coupure réseau laisse simplement la veille silencieuse */
    }
  }, [marquerVu]);

  // Première lecture, puis toutes les 30 secondes et à chaque retour sur l'onglet.
  useEffect(() => {
    if (!demarre.current) {
      demarre.current = true;
      vuJusqua = lire(KEY_VU);
    }
    // La première lecture attend que la page soit posée : interroger le serveur
    // pendant le rendu ralentirait chaque changement d'écran.
    const premier = setTimeout(() => void verifier(), 800);
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

  // Navigation interne : la liste est déjà en mémoire, la pastille s'éteint tout de suite.
  useEffect(() => {
    ecran.current = pathname;
    marquerVu();
  }, [pathname, marquerVu]);

  const vedette = file[0];
  const autres = file.length - 1;

  function refermer() {
    // La fenêtre ne se rouvrira plus pour ces signatures-là.
    const dernier = file[0]?.signedAt ?? "";
    if (dernier) ecrire(KEY_ANNONCE, dernier);
    setFile([]);
  }

  if (!vedette) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Devis accepté par le client"
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
            <PartyPopper size={24} />
          </span>
        </div>

        <p className="text-[11px] tracking-[0.2em] uppercase mb-2" style={{ color: T.success }}>
          Devis accepté
        </p>
        <p className="text-xl mb-1.5" style={{ color: T.text }}>
          {vedette.client || vedette.signerName || "Votre client"} vient de signer.
        </p>
        <p className="text-sm mb-1" style={{ color: T.textDim, fontVariantNumeric: "tabular-nums" }}>
          Devis {vedette.number} · {formatEuro(vedette.amount)}
        </p>
        <p className="text-[12px] mb-7" style={{ color: T.muted }}>
          Signé par {vedette.signerName || "le client"}
          {vedette.signedAt
            ? ` le ${new Date(vedette.signedAt).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`
            : ""}
          {autres > 0 ? ` · ${autres} autre${autres > 1 ? "s" : ""} devis signé${autres > 1 ? "s" : ""}` : ""}
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href={`/admin/devis/${vedette.id}`}
            onClick={refermer}
            className={btnPrimaryClass + " w-full py-3.5"}
            style={btnPrimaryStyle}
          >
            Ouvrir le devis
          </Link>
          <button type="button" onClick={refermer} className={btnGhostClass + " w-full py-3"} style={btnGhostStyle}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
