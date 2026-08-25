"use client";

// Messagerie : la boîte de réception, les envois, les modèles et les réglages
// en une seule page, agencée comme un client mail. Colonne de gauche : les
// vues. Milieu : la liste. Droite : la lecture, ou la composition avec son
// aperçu en direct.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import {
  ArrowLeft, Ban, Briefcase, CheckCircle2, ChevronDown, ChevronUp, Forward, Inbox, KeyRound,
  LayoutTemplate, List, Loader2, Lock, Minus, Monitor, Paperclip, PenLine, Plus, RefreshCw, Reply,
  RotateCcw, Search, Send, Settings2, ShieldCheck, SlidersHorizontal, Smartphone,
  SquareArrowOutUpRight, Tags, Trash2, UserPlus, X, XCircle,
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

// Jour civil de Paris d'un horodatage, pour comparer « aujourd'hui » et « hier ».
function jourParis(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

// Date courte de la liste, comme les messageries : l'heure aujourd'hui, le
// jour et le mois cette année, la date complète au-delà.
function dateListe(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  if (jourParis(d) === jourParis(now)) {
    return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(d);
  }
  if (d.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short" }).format(d);
  }
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

// Intitulé du groupe de jours dans la liste : Aujourd'hui, Hier, puis la date.
function libelleJour(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Plus ancien";
  const jour = jourParis(d);
  const now = new Date();
  if (jour === jourParis(now)) return "Aujourd'hui";
  if (jour === jourParis(new Date(now.getTime() - 86_400_000))) return "Hier";
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" }
      : { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat("fr-FR", opts).format(d);
}

// Initiales et couleur stable d'un expéditeur, pour l'avatar de la liste.
function initiales(nom: string, adresse: string): string {
  const base = (nom || adresse).trim();
  const mots = base.split(/[\s.@_-]+/).filter(Boolean);
  if (mots.length >= 2) return (mots[0][0] + mots[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase() || "?";
}

function couleurAvatar(adresse: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < adresse.length; i++) h = (h * 31 + adresse.charCodeAt(i)) % 360;
  return { bg: `hsl(${h}, 42%, 26%)`, fg: `hsl(${h}, 70%, 82%)` };
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
  // Champs avancés de la composition (aperçu, titre, mentions) : repliés pour
  // un message simple, dépliés quand un modèle les a remplis.
  const [avance, setAvance] = useState(false);
  // Copies visibles et cachées.
  const [cc, setCc] = useState("");
  const [cci, setCci] = useState("");
  const [montreCopies, setMontreCopies] = useState(false);
  // Pièces jointes de la composition : déposées sur le stockage du site dès
  // leur choix, envoyées par leur adresse.
  const [pieces, setPieces] = useState<{ nom: string; taille: number; url: string; enCours: boolean }[]>([]);
  const fichierRef = useRef<HTMLInputElement | null>(null);
  // Message entamé : quitter la composition demande confirmation.
  const [dirty, setDirty] = useState(false);
  const [gardeOuverte, setGardeOuverte] = useState(false);
  const actionGardee = useRef<(() => void) | null>(null);
  const [leadBusy, setLeadBusy] = useState(false);
  const rechercheRef = useRef<HTMLInputElement | null>(null);
  // Uids déjà vus, pour annoncer les seuls messages réellement nouveaux.
  const uidsConnus = useRef<Set<number>>(new Set());

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
      const recus = j.messages as MessageRecu[];
      setMessages(recus);
      setErreur("");
      uidsConnus.current = new Set(recus.map((m) => m.uid));
    } catch (e) {
      setErreur(e instanceof Error && e.message ? e.message : "La boîte ne répond pas.");
      setMessages([]);
    } finally {
      setChargeListe(false);
    }
  }, []);

  // Rafraîchissement discret : la boîte se relit toute seule quand l'onglet
  // est visible, et annonce les seuls messages nouveaux.
  const veille = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reception");
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const recus = j.messages as MessageRecu[];
      const nouveaux = recus.filter((m) => !uidsConnus.current.has(m.uid) && !m.seen).length;
      uidsConnus.current = new Set(recus.map((m) => m.uid));
      setMessages(recus);
      setErreur("");
      if (nouveaux > 0) {
        toast.info(nouveaux === 1 ? "1 nouveau message dans la boîte." : `${nouveaux} nouveaux messages dans la boîte.`);
      }
    } catch {
      /* la prochaine passe retentera : la veille reste silencieuse */
    }
  }, [toast]);

  useEffect(() => {
    if (!configuree) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") veille();
    }, 75_000);
    return () => clearInterval(id);
  }, [configuree, veille]);

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

  // ── Garde-fou du brouillon ──
  // Un message entamé se quitte après confirmation : l'action voulue attend
  // que l'utilisateur tranche.
  function protege(fn: () => void) {
    if (compose && dirty) {
      actionGardee.current = fn;
      setGardeOuverte(true);
    } else {
      fn();
    }
  }

  useEffect(() => {
    if (!compose || !dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [compose, dirty]);

  function fermeComposition() {
    setCompose(null);
    setDirty(false);
    setCc("");
    setCci("");
    setMontreCopies(false);
    setPieces([]);
  }

  // ── Composition ──
  function ouvreComposition(modeleId: string | null, content: MailingContent, toInitial?: string) {
    setCompose({ modeleId, content });
    setAvance(modeleId !== null);
    setDirty(false);
    setCc("");
    setCci("");
    setMontreCopies(false);
    setPieces([]);
    if (toInitial !== undefined) setTo(toInitial);
  }

  function nouveauMessage(modeleId: string | null, prefill?: { to?: string; subject?: string }) {
    const base = modeleId ? MAILING_TEMPLATES.find((t) => t.id === modeleId)?.content : MAILING_VIERGE;
    if (!base) return;
    const content = copie(base);
    if (prefill?.subject) content.subject = prefill.subject;
    ouvreComposition(modeleId, content, prefill?.to);
  }

  // En-tête de citation d'un message : « Le …, X a écrit : ».
  function enTeteCitation(m: MessageComplet): string {
    const quand = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(m.date));
    const qui = m.fromName ? `${m.fromName} <${m.fromAddress}>` : m.fromAddress;
    return `Le ${quand}, ${qui} a écrit :`;
  }

  function repondre(m: MessageComplet) {
    const content = copie(MAILING_VIERGE);
    content.subject = m.subject.toLowerCase().startsWith("re") ? m.subject : `Re : ${m.subject}`;
    // Le message d'origine part cité sous la réponse, comme le veut l'usage :
    // le destinataire garde le fil de la conversation.
    if (m.text) {
      content.blocks = [...content.blocks, { type: "citation", text: `${enTeteCitation(m)}\n\n${m.text.slice(0, 8000)}` }];
    }
    ouvreComposition(null, content, m.fromAddress);
  }

  function transferer(m: MessageComplet) {
    const content = copie(MAILING_VIERGE);
    content.subject = m.subject.toLowerCase().startsWith("tr") ? m.subject : `Tr : ${m.subject}`;
    content.blocks = [
      { type: "paragraphe", text: "Bonjour," },
      { type: "paragraphe", text: "" },
      { type: "citation", text: `${enTeteCitation(m)}\n\n${(m.text || "(message sans version texte)").slice(0, 8000)}` },
    ];
    ouvreComposition(null, content, "");
  }

  function pose(patch: Partial<MailingContent>) {
    setDirty(true);
    setCompose((c) => (c ? { ...c, content: { ...c.content, ...patch } } : c));
  }

  function poseBloc(i: number, patch: Record<string, unknown>) {
    setDirty(true);
    setCompose((c) =>
      c
        ? { ...c, content: { ...c.content, blocks: c.content.blocks.map((b, j) => (j === i ? ({ ...b, ...patch } as typeof b) : b)) } }
        : c,
    );
  }

  function retireBloc(i: number) {
    setDirty(true);
    setCompose((c) => (c ? { ...c, content: { ...c.content, blocks: c.content.blocks.filter((_, j) => j !== i) } } : c));
  }

  function ajouteBloc(type: MailingBlock["type"]) {
    const neuf: MailingBlock =
      type === "paragraphe"
        ? { type: "paragraphe", text: "" }
        : type === "puces"
          ? { type: "puces", items: [""] }
          : { type: "bouton", label: "Découvrir", url: "https://intelligenceautomobile.fr" };
    setDirty(true);
    setCompose((c) => (c ? { ...c, content: { ...c.content, blocks: [...c.content.blocks, neuf] } } : c));
  }

  // ── Pièces jointes de la composition ──
  async function joindre(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (pieces.length >= 8) {
        toast.error("8 pièces jointes au plus par message.");
        break;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} dépasse 20 Mo : ce fichier reste sur place.`);
        continue;
      }
      const nom = f.name;
      setPieces((p) => [...p, { nom, taille: f.size, url: "", enCours: true }]);
      setDirty(true);
      try {
        const blob = await upload(`messagerie/${nom}`, f, { access: "public", handleUploadUrl: "/api/upload" });
        setPieces((p) => p.map((x) => (x.nom === nom && x.enCours ? { ...x, url: blob.url, enCours: false } : x)));
      } catch {
        setPieces((p) => p.filter((x) => !(x.nom === nom && x.enCours)));
        toast.error(`L'envoi de ${nom} a échoué.`);
      }
    }
    if (fichierRef.current) fichierRef.current.value = "";
  }

  function retirePiece(i: number) {
    setPieces((p) => p.filter((_, j) => j !== i));
  }

  async function envoyer() {
    if (!compose) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/mailings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          cc,
          cci,
          pieces: pieces.filter((p) => p.url).map((p) => ({ filename: p.nom, url: p.url })),
          ...compose.content,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`Message envoyé à ${to}. Il rejoint la vue Envoyés au prochain rechargement.`);
      fermeComposition();
      setTo("");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'envoi a échoué.");
    } finally {
      setBusy(false);
    }
  }

  // ── Créer un lead depuis un message reçu ──
  async function creerLead(m: MessageComplet) {
    if (leadBusy) return;
    setLeadBusy(true);
    try {
      const res = await fetch("/api/admin/messagerie/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: m.fromName, email: m.fromAddress, subject: m.subject, message: m.text.slice(0, 2000) }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      const chip: ContactChip = { id: j.clientId as string, name: m.fromName || m.fromAddress, type: "lead" };
      // La pastille apparaît aussitôt, sur tous les messages du même expéditeur.
      setMessages((prev) =>
        prev ? prev.map((x) => (x.fromAddress.toLowerCase() === m.fromAddress.toLowerCase() ? { ...x, contact: chip } : x)) : prev,
      );
      toast.success(`${chip.name} est entré au CRM : fiche client et lead créés.`);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La création du lead a échoué.");
    } finally {
      setLeadBusy(false);
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

  // ── Navigation clavier et boutons précédent / suivant ──
  const indexOuvert = ouvertRecu ? recusFiltres.findIndex((m) => m.uid === ouvertRecu.uid) : -1;

  function ouvreVoisin(delta: number) {
    if (recusFiltres.length === 0 || uidEnCours !== null) return;
    const i =
      indexOuvert === -1
        ? delta > 0
          ? 0
          : recusFiltres.length - 1
        : Math.min(recusFiltres.length - 1, Math.max(0, indexOuvert + delta));
    const cible = recusFiltres[i];
    if (cible && cible.uid !== ouvertRecu?.uid) ouvreRecu(cible);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (compose || vue !== "reception") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        ouvreVoisin(1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        ouvreVoisin(-1);
      } else if ((e.key === "r" || e.key === "R") && ouvertRecu) {
        e.preventDefault();
        repondre(ouvertRecu);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        nouveauMessage(null, { to: "" });
      } else if (e.key === "/") {
        e.preventDefault();
        rechercheRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
        onClick={() => protege(() => nouveauMessage(null, { to: "" }))}
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
          onClick={() =>
            protege(() => {
              setVue(v);
              fermeComposition();
              setRecherche("");
            })
          }
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
        ref={rechercheRef}
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
            const groupe = libelleJour(m.date);
            const entete = i === 0 || libelleJour(recusFiltres[i - 1].date) !== groupe;
            const av = couleurAvatar(m.fromAddress || m.fromName || "?");
            return (
              <div key={m.uid}>
                {entete && (
                  <div
                    className="px-3.5 pt-2.5 pb-1.5 text-[10px] tracking-[0.16em] uppercase"
                    style={{ color: T.muted, borderTop: i === 0 ? "none" : `1px solid ${T.border}`, backgroundColor: "rgba(255,255,255,0.015)" }}
                  >
                    {groupe}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => ouvreRecu(m)}
                  className="w-full text-left px-3.5 py-2.5 block"
                  style={{
                    borderTop: entete ? `1px solid ${T.border}` : `1px solid ${T.border}22`,
                    backgroundColor: actif ? T.surface : "transparent",
                  }}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="relative inline-flex items-center justify-center w-[30px] h-[30px] rounded-full flex-shrink-0 text-[11px] font-bold"
                      style={{ backgroundColor: av.bg, color: av.fg }}
                    >
                      {uidEnCours === m.uid ? (
                        <Loader2 size={13} className="animate-spin" style={{ color: T.accent }} />
                      ) : (
                        initiales(m.fromName, m.fromAddress)
                      )}
                      {!m.seen && (
                        <span
                          className="absolute -top-0.5 -right-0.5 w-[9px] h-[9px] rounded-full"
                          style={{ backgroundColor: T.accent, border: `2px solid ${T.bg}` }}
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 min-w-0">
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
                        <span className="text-[11px] ml-auto whitespace-nowrap flex-shrink-0" style={{ color: m.seen ? T.muted : T.accent, fontVariantNumeric: "tabular-nums", fontWeight: m.seen ? 400 : 600 }}>
                          {dateListe(m.date)}
                        </span>
                      </span>
                      <span className="block text-[12px] truncate mt-0.5">
                        <span style={{ color: m.seen ? T.textDim : T.text, fontWeight: m.seen ? 400 : 600 }}>{m.subject}</span>
                        {m.extrait && <span style={{ color: T.muted }}> — {m.extrait}</span>}
                      </span>
                    </span>
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>
      <p className="hidden lg:block text-[10px] mt-2" style={{ color: T.muted }}>
        Clavier : ↑ ↓ parcourir · R répondre · C nouveau message · / rechercher
      </p>
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
          <div className="min-w-[240px] flex-1">
            <h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>{ouvertRecu.subject}</h2>
            <p className="text-[12px] flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: T.textDim }}>
              <span>
                {ouvertRecu.fromName ? `${ouvertRecu.fromName} · ` : ""}
                {ouvertRecu.fromAddress}
              </span>
              {(() => {
                const chip = messages?.find((m) => m.uid === ouvertRecu.uid)?.contact;
                if (chip) {
                  return (
                    <Link
                      href={`/admin/clients/${chip.id}`}
                      className="text-[9px] tracking-[0.08em] uppercase px-1.5 py-0.5 font-semibold"
                      style={{ border: `1px solid ${T.accent}`, color: T.accent }}
                      title={`Ouvrir la fiche de ${chip.name}`}
                    >
                      {CONTACT_LABEL[chip.type]} · {chip.name}
                    </Link>
                  );
                }
                // Expéditeur inconnu du CRM : il y entre en un clic, fiche et
                // lead préremplis avec ce message.
                return (
                  <button
                    type="button"
                    onClick={() => creerLead(ouvertRecu)}
                    disabled={leadBusy}
                    className="inline-flex items-center gap-1 text-[9px] tracking-[0.08em] uppercase px-1.5 py-0.5 font-semibold whitespace-nowrap disabled:opacity-50"
                    style={{ border: `1px dashed ${T.muted}`, color: T.textDim }}
                    title="Créer la fiche client et le lead à partir de ce message"
                  >
                    {leadBusy ? <Loader2 size={10} className="animate-spin" /> : <UserPlus size={10} />}
                    Créer le lead
                  </button>
                );
              })()}
              <span style={{ color: T.muted }}>{stamp(ouvertRecu.date)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] whitespace-nowrap" style={{ color: T.muted, fontVariantNumeric: "tabular-nums" }}>
              {indexOuvert === -1 ? "" : `${indexOuvert + 1} / ${recusFiltres.length}`}
            </span>
            <button
              type="button"
              onClick={() => ouvreVoisin(-1)}
              disabled={indexOuvert <= 0 || uidEnCours !== null}
              title="Message précédent (↑)"
              aria-label="Message précédent"
              className="inline-flex items-center justify-center w-8 h-8 disabled:opacity-30"
              style={{ border: `1px solid ${T.border}`, color: T.textDim }}
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => ouvreVoisin(1)}
              disabled={indexOuvert === -1 || indexOuvert >= recusFiltres.length - 1 || uidEnCours !== null}
              title="Message suivant (↓)"
              aria-label="Message suivant"
              className="inline-flex items-center justify-center w-8 h-8 disabled:opacity-30"
              style={{ border: `1px solid ${T.border}`, color: T.textDim }}
            >
              <ChevronDown size={14} />
            </button>
            <button type="button" onClick={() => protege(() => transferer(ouvertRecu))} className={btnGhostClass} style={btnGhostStyle}>
              <Forward size={13} />
              Transférer
            </button>
            <button type="button" onClick={() => protege(() => repondre(ouvertRecu))} className={btnPrimaryClass} style={btnPrimaryStyle}>
              <Reply size={13} />
              Répondre
            </button>
          </div>
        </div>
        {ouvertRecu.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {ouvertRecu.attachments.map((a, i) => (
              <a
                key={i}
                href={`/api/admin/reception/${ouvertRecu.uid}/piece/${i}`}
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5"
                style={{ border: `1px solid ${T.border}`, color: T.textDim, backgroundColor: T.bg }}
                title={`Télécharger ${a.filename}`}
              >
                <Paperclip size={11} style={{ color: T.accent }} />
                {a.filename} · {tailleLisible(a.size)}
              </a>
            ))}
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
        <button type="button" onClick={() => protege(fermeComposition)} className={btnGhostClass} style={btnGhostStyle}>
          <ArrowLeft size={13} />
          Messagerie
        </button>
        <h2 className="text-[16px] font-bold" style={{ color: T.text }}>
          {compose.modeleId ? MAILING_TEMPLATES.find((t) => t.id === compose.modeleId)?.label : "Nouveau message"}
        </h2>
        <button
          type="button"
          onClick={() =>
            protege(() => {
              const base = compose.modeleId ? MAILING_TEMPLATES.find((t) => t.id === compose.modeleId)?.content : MAILING_VIERGE;
              if (base) {
                setCompose({ modeleId: compose.modeleId, content: copie(base) });
                setDirty(false);
              }
            })
          }
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
            <span className={`${label} flex items-center justify-between`} style={{ color: T.muted }}>
              À
              <button
                type="button"
                onClick={() => setMontreCopies((v) => !v)}
                aria-expanded={montreCopies}
                className="text-[10px] tracking-[0.14em] uppercase"
                style={{ color: montreCopies ? T.accent : T.muted }}
              >
                Cc / Cci
              </button>
            </span>
            <input
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setDirty(true);
              }}
              placeholder="prenom.nom@exemple.fr"
              type="email"
              className="w-full text-sm px-3 py-2.5"
              style={fieldStyle}
            />
          </div>
          {montreCopies && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className={label} style={{ color: T.muted }}>Cc (copie visible · virgules entre les adresses)</span>
                <input value={cc} onChange={(e) => { setCc(e.target.value); setDirty(true); }} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
              </div>
              <div>
                <span className={label} style={{ color: T.muted }}>Cci (copie cachée)</span>
                <input value={cci} onChange={(e) => { setCci(e.target.value); setDirty(true); }} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
              </div>
            </div>
          )}
          <div>
            <span className={label} style={{ color: T.muted }}>Objet</span>
            <input value={compose.content.subject} onChange={(e) => pose({ subject: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
          </div>

          {/* Un message simple s'écrit avec À, Objet, texte : le reste attend
              derrière « Options avancées ». */}
          <button
            type="button"
            onClick={() => setAvance((a) => !a)}
            aria-expanded={avance}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase self-start"
            style={{ color: T.muted }}
          >
            <SlidersHorizontal size={12} />
            Options avancées : aperçu, titre, mentions
            {avance ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {avance && (
            <>
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
            </>
          )}

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
            if (b.type === "citation") {
              return (
                <div key={i}>
                  <span className={`${label} flex items-center justify-between`} style={{ color: T.muted }}>
                    Message d&apos;origine (cité en gris dans la réponse)
                    {retirer}
                  </span>
                  <textarea
                    value={b.text}
                    onChange={(e) => poseBloc(i, { text: e.target.value })}
                    rows={Math.min(9, Math.max(3, b.text.split("\n").length))}
                    className="w-full text-[12px] px-3 py-2.5 resize-y"
                    style={{ ...fieldStyle, color: T.muted, borderLeft: `3px solid ${T.border}` }}
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
            <button type="button" onClick={() => fichierRef.current?.click()} className={btnGhostClass} style={btnGhostStyle}>
              <Paperclip size={12} /> Pièce jointe
            </button>
            <input ref={fichierRef} type="file" multiple className="hidden" onChange={(e) => joindre(e.target.files)} />
          </div>

          {pieces.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pieces.map((p, i) => (
                <span
                  key={`${p.nom}-${i}`}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5"
                  style={{ border: `1px solid ${T.border}`, color: T.textDim, backgroundColor: T.surface }}
                >
                  {p.enCours ? <Loader2 size={11} className="animate-spin" style={{ color: T.accent }} /> : <Paperclip size={11} style={{ color: T.accent }} />}
                  {p.nom} · {tailleLisible(p.taille)}
                  <button
                    type="button"
                    onClick={() => retirePiece(i)}
                    title={`Retirer ${p.nom}`}
                    aria-label={`Retirer ${p.nom}`}
                    className="inline-flex"
                    style={{ color: T.muted }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {avance && (
            <>
              <div>
                <span className={label} style={{ color: T.muted }}>Ligne grise sous la signature (optionnelle)</span>
                <textarea value={compose.content.signatureNote} onChange={(e) => pose({ signatureNote: e.target.value })} rows={2} className="w-full text-sm px-3 py-2.5 resize-y" style={fieldStyle} />
              </div>
              <div>
                <span className={label} style={{ color: T.muted }}>Pied de page : « Vous recevez ce message… »</span>
                <textarea value={compose.content.motif} onChange={(e) => pose({ motif: e.target.value })} rows={2} className="w-full text-sm px-3 py-2.5 resize-y" style={fieldStyle} />
              </div>
            </>
          )}

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
                  pieces.some((p) => p.enCours) ||
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
        open={gardeOuverte}
        title="Abandonner le message en cours ?"
        description="Le texte saisi dans la composition sera perdu."
        confirmLabel="Abandonner"
        onConfirm={() => {
          setGardeOuverte(false);
          setDirty(false);
          const fn = actionGardee.current;
          actionGardee.current = null;
          fn?.();
        }}
        onCancel={() => {
          setGardeOuverte(false);
          actionGardee.current = null;
        }}
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
