"use client";

// Messagerie : la boîte de réception, les envois, les modèles et les réglages
// en une seule page, agencée comme un client mail. Colonne de gauche : les
// vues. Milieu : la liste. Droite : la lecture, ou la composition avec son
// aperçu en direct.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Ban, Briefcase, CheckCircle2, Inbox, KeyRound, LayoutTemplate, List, Loader2, Lock,
  Mail, MailOpen, Minus, Monitor, Paperclip, PenLine, Plus, RefreshCw, Reply, RotateCcw, Search,
  Send, Settings2, ShieldCheck, Smartphone, SquareArrowOutUpRight, Tags, Trash2, XCircle,
} from "lucide-react";
import { T, Tag, AdminPage, fieldStyle, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle, type Tone } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";
import { MAILING_TEMPLATES, MAILING_VIERGE, renderMailing, type MailingBlock, type MailingContent } from "@/lib/mailings";
import type { MessageComplet, MessageResume } from "@/lib/reception";

export type EnvoiEntry = {
  id: string;
  recipients: string;
  subject: string;
  outcome: string;
  reason: string;
  origin: string;
  mode: string;
  at: string;
};

export type BlockEntry = { id: string; value: string; reason: string; author: string; at: string };

type ContactChip = { id: string; name: string; type: "client" | "lead" | "contact" };
type MessageRecu = MessageResume & { contact: ContactChip | null };

type Vue = "reception" | "envoyes" | "modeles" | "reglages";

const VUE_LABEL: Record<Vue, string> = {
  reception: "Boîte de réception",
  envoyes: "Envoyés",
  modeles: "Modèles",
  reglages: "Réglages",
};

const OUTCOME: Record<string, { label: string; tone: Tone; icon: typeof Send }> = {
  envoye: { label: "Envoyé", tone: "success", icon: CheckCircle2 },
  retenu: { label: "Retenu", tone: "warning", icon: Ban },
  refuse: { label: "Refusé", tone: "danger", icon: XCircle },
};

const CONTACT_LABEL: Record<ContactChip["type"], string> = {
  client: "Client",
  lead: "Lead",
  contact: "Contact",
};

const MODELE_ICONS = [Briefcase, Tags, KeyRound] as const;

const label = "block text-[10px] tracking-[0.14em] uppercase mb-1.5";

function copie(c: MailingContent): MailingContent {
  return JSON.parse(JSON.stringify(c)) as MailingContent;
}

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

