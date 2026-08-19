"use client";

// Réception : fenêtre de lecture sur la boîte contact@ (IONOS, IMAP).
// La liste à gauche, le message à droite, et « Répondre » ouvre l'écran
// Mailings avec l'adresse et l'objet déjà remplis.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Loader2, Mail, MailOpen, Paperclip, RefreshCw, Reply, Settings2 } from "lucide-react";
import { T, Tag, AdminPage, PageHeader, btnGhostClass, btnGhostStyle, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import type { MessageComplet, MessageResume } from "@/lib/reception";

function stamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function tailleLisible(octets: number): string {
  if (octets >= 1_000_000) return `${(octets / 1_000_000).toFixed(1).replace(".", ",")} Mo`;
  if (octets >= 1_000) return `${Math.round(octets / 1_000)} Ko`;
  return `${octets} o`;
}

export default function ReceptionClient({ configuree }: { configuree: boolean }) {
  const [messages, setMessages] = useState<MessageResume[] | null>(null);
  const [erreur, setErreur] = useState("");
  // Le premier chargement démarre avec la page : l'état « en cours » est posé
  // d'entrée, le rafraîchissement manuel le repose lui-même.
  const [chargeListe, setChargeListe] = useState(configuree);
  const [ouvert, setOuvert] = useState<MessageComplet | null>(null);
  const [uidEnCours, setUidEnCours] = useState<number | null>(null);

  // Va chercher la liste et pose le résultat. Tout se passe après l'aller-retour
  // réseau : le premier chargement peut donc partir directement de l'effet.
  const poseListe = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reception");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setMessages(j.messages as MessageResume[]);
      setErreur("");
    } catch (e) {
      setErreur(e instanceof Error && e.message ? e.message : "La boîte ne répond pas.");
      setMessages([]);
    } finally {
      setChargeListe(false);
    }
  }, []);

  function rafraichir() {
    setChargeListe(true);
    setErreur("");
    poseListe();
  }

  useEffect(() => {
    // Synchronisation avec un système externe (la boîte IONOS) : chaque
    // setState de poseListe intervient après l'aller-retour réseau.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (configuree) poseListe();
  }, [configuree, poseListe]);

  async function ouvre(m: MessageResume) {
    setUidEnCours(m.uid);
    try {
      const res = await fetch(`/api/admin/reception/${m.uid}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setOuvert(j.message as MessageComplet);
    } catch (e) {
      setErreur(e instanceof Error && e.message ? e.message : "Ce message ne s'ouvre pas.");
    } finally {
      setUidEnCours(null);
    }
  }

  const nonLus = (messages ?? []).filter((m) => !m.seen).length;

  if (!configuree) {
    return (
      <AdminPage>
        <PageHeader title="Réception" subtitle="La boîte contact@intelligenceautomobile.com, lue directement chez IONOS." />
        <div className="max-w-[620px] p-6" style={{ border: `1px solid ${T.border}`, backgroundColor: T.surface }}>
          <div className="flex items-center gap-2 mb-3">
            <Settings2 size={16} style={{ color: T.accent }} />
            <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Un dernier branchement</h2>
          </div>
          <p className="text-sm mb-3" style={{ color: T.textDim }}>
            L&apos;écran est prêt, il attend les accès à la boîte. Trois réglages à renseigner sur
            l&apos;hébergeur (et en local pour essayer) :
          </p>
          <ul className="text-[13px] space-y-1 mb-3" style={{ color: T.textDim }}>
            <li><code style={{ color: T.accent }}>IMAP_USER</code> · l&apos;adresse complète de la boîte</li>
            <li><code style={{ color: T.accent }}>IMAP_PASSWORD</code> · son mot de passe IONOS</li>
            <li><code style={{ color: T.accent }}>IMAP_HOST</code> · facultatif, vaut imap.ionos.fr par défaut</li>
          </ul>
          <p className="text-[12px]" style={{ color: T.muted }}>
            Le mot de passe se range dans les réglages sécurisés de l&apos;hébergeur : il transite ni par le code, ni par la base.
          </p>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Réception"
        subtitle={
          messages === null
            ? "Connexion à la boîte…"
            : `${messages.length} message${messages.length > 1 ? "s" : ""} affichés · ${nonLus} jamais ouvert${nonLus > 1 ? "s" : ""} · contact@intelligenceautomobile.com`
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button type="button" onClick={() => rafraichir()} disabled={chargeListe} className={btnGhostClass} style={btnGhostStyle}>
          {chargeListe ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Actualiser
        </button>
        <span className="text-[11px]" style={{ color: T.muted }}>
          Lecture seule : ouvrir un message ici le laisse intact dans la boîte, notamment son état lu / jamais ouvert.
        </span>
      </div>

      {erreur && (
        <div className="px-4 py-3 mb-4 text-sm" style={{ border: `1px solid ${T.danger}`, color: T.text }}>
          {erreur}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
        {/* ── Liste ── */}
        <div style={{ border: `1px solid ${T.border}` }}>
          {messages === null ? (
            <div className="p-6 text-sm inline-flex items-center gap-2" style={{ color: T.textDim }}>
              <Loader2 size={14} className="animate-spin" /> Connexion à la boîte…
            </div>
          ) : messages.length === 0 && !erreur ? (
            <div className="p-6 text-sm inline-flex items-center gap-2" style={{ color: T.textDim }}>
              <Inbox size={15} style={{ color: T.accent }} /> La boîte est vide.
            </div>
          ) : (
            messages.map((m, i) => {
              const actif = ouvert?.uid === m.uid;
              return (
                <button
                  key={m.uid}
                  type="button"
                  onClick={() => ouvre(m)}
                  className="w-full text-left px-4 py-3 block"
                  style={{
                    borderTop: i === 0 ? "none" : `1px solid ${T.border}`,
                    backgroundColor: actif ? T.surface : "transparent",
                  }}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {uidEnCours === m.uid ? (
                      <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: T.accent }} />
                    ) : m.seen ? (
                      <MailOpen size={13} className="flex-shrink-0" style={{ color: T.muted }} />
                    ) : (
                      <Mail size={13} className="flex-shrink-0" style={{ color: T.accent }} />
                    )}
                    <span
                      className="text-[13px] truncate min-w-0"
                      style={{ color: T.text, fontWeight: m.seen ? 400 : 700 }}
                    >
                      {m.fromName || m.fromAddress || "(expéditeur inconnu)"}
                    </span>
                    <span className="text-[11px] ml-auto whitespace-nowrap flex-shrink-0" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
                      {stamp(m.date)}
                    </span>
                  </span>
                  <span
                    className="block text-[12px] truncate mt-0.5 pl-[21px]"
                    style={{ color: m.seen ? T.muted : T.textDim, fontWeight: m.seen ? 400 : 600 }}
                  >
                    {m.subject}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* ── Lecture ── */}
        <div className="lg:sticky lg:top-6 min-w-0">
          {ouvert === null ? (
            <div className="p-10 text-sm flex flex-col items-center gap-3" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
              <Inbox size={22} style={{ color: T.accent }} />
              Choisissez un message dans la liste pour le lire ici.
            </div>
          ) : (
            <div style={{ border: `1px solid ${T.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.surface }}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>{ouvert.subject}</h2>
                    <p className="text-[12px]" style={{ color: T.textDim }}>
                      {ouvert.fromName ? `${ouvert.fromName} · ` : ""}
                      {ouvert.fromAddress}
                      <span style={{ color: T.muted }}> · {stamp(ouvert.date)}</span>
                    </p>
                    {ouvert.to && (
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: T.muted }}>À : {ouvert.to}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/mailings?a=${encodeURIComponent(ouvert.fromAddress)}&objet=${encodeURIComponent(
                      ouvert.subject.toLowerCase().startsWith("re") ? ouvert.subject : `Re : ${ouvert.subject}`,
                    )}`}
                    className={btnPrimaryClass}
                    style={btnPrimaryStyle}
                  >
                    <Reply size={13} />
                    Répondre
                  </Link>
                </div>
                {ouvert.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ouvert.attachments.map((a, i) => (
                      <Tag key={i} tone="muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Paperclip size={11} />
                          {a.filename} · {tailleLisible(a.size)}
                        </span>
                      </Tag>
                    ))}
                    <span className="text-[11px] self-center" style={{ color: T.muted }}>
                      Les pièces jointes se téléchargent depuis le webmail IONOS.
                    </span>
                  </div>
                )}
              </div>
              {/* Cadre isolé : les messages reçus s'affichent sans exécuter le
                  moindre script dans le back-office. Fond blanc : la plupart
                  des emails sont conçus pour un fond clair. */}
              <iframe
                title={`Message : ${ouvert.subject}`}
                srcDoc={ouvert.html}
                sandbox=""
                style={{ width: "100%", height: 560, border: 0, display: "block", backgroundColor: "#FFFFFF" }}
              />
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
