"use client";

// Historique des échanges d'une fiche client : ce que la personne a écrit
// (boîte IONOS) et ce que le site lui a envoyé (journal), sur une seule ligne
// de temps. Chaque entrée s'ouvre dans la Messagerie.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { T, Tag, SectionCard, type Tone } from "../../ui";

type Echange = { sens: "recu" | "envoye"; ref: string; subject: string; date: string; etat: string };

const ETAT_TONE: Record<string, Tone> = {
  ouvert: "success",
  remis: "accent",
  envoyé: "muted",
  injoignable: "danger",
  retenu: "warning",
  refusé: "danger",
  "non lu": "accent",
  lu: "muted",
};

function stamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default function Echanges({ clientId, email }: { clientId: string; email: string }) {
  const [liste, setListe] = useState<Echange[] | null>(null);
  const [boite, setBoite] = useState(true);

  useEffect(() => {
    if (!email) return;
    let vivant = true;
    fetch(`/api/admin/clients/${clientId}/echanges`)
      .then((r) => r.json())
      .then((j) => {
        if (!vivant) return;
        setListe(Array.isArray(j.echanges) ? (j.echanges as Echange[]) : []);
        setBoite(j.boite !== false);
      })
      .catch(() => {
        if (vivant) setListe([]);
      });
    return () => {
      vivant = false;
    };
  }, [clientId, email]);

  return (
    <SectionCard title={`Échanges${liste ? ` (${liste.length})` : ""}`}>
      {!email ? (
        <p className="text-sm" style={{ color: T.muted }}>Renseignez une adresse email pour retrouver ses échanges.</p>
      ) : liste === null ? (
        <p className="text-sm inline-flex items-center gap-2" style={{ color: T.muted }}>
          <Loader2 size={13} className="animate-spin" /> Lecture de la boîte et du journal…
        </p>
      ) : liste.length === 0 ? (
        <p className="text-sm" style={{ color: T.muted }}>Aucun email échangé avec cette personne pour l&apos;instant.</p>
      ) : (
        <ul>
          {liste.map((e, i) => {
            const href = e.sens === "recu" ? `/admin/messagerie?ouvrir=${e.ref}` : `/admin/messagerie?vue=envoyes&envoi=${e.ref}`;
            const Icon = e.sens === "recu" ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={`${e.sens}-${e.ref}`}>
                <Link
                  href={href}
                  className="flex items-center gap-3 py-2 transition-colors hover:text-[#F0F5FF]"
                  style={{ color: T.textDim, borderTop: i === 0 ? "none" : `1px solid ${T.surfaceAlt}` }}
                  title={e.sens === "recu" ? "Message reçu : l'ouvrir dans la Messagerie" : "Message envoyé : le revoir dans la Messagerie"}
                >
                  <Icon size={13} className="flex-shrink-0" style={{ color: e.sens === "recu" ? T.accent : T.muted }} />
                  <span className="text-[13px] truncate min-w-0">{e.subject}</span>
                  <span className="ml-auto flex items-center gap-2 flex-shrink-0">
                    <Tag tone={ETAT_TONE[e.etat] ?? "muted"}>{e.etat}</Tag>
                    <span className="text-[11px] whitespace-nowrap" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>{stamp(e.date)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {!boite && (
        <p className="text-[11px] mt-3" style={{ color: T.muted }}>
          La boîte de réception est injoignable pour l&apos;instant : seuls les envois du site sont listés.
        </p>
      )}
    </SectionCard>
  );
}