export default function MessagerieClient({
  mode,
  hasKey,
  configuree,
  envois,
  fixedEntries,
  envEntries,
  blocks,
  initialTo = "",
  initialSubject = "",
  initialVue = "reception",
}: {
  mode: string;
  hasKey: boolean;
  configuree: boolean;
  envois: EnvoiEntry[];
  fixedEntries: string[];
  envEntries: string[];
  blocks: BlockEntry[];
  initialTo?: string;
  initialSubject?: string;
  initialVue?: Vue;
}) {
  const toast = useToast();

  // ── Navigation ──
  const [vue, setVue] = useState<Vue>(initialVue);
  const [recherche, setRecherche] = useState("");

  // ── Boîte de réception ──
  const [messages, setMessages] = useState<MessageRecu[] | null>(null);
  const [erreur, setErreur] = useState("");
  const [chargeListe, setChargeListe] = useState(configuree);
  const [ouvertRecu, setOuvertRecu] = useState<MessageComplet | null>(null);
  const [uidEnCours, setUidEnCours] = useState<number | null>(null);

  // ── Envoyés ──
  const [filtreEnvoi, setFiltreEnvoi] = useState<"tous" | "envoye" | "retenu" | "refuse">("tous");
  const [ouvertEnvoi, setOuvertEnvoi] = useState<EnvoiEntry | null>(null);

  // ── Modèles ──
  const [modeleSel, setModeleSel] = useState<string>("vierge");

  // ── Composition ──
  const [compose, setCompose] = useState<{ modeleId: string | null; content: MailingContent } | null>(() => {
    if (!initialTo) return null;
    const base = copie(MAILING_VIERGE);
    if (initialSubject) base.subject = initialSubject;
    return { modeleId: null, content: base };
  });
  const [to, setTo] = useState(initialTo);
  const [viewport, setViewport] = useState<"bureau" | "telephone">("bureau");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // ── Liste rouge ──
  const [valueBlock, setValueBlock] = useState("");
  const [reasonBlock, setReasonBlock] = useState("");
  const [busyBlock, setBusyBlock] = useState(false);
  const [removing, setRemoving] = useState<BlockEntry | null>(null);
  // Copie locale : la page se rafraîchit sans navigation.
  const [blocksLocaux, setBlocksLocaux] = useState<BlockEntry[]>(blocks);

  const html = useMemo(() => (compose ? renderMailing(compose.content) : ""), [compose]);

  // ── Boîte : chargement ──
  const poseListe = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reception");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setMessages(j.messages as MessageRecu[]);
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

  async function ouvreRecu(m: MessageRecu) {
    setUidEnCours(m.uid);
    try {
      const res = await fetch(`/api/admin/reception/${m.uid}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setOuvertRecu(j.message as MessageComplet);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Ce message ne s'ouvre pas.");
    } finally {
      setUidEnCours(null);
    }
  }

  // ── Composition ──
  function nouveauMessage(modeleId: string | null, prefill?: { to?: string; subject?: string }) {
    const base = modeleId ? MAILING_TEMPLATES.find((t) => t.id === modeleId)?.content : MAILING_VIERGE;
    if (!base) return;
    const content = copie(base);
    if (prefill?.subject) content.subject = prefill.subject;
    setCompose({ modeleId, content });
    if (prefill?.to !== undefined) setTo(prefill.to);
  }

  function repondre(m: MessageComplet) {
    nouveauMessage(null, {
      to: m.fromAddress,
      subject: m.subject.toLowerCase().startsWith("re") ? m.subject : `Re : ${m.subject}`,
    });
  }

  function pose(patch: Partial<MailingContent>) {
    setCompose((c) => (c ? { ...c, content: { ...c.content, ...patch } } : c));
  }

  function poseBloc(i: number, patch: Record<string, unknown>) {
    setCompose((c) =>
      c
        ? { ...c, content: { ...c.content, blocks: c.content.blocks.map((b, j) => (j === i ? ({ ...b, ...patch } as typeof b) : b)) } }
        : c,
    );
  }

  function retireBloc(i: number) {
    setCompose((c) => (c ? { ...c, content: { ...c.content, blocks: c.content.blocks.filter((_, j) => j !== i) } } : c));
  }

  function ajouteBloc(type: MailingBlock["type"]) {
    const neuf: MailingBlock =
      type === "paragraphe"
        ? { type: "paragraphe", text: "" }
        : type === "puces"
          ? { type: "puces", items: [""] }
          : { type: "bouton", label: "Découvrir", url: "https://intelligenceautomobile.fr" };
    setCompose((c) => (c ? { ...c, content: { ...c.content, blocks: [...c.content.blocks, neuf] } } : c));
  }

  async function envoyer() {
    if (!compose) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/mailings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, ...compose.content }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`Message envoyé à ${to}. Il rejoint la vue Envoyés au prochain rechargement.`);
      setCompose(null);
      setTo("");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'envoi a échoué.");
    } finally {
      setBusy(false);
    }
  }

  // ── Liste rouge ──
  async function bloquer() {
    if (busyBlock || !valueBlock.trim()) return;
    setBusyBlock(true);
    try {
      const res = await fetch("/api/admin/emails/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: valueBlock, reason: reasonBlock }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`${j.value} est désormais bloqué : aucun message ne partira vers cette adresse.`);
      setBlocksLocaux((b) => [{ id: `local-${Date.now()}`, value: j.value, reason: reasonBlock, author: "", at: new Date().toISOString() }, ...b]);
      setValueBlock("");
      setReasonBlock("");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'ajout a échoué.");
    } finally {
      setBusyBlock(false);
    }
  }

  async function debloquer(entry: BlockEntry) {
    setBusyBlock(true);
    try {
      const res = await fetch("/api/admin/emails/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.info(`${entry.value} peut de nouveau recevoir des messages.`);
      setBlocksLocaux((b) => b.filter((x) => x.id !== entry.id));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Le retrait a échoué.");
    } finally {
      setBusyBlock(false);
    }
  }

  // ── Filtres ──
  const q = recherche.trim().toLowerCase();
  const recusFiltres = (messages ?? []).filter(
    (m) => !q || m.fromName.toLowerCase().includes(q) || m.fromAddress.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q),
  );
  const envoisFiltres = envois.filter(
    (l) =>
      (filtreEnvoi === "tous" || l.outcome === filtreEnvoi) &&
      (!q || l.recipients.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q)),
  );
  const nonLus = (messages ?? []).filter((m) => !m.seen).length;
  const totalBloque = fixedEntries.length + envEntries.length + blocksLocaux.length;

  const modeleCourant = modeleSel === "vierge" ? null : MAILING_TEMPLATES.find((t) => t.id === modeleSel) ?? null;
  const apercuModele = useMemo(
    () => renderMailing(modeleCourant ? modeleCourant.content : MAILING_VIERGE),
    [modeleCourant],
  );

  // ── Rendus ──

  const rail = (
    <div className="flex lg:flex-col gap-2 lg:gap-1 flex-wrap lg:w-[210px] flex-shrink-0">
      <button
        type="button"
        onClick={() => nouveauMessage(null, { to: "" })}
        className={`${btnPrimaryClass} lg:w-full lg:justify-center lg:mb-4`}
        style={btnPrimaryStyle}
      >
        <PenLine size={13} />
        Nouveau message
      </button>
      {(
        [
          ["reception", Inbox, configuree && nonLus > 0 ? String(nonLus) : ""],
          ["envoyes", Send, ""],
          ["modeles", LayoutTemplate, ""],
          ["reglages", Settings2, ""],
        ] as [Vue, typeof Inbox, string][]
      ).map(([v, Icon, badge]) => (
        <button
          key={v}
          type="button"
          onClick={() => {
            setVue(v);
            setCompose(null);
            setRecherche("");
          }}
          aria-pressed={vue === v && !compose}
          className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-left"
          style={
            vue === v && !compose
              ? { backgroundColor: T.surface, color: T.text, borderLeft: `2px solid ${T.accent}` }
              : { color: T.textDim, borderLeft: "2px solid transparent" }
          }
        >
          <Icon size={15} style={{ color: vue === v && !compose ? T.accent : T.muted }} />
          {VUE_LABEL[v]}
          {badge && (
            <span
              className="ml-auto text-[10px] px-1.5 py-0.5 font-semibold"
              style={{ backgroundColor: T.accent, color: T.bg }}
            >
              {badge}
            </span>
          )}
        </button>
      ))}
      <div className="hidden lg:block mt-6 pt-4 text-[11px] leading-relaxed" style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}>
        {mode === "live" ? (
          <span className="inline-flex items-start gap-1.5">
            <Send size={11} className="mt-0.5 flex-shrink-0" style={{ color: T.accent }} />
            Les emails partent réellement depuis ce serveur.
          </span>
        ) : (
          <span className="inline-flex items-start gap-1.5">
            <ShieldCheck size={11} className="mt-0.5 flex-shrink-0" style={{ color: T.success }} />
            Mode atelier : les messages sont retenus.
          </span>
        )}
        {!hasKey && (
          <span className="block mt-2">
            <Tag tone="warning">Aucun service d&apos;envoi configuré</Tag>
          </span>
        )}
      </div>
    </div>
  );

  const chipFiltre = (k: typeof filtreEnvoi, lbl: string, n: number) => (
    <button
      key={k}
      type="button"
      onClick={() => setFiltreEnvoi(k)}
      aria-pressed={filtreEnvoi === k}
      className="adm-chip text-[10px] tracking-widest uppercase px-2 py-1"
      style={
        filtreEnvoi === k
          ? { backgroundColor: T.accent, color: T.bg, border: `1px solid ${T.accent}` }
          : { border: `1px solid ${T.border}`, color: T.textDim }
      }
    >
      {lbl} · {n}
    </button>
  );

  const barreRecherche = (
    <div className="relative mb-3">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
      <input
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder={vue === "envoyes" ? "Rechercher un envoi…" : "Rechercher un message…"}
        className="w-full text-[13px] pl-9 pr-3 py-2"
        style={fieldStyle}
      />
    </div>
  );

  // ── Vue Boîte de réception ──
  const colonneReception = (
    <div className="min-w-0">
      {barreRecherche}
      <div className="flex items-center gap-2 mb-3">
        <button type="button" onClick={rafraichir} disabled={chargeListe || !configuree} className={btnGhostClass} style={btnGhostStyle}>
          {chargeListe ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Actualiser
        </button>
        <span className="text-[11px]" style={{ color: T.muted }}>
          Lecture seule : la boîte IONOS reste intacte.
        </span>
      </div>
      {erreur && (
        <div className="px-3 py-2.5 mb-3 text-[12px]" style={{ border: `1px solid ${T.danger}`, color: T.text }}>
          {erreur}
        </div>
      )}
      <div style={{ border: `1px solid ${T.border}` }}>
        {!configuree ? (
          <div className="p-5 text-[13px]" style={{ color: T.textDim }}>
            La boîte attend ses accès (IMAP_USER et IMAP_PASSWORD sur l&apos;hébergeur).
          </div>
        ) : messages === null ? (
          <div className="p-5 text-[13px] inline-flex items-center gap-2" style={{ color: T.textDim }}>
            <Loader2 size={13} className="animate-spin" /> Connexion à la boîte…
          </div>
        ) : recusFiltres.length === 0 ? (
          <div className="p-5 text-[13px] inline-flex items-center gap-2" style={{ color: T.textDim }}>
            <Inbox size={14} style={{ color: T.accent }} />
            {q ? "Rien ne correspond à cette recherche." : "La boîte est vide."}
          </div>
        ) : (
          recusFiltres.map((m, i) => {
            const actif = ouvertRecu?.uid === m.uid;
            return (
              <button
                key={m.uid}
                type="button"
                onClick={() => ouvreRecu(m)}
                className="w-full text-left px-3.5 py-3 block"
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
                  <span className="text-[13px] truncate min-w-0" style={{ color: T.text, fontWeight: m.seen ? 400 : 700 }}>
                    {m.fromName || m.fromAddress || "(expéditeur inconnu)"}
                  </span>
                  {m.contact && (
                    <span
                      className="text-[9px] tracking-[0.08em] uppercase px-1.5 py-0.5 flex-shrink-0 font-semibold"
                      style={{ border: `1px solid ${T.accent}`, color: T.accent }}
                    >
                      {CONTACT_LABEL[m.contact.type]}
                    </span>
                  )}
                  <span className="text-[11px] ml-auto whitespace-nowrap flex-shrink-0" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
                    {stamp(m.date)}
                  </span>
                </span>
                <span className="block text-[12px] truncate mt-0.5 pl-[21px]" style={{ color: m.seen ? T.muted : T.textDim, fontWeight: m.seen ? 400 : 600 }}>
                  {m.subject}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const lectureReception = ouvertRecu === null ? (
    <div className="p-10 text-sm flex flex-col items-center gap-3" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
      <Inbox size={22} style={{ color: T.accent }} />
      Choisissez un message dans la liste pour le lire ici.
    </div>
  ) : (
    <div style={{ border: `1px solid ${T.border}` }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.surface }}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>{ouvertRecu.subject}</h2>
            <p className="text-[12px] flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: T.textDim }}>
              <span>
                {ouvertRecu.fromName ? `${ouvertRecu.fromName} · ` : ""}
                {ouvertRecu.fromAddress}
              </span>
              {(() => {
                const chip = messages?.find((m) => m.uid === ouvertRecu.uid)?.contact;
                return chip ? (
                  <Link
                    href={`/admin/clients/${chip.id}`}
                    className="text-[9px] tracking-[0.08em] uppercase px-1.5 py-0.5 font-semibold"
                    style={{ border: `1px solid ${T.accent}`, color: T.accent }}
                    title={`Ouvrir la fiche de ${chip.name}`}
                  >
                    {CONTACT_LABEL[chip.type]} · {chip.name}
                  </Link>
                ) : null;
              })()}
              <span style={{ color: T.muted }}>{stamp(ouvertRecu.date)}</span>
            </p>
          </div>
          <button type="button" onClick={() => repondre(ouvertRecu)} className={btnPrimaryClass} style={btnPrimaryStyle}>
            <Reply size={13} />
            Répondre
          </button>
        </div>
        {ouvertRecu.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {ouvertRecu.attachments.map((a, i) => (
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
      <iframe
        title={`Message : ${ouvertRecu.subject}`}
        srcDoc={ouvertRecu.html}
        sandbox=""
        style={{ width: "100%", height: 540, border: 0, display: "block", backgroundColor: "#FFFFFF" }}
      />
    </div>
  );

  // ── Vue Envoyés ──
  const colonneEnvoyes = (
    <div className="min-w-0">
      {barreRecherche}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {chipFiltre("tous", "Tous", envois.length)}
        {chipFiltre("envoye", "Envoyés", envois.filter((l) => l.outcome === "envoye").length)}
        {chipFiltre("retenu", "Retenus", envois.filter((l) => l.outcome === "retenu").length)}
        {chipFiltre("refuse", "Refusés", envois.filter((l) => l.outcome === "refuse").length)}
      </div>
      <div style={{ border: `1px solid ${T.border}` }}>
        {envoisFiltres.length === 0 ? (
          <div className="p-5 text-[13px]" style={{ color: T.textDim }}>
            {envois.length === 0 ? "Chaque email du site s'inscrira ici." : "Rien ne correspond à ce filtre."}
          </div>
        ) : (
          envoisFiltres.map((l, i) => {
            const o = OUTCOME[l.outcome] ?? { label: l.outcome, tone: "muted" as Tone, icon: Send };
            const Icon = o.icon;
            const actif = ouvertEnvoi?.id === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setOuvertEnvoi(l)}
                className="w-full text-left px-3.5 py-3 block"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}`, backgroundColor: actif ? T.surface : "transparent" }}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon
                    size={13}
                    className="flex-shrink-0"
                    style={{ color: o.tone === "success" ? T.success : o.tone === "danger" ? T.danger : T.warning }}
                  />
                  <span className="text-[13px] truncate min-w-0" style={{ color: T.text }}>{l.recipients}</span>
                  <span className="text-[11px] ml-auto whitespace-nowrap flex-shrink-0" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
                    {stamp(l.at)}
                  </span>
                </span>
                <span className="block text-[12px] truncate mt-0.5 pl-[21px]" style={{ color: T.textDim }}>
                  {l.subject}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const lectureEnvoi = ouvertEnvoi === null ? (
    <div className="p-10 text-sm flex flex-col items-center gap-3" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
      <Send size={22} style={{ color: T.accent }} />
      Choisissez un envoi pour voir son détail : destinataire, état de remise, provenance.
    </div>
  ) : (
    <div style={{ border: `1px solid ${T.border}` }}>
      <div className="px-5 py-4" style={{ backgroundColor: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>{ouvertEnvoi.subject || "(sans objet)"}</h2>
        <p className="text-[12px]" style={{ color: T.textDim }}>À : {ouvertEnvoi.recipients}</p>
      </div>
      <div className="px-5 py-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
        <span style={{ color: T.muted }}>État</span>
        <span>
          <Tag tone={(OUTCOME[ouvertEnvoi.outcome] ?? { tone: "muted" as Tone }).tone}>
            {(OUTCOME[ouvertEnvoi.outcome] ?? { label: ouvertEnvoi.outcome }).label}
          </Tag>
        </span>
        <span style={{ color: T.muted }}>Date</span>
        <span style={{ color: T.text }}>{stamp(ouvertEnvoi.at)}</span>
        {ouvertEnvoi.origin && (
          <>
            <span style={{ color: T.muted }}>Circuit</span>
            <span style={{ color: T.text }}>{ouvertEnvoi.origin}</span>
          </>
        )}
        {ouvertEnvoi.reason && (
          <>
            <span style={{ color: T.muted }}>Motif</span>
            <span style={{ color: T.textDim }}>{ouvertEnvoi.reason}</span>
          </>
        )}
        <span style={{ color: T.muted }}>Mode</span>
        <span style={{ color: T.textDim }}>{ouvertEnvoi.mode === "live" ? "envoi réel" : "atelier"}</span>
      </div>
      <p className="px-5 pb-4 text-[11px]" style={{ color: T.muted }}>
        Le journal garde la trace de l&apos;envoi ; le contenu du message lui-même est conservé nulle part.
      </p>
    </div>
  );

  // ── Vue Modèles ──
  const colonneModeles = (
    <div className="min-w-0 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setModeleSel("vierge")}
        className="ia-carte w-full text-left flex items-center gap-3 px-4 py-4"
        style={{ border: `1px solid ${modeleSel === "vierge" ? T.accent : T.border}`, backgroundColor: T.surface }}
      >
        <span className="inline-flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ backgroundColor: T.accent, color: T.bg }}>
          <PenLine size={16} />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold" style={{ color: T.text }}>Message vierge</span>
          <span className="block text-[11px]" style={{ color: T.muted }}>Vous écrivez, l&apos;habillage et la signature suivent.</span>
        </span>
      </button>
      {MAILING_TEMPLATES.map((t, i) => {
        const Icon = MODELE_ICONS[i] ?? Tags;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setModeleSel(t.id)}
            className="ia-carte w-full text-left px-4 py-4"
            style={{ border: `1px solid ${modeleSel === t.id ? T.accent : T.border}`, backgroundColor: T.surface }}
          >
            <Icon size={15} style={{ color: T.accent }} className="mb-2" />
            <span className="block text-[13px] font-semibold mb-0.5" style={{ color: T.text }}>{t.label}</span>
            <span className="block text-[11px] leading-relaxed" style={{ color: T.muted }}>{t.audience}</span>
          </button>
        );
      })}
    </div>
  );

  const lectureModele = (
    <div style={{ border: `1px solid ${T.border}` }}>
      <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ backgroundColor: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>
            {modeleCourant ? modeleCourant.label : "Message vierge"}
          </h2>
          {modeleCourant && <p className="text-[12px]" style={{ color: T.muted }}>{modeleCourant.audience}</p>}
        </div>
        <button type="button" onClick={() => nouveauMessage(modeleCourant?.id ?? null, { to: "" })} className={btnPrimaryClass} style={btnPrimaryStyle}>
          <PenLine size={13} />
          Composer
        </button>
      </div>
      <iframe
        title="Aperçu du modèle"
        srcDoc={apercuModele}
        sandbox=""
        style={{ width: "100%", height: 560, border: 0, display: "block", backgroundColor: "#070F1E" }}
      />
    </div>
  );

  // ── Vue Réglages ──
  const vueReglages = (
    <div className="lg:col-span-2 min-w-0 max-w-[860px]">
      <div className="flex items-center gap-2 mb-2">
        <Ban size={15} style={{ color: T.danger }} />
        <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Liste rouge</h2>
        <span className="text-xs" style={{ color: T.muted }}>· {totalBloque}</span>
      </div>
      <p className="text-[12px] mb-4" style={{ color: T.muted }}>
        Aucun message ne part vers ces adresses ni ces domaines, y compris depuis le site en ligne. Une entrée de
        domaine couvre toutes ses adresses, et tout se débloque d&apos;un clic.
      </p>

      <div className="p-4 mb-5" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px]">
            <span className={label} style={{ color: T.muted }}>Adresse ou domaine</span>
            <input
              value={valueBlock}
              onChange={(e) => setValueBlock(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") bloquer(); }}
              placeholder="exemple.fr ou contact@exemple.fr"
              className="w-full text-sm px-3 py-2.5"
              style={fieldStyle}
            />
          </label>
          <label className="flex-1 min-w-[200px]">
            <span className={label} style={{ color: T.muted }}>Motif (optionnel)</span>
            <input
              value={reasonBlock}
              onChange={(e) => setReasonBlock(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") bloquer(); }}
              placeholder="Ex. : prospect à ne plus contacter"
              className="w-full text-sm px-3 py-2.5"
              style={fieldStyle}
            />
          </label>
          <button type="button" onClick={bloquer} disabled={busyBlock || !valueBlock.trim()} className={btnPrimaryClass} style={btnPrimaryStyle}>
            {busyBlock ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
            Bloquer
          </button>
        </div>
      </div>

      {totalBloque === 0 ? (
        <div className="p-5 text-sm inline-flex items-center gap-2" style={{ border: `1px solid ${T.border}`, color: T.textDim }}>
          <ShieldCheck size={15} style={{ color: T.success }} />
          Tous vos contacts peuvent recevoir vos messages.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.border}` }}>
          {fixedEntries.map((v, i) => (
            <div key={`fixe-${v}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
              <Lock size={13} style={{ color: T.muted }} />
              <span className="text-sm" style={{ color: T.text }}>{v}</span>
              <Tag tone="danger">Permanent</Tag>
            </div>
          ))}
          {envEntries.map((v) => (
            <div key={`env-${v}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5" style={{ borderTop: `1px solid ${T.border}` }}>
              <Lock size={13} style={{ color: T.muted }} />
              <span className="text-sm" style={{ color: T.text }}>{v}</span>
              <Tag tone="muted">Réglage serveur</Tag>
            </div>
          ))}
          {blocksLocaux.map((b, i) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-3 px-4 py-2.5"
              style={{ borderTop: fixedEntries.length + envEntries.length + i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <Ban size={13} style={{ color: T.danger }} />
              <span className="text-sm" style={{ color: T.text }}>{b.value}</span>
              {b.reason && <span className="text-[11px] truncate min-w-0" style={{ color: T.muted }}>{b.reason}</span>}
              <span className="text-[11px] ml-auto whitespace-nowrap" style={{ color: T.muted }}>
                {stamp(b.at)}
                {b.author ? ` · ${b.author}` : ""}
              </span>
              <button
                type="button"
                onClick={() => setRemoving(b)}
                disabled={busyBlock}
                title={`Débloquer ${b.value}`}
                aria-label={`Débloquer ${b.value}`}
                className="adm-act-danger inline-flex items-center justify-center w-8 h-8 disabled:opacity-40"
                style={{ color: T.muted }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 text-[12px] leading-relaxed" style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}>
        <p className="mb-1">
          {mode === "live"
            ? "Les emails partent réellement depuis ce serveur : chaque envoi atteint son destinataire."
            : "Mode atelier : tout message qui pourrait atteindre une vraie personne est retenu."}
        </p>
        <p>La boîte de réception est {configuree ? "reliée à IONOS (lecture seule)." : "en attente de ses accès IMAP."}</p>
      </div>
    </div>
  );

  // ── Composition ──
  const composition = compose && (
    <div className="ia-anim lg:col-span-2 min-w-0">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button type="button" onClick={() => setCompose(null)} className={btnGhostClass} style={btnGhostStyle}>
          <ArrowLeft size={13} />
          Messagerie
        </button>
        <h2 className="text-[16px] font-bold" style={{ color: T.text }}>
          {compose.modeleId ? MAILING_TEMPLATES.find((t) => t.id === compose.modeleId)?.label : "Nouveau message"}
        </h2>
        <button
          type="button"
          onClick={() => {
            const base = compose.modeleId ? MAILING_TEMPLATES.find((t) => t.id === compose.modeleId)?.content : MAILING_VIERGE;
            if (base) setCompose({ modeleId: compose.modeleId, content: copie(base) });
          }}
          title="Vos modifications sont remplacées par le texte de départ."
          className={`${btnGhostClass} ml-auto`}
          style={btnGhostStyle}
        >
          <RotateCcw size={13} />
          {compose.modeleId ? "Repartir du modèle" : "Tout effacer"}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <div>
            <span className={label} style={{ color: T.muted }}>À</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="prenom.nom@exemple.fr" type="email" className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
          </div>
          <div>
            <span className={label} style={{ color: T.muted }}>Objet</span>
            <input value={compose.content.subject} onChange={(e) => pose({ subject: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
          </div>
          <div>
            <span className={label} style={{ color: T.muted }}>Ligne d&apos;aperçu (boîte de réception · optionnelle)</span>
            <input value={compose.content.preheader} onChange={(e) => pose({ preheader: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className={label} style={{ color: T.muted }}>Petite ligne au-dessus du titre (optionnelle)</span>
              <input value={compose.content.kicker} onChange={(e) => pose({ kicker: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
            </div>
            <div>
              <span className={label} style={{ color: T.muted }}>Titre du message (optionnel)</span>
              <input value={compose.content.titre} onChange={(e) => pose({ titre: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
            </div>
          </div>

          {compose.content.blocks.map((b, i) => {
            const retirer = (
              <button
                type="button"
                onClick={() => retireBloc(i)}
                title="Retirer cet élément du message"
                aria-label="Retirer cet élément du message"
                className="adm-act-danger inline-flex items-center justify-center w-6 h-6 flex-shrink-0"
                style={{ color: T.muted }}
              >
                <Minus size={13} />
              </button>
            );
            if (b.type === "paragraphe") {
              return (
                <div key={i}>
                  <span className={`${label} flex items-center justify-between`} style={{ color: T.muted }}>
                    Paragraphe {compose.content.blocks.slice(0, i + 1).filter((x) => x.type === "paragraphe").length}
                    {retirer}
                  </span>
                  <textarea
                    value={b.text}
                    onChange={(e) => poseBloc(i, { text: e.target.value })}
                    rows={Math.max(2, Math.ceil(b.text.length / 90))}
                    className="w-full text-sm px-3 py-2.5 resize-y"
                    style={fieldStyle}
                  />
                </div>
              );
            }
            if (b.type === "puces") {
              return (
                <div key={i}>
                  <span className={`${label} flex items-center justify-between`} style={{ color: T.muted }}>
                    Liste à puces (une ligne par puce · **gras** pour un intitulé en blanc)
                    {retirer}
                  </span>
                  <textarea
                    value={b.items.join("\n")}
                    onChange={(e) => poseBloc(i, { items: e.target.value.split("\n") })}
                    rows={Math.max(3, b.items.length + 1)}
                    className="w-full text-sm px-3 py-2.5 resize-y"
                    style={fieldStyle}
                  />
                </div>
              );
            }
            return (
              <div key={i}>
                <span className={`${label} flex items-center justify-between`} style={{ color: T.muted }}>
                  Bouton
                  {retirer}
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={b.label} onChange={(e) => poseBloc(i, { label: e.target.value })} placeholder="Texte du bouton" className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
                  <input value={b.url} onChange={(e) => poseBloc(i, { url: e.target.value })} placeholder="https://…" className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Ajouter</span>
            <button type="button" onClick={() => ajouteBloc("paragraphe")} className={btnGhostClass} style={btnGhostStyle}>
              <Plus size={12} /> Paragraphe
            </button>
            <button type="button" onClick={() => ajouteBloc("puces")} className={btnGhostClass} style={btnGhostStyle}>
              <List size={12} /> Liste à puces
            </button>
            <button type="button" onClick={() => ajouteBloc("bouton")} className={btnGhostClass} style={btnGhostStyle}>
              <SquareArrowOutUpRight size={12} /> Bouton
            </button>
          </div>

          <div>
            <span className={label} style={{ color: T.muted }}>Ligne grise sous la signature (optionnelle)</span>
            <textarea value={compose.content.signatureNote} onChange={(e) => pose({ signatureNote: e.target.value })} rows={2} className="w-full text-sm px-3 py-2.5 resize-y" style={fieldStyle} />
          </div>
          <div>
            <span className={label} style={{ color: T.muted }}>Pied de page : « Vous recevez ce message… »</span>
            <textarea value={compose.content.motif} onChange={(e) => pose({ motif: e.target.value })} rows={2} className="w-full text-sm px-3 py-2.5 resize-y" style={fieldStyle} />
          </div>

          <div className="p-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm min-w-0 flex-1" style={{ color: T.textDim }}>
                {mode === "live" ? (
                  <span className="inline-flex items-center gap-2"><Send size={14} style={{ color: T.accent }} /> Ce serveur envoie de vrais emails.</span>
                ) : (
                  <span className="inline-flex items-center gap-2"><ShieldCheck size={14} style={{ color: T.success }} /> Mode atelier : le message sera retenu.</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={
                  busy ||
                  to.trim().length <= 3 ||
                  compose.content.subject.trim().length === 0 ||
                  !compose.content.blocks.some(
                    (b) => (b.type === "paragraphe" && b.text.trim()) || (b.type === "puces" && b.items.some((x) => x.trim())),
                  )
                }
                className={btnPrimaryClass}
                style={btnPrimaryStyle}
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Envoyer
              </button>
            </div>
            <p className="text-[11px] mt-3" style={{ color: T.muted }}>
              L&apos;envoi demande une adresse, un objet et du texte. La liste rouge s&apos;applique, et chaque envoi rejoint la vue Envoyés.
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>Aperçu</h3>
            <span className="text-xs hidden sm:inline" style={{ color: T.muted }}>· le message exact que reçoit le destinataire</span>
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setViewport("bureau")}
                aria-pressed={viewport === "bureau"}
                title="Rendu sur ordinateur"
                className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-1.5"
                style={viewport === "bureau" ? { backgroundColor: T.accent, color: T.bg, border: `1px solid ${T.accent}` } : { border: `1px solid ${T.border}`, color: T.textDim }}
              >
                <Monitor size={12} /> Bureau
              </button>
              <button
                type="button"
                onClick={() => setViewport("telephone")}
                aria-pressed={viewport === "telephone"}
                title="Rendu sur téléphone"
                className="adm-chip inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase px-3 py-1.5"
                style={viewport === "telephone" ? { backgroundColor: T.accent, color: T.bg, border: `1px solid ${T.accent}` } : { border: `1px solid ${T.border}`, color: T.textDim }}
              >
                <Smartphone size={12} /> Téléphone
              </button>
            </div>
          </div>

          <div className="px-4 py-3 mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-baseline" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>À</span>
            <span className="text-[13px] truncate" style={{ color: T.text }}>{to.trim() || "…"}</span>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Objet</span>
            <span className="text-[13px] truncate" style={{ color: T.text }}>{compose.content.subject || "…"}</span>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Aperçu</span>
            <span className="text-[12px] truncate" style={{ color: T.muted }}>{compose.content.preheader || "…"}</span>
          </div>

          <div className="flex justify-center" style={{ border: `1px solid ${T.border}`, backgroundColor: "#04070F" }}>
            <iframe
              title="Aperçu du message"
              srcDoc={html}
              sandbox=""
              style={{
                width: viewport === "bureau" ? "100%" : 375,
                maxWidth: "100%",
                height: 620,
                border: 0,
                display: "block",
                backgroundColor: "#070F1E",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminPage>
      <style>{`
        @keyframes iaFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .ia-anim { animation: iaFadeUp 0.28s ease-out; }
        .ia-carte { transition: border-color 0.15s ease, transform 0.15s ease; }
        .ia-carte:hover, .ia-carte:focus-visible { border-color: ${T.accent} !important; transform: translateY(-2px); outline: none; }
        @media (prefers-reduced-motion: reduce) { .ia-anim { animation: none; } .ia-carte, .ia-carte:hover { transform: none; transition: none; } }
      `}</style>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.text }}>Messagerie</h1>
        <span className="text-[12px]" style={{ color: T.muted }}>
          contact@intelligenceautomobile.com
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {rail}
        <div className="flex-1 min-w-0 w-full">
          {compose ? (
            composition
          ) : vue === "reglages" ? (
            vueReglages
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr] items-start">
              {vue === "reception" && (
                <>
                  {colonneReception}
                  <div className="lg:sticky lg:top-6 min-w-0">{lectureReception}</div>
                </>
              )}
              {vue === "envoyes" && (
                <>
                  {colonneEnvoyes}
                  <div className="lg:sticky lg:top-6 min-w-0">{lectureEnvoi}</div>
                </>
              )}
              {vue === "modeles" && (
                <>
                  {colonneModeles}
                  <div className="lg:sticky lg:top-6 min-w-0">{lectureModele}</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Envoyer ce message à ${to.trim()} ?`}
        description={
          mode === "live"
            ? `Ce message va réellement partir vers ${to.trim()}, avec l'objet « ${compose?.content.subject ?? ""} ».`
            : "Mode atelier : le message sera retenu, sauf adresse de la liste d'essai."
        }
        confirmLabel="Envoyer"
        busy={busy}
        onConfirm={() => {
          setConfirming(false);
          envoyer();
        }}
        onCancel={() => setConfirming(false)}
      />

      <ConfirmDialog
        open={removing !== null}
        title={removing ? `Débloquer ${removing.value} ?` : ""}
        description="Les messages du site pourront de nouveau partir vers ce destinataire."
        confirmLabel="Débloquer"
        busy={busyBlock}
        onConfirm={() => {
          if (removing) debloquer(removing);
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </AdminPage>
  );
}
