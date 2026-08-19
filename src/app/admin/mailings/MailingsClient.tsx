"use client";

// Mailings : un accueil épuré façon client mail (destinataire + point de
// départ), puis la composition avec aperçu en direct. Le message vierge est
// le choix par défaut ; les trois modèles restent à un clic.
import { useMemo, useState } from "react";
import {
  ArrowLeft, Briefcase, KeyRound, List, Loader2, Minus, Monitor, PenLine, Plus,
  RotateCcw, Send, ShieldCheck, Smartphone, SquareArrowOutUpRight, Tags,
} from "lucide-react";
import { T, Tag, AdminPage, fieldStyle, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";
import { MAILING_TEMPLATES, MAILING_VIERGE, renderMailing, type MailingBlock, type MailingContent } from "@/lib/mailings";

// Copie franche : l'édition travaille sur sa propre matière, le modèle de
// départ reste intact pour le bouton « Repartir du modèle ».
function copie(c: MailingContent): MailingContent {
  return JSON.parse(JSON.stringify(c)) as MailingContent;
}

const label = "block text-[10px] tracking-[0.14em] uppercase mb-1.5";

// Icône de chaque modèle sur l'accueil.
const MODELE_ICONS = [Briefcase, Tags, KeyRound] as const;

export default function MailingsClient({ mode, hasKey }: { mode: string; hasKey: boolean }) {
  const toast = useToast();
  const [etape, setEtape] = useState<"accueil" | "composition">("accueil");
  // null = message vierge ; sinon l'id du modèle chargé.
  const [modeleId, setModeleId] = useState<string | null>(null);
  const [content, setContent] = useState<MailingContent>(() => copie(MAILING_VIERGE));
  const [to, setTo] = useState("");
  const [viewport, setViewport] = useState<"bureau" | "telephone">("bureau");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const modele = MAILING_TEMPLATES.find((t) => t.id === modeleId) ?? null;
  const html = useMemo(() => renderMailing(content), [content]);

  function ouvre(id: string | null) {
    const base = id ? MAILING_TEMPLATES.find((t) => t.id === id)?.content : MAILING_VIERGE;
    if (!base) return;
    setModeleId(id);
    setContent(copie(base));
    setEtape("composition");
  }

  function pose(patch: Partial<MailingContent>) {
    setContent((c) => ({ ...c, ...patch }));
  }

  function poseBloc(i: number, patch: Record<string, unknown>) {
    setContent((c) => ({
      ...c,
      blocks: c.blocks.map((b, j) => (j === i ? ({ ...b, ...patch } as typeof b) : b)),
    }));
  }

  function retireBloc(i: number) {
    setContent((c) => ({ ...c, blocks: c.blocks.filter((_, j) => j !== i) }));
  }

  function ajouteBloc(type: MailingBlock["type"]) {
    const neuf: MailingBlock =
      type === "paragraphe"
        ? { type: "paragraphe", text: "" }
        : type === "puces"
          ? { type: "puces", items: [""] }
          : { type: "bouton", label: "Découvrir", url: "https://intelligenceautomobile.fr" };
    setContent((c) => ({ ...c, blocks: [...c.blocks, neuf] }));
  }

  async function envoyer() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/mailings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, ...content }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success(`Message envoyé à ${to}. Il apparaît au journal de l'écran Emails.`);
      setTo("");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'envoi a échoué.");
    } finally {
      setBusy(false);
    }
  }

  const aDuContenu = content.blocks.some(
    (b) => (b.type === "paragraphe" && b.text.trim()) || (b.type === "puces" && b.items.some((x) => x.trim())),
  );
  const pretAEnvoyer = to.trim().length > 3 && content.subject.trim().length > 0 && aDuContenu;

  return (
    <AdminPage>
      <style>{`
        @keyframes iaFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .ia-anim { animation: iaFadeUp 0.28s ease-out; }
        .ia-carte { transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease; }
        .ia-carte:hover, .ia-carte:focus-visible { border-color: ${T.accent} !important; transform: translateY(-2px); outline: none; }
        @media (prefers-reduced-motion: reduce) { .ia-anim { animation: none; } .ia-carte, .ia-carte:hover { transform: none; transition: none; } }
      `}</style>

      {etape === "accueil" ? (
        /* ═══════════ ACCUEIL : nouveau message ═══════════ */
        <div className="ia-anim flex flex-col items-center px-2 pt-10 pb-16 sm:pt-16">
          <div
            className="inline-flex items-center justify-center w-14 h-14 mb-6"
            style={{ border: `1px solid ${T.border}`, backgroundColor: T.surface }}
          >
            <Send size={22} style={{ color: T.accent }} />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight mb-1" style={{ color: T.text }}>
            Nouveau message
          </h1>
          <p className="text-sm mb-10 text-center" style={{ color: T.muted }}>
            Écrivez librement, ou partez d&apos;un modèle prêt à l&apos;emploi.
          </p>

          <div className="w-full max-w-[560px]">
            <label className="block mb-8">
              <span className={label} style={{ color: T.muted }}>À</span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") ouvre(null); }}
                placeholder="Adresse du destinataire (modifiable à tout moment)"
                type="email"
                autoFocus
                className="w-full text-[15px] px-4 py-3.5"
                style={fieldStyle}
              />
            </label>

            <button
              type="button"
              onClick={() => ouvre(null)}
              className="ia-carte w-full text-left flex items-center gap-4 px-5 py-5 mb-3"
              style={{ border: `1px solid ${T.accent}`, backgroundColor: T.surface }}
            >
              <span className="inline-flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ backgroundColor: T.accent, color: T.bg }}>
                <PenLine size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold" style={{ color: T.text }}>Message vierge</span>
                <span className="block text-[12px]" style={{ color: T.muted }}>
                  Vous écrivez, nous habillons : couleurs de la maison, signature et mentions comprises.
                </span>
              </span>
            </button>

            <p className="text-[10px] tracking-[0.18em] uppercase mt-6 mb-3" style={{ color: T.muted }}>
              Ou partez d&apos;un modèle
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {MAILING_TEMPLATES.map((t, i) => {
                const Icon = MODELE_ICONS[i] ?? Tags;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => ouvre(t.id)}
                    className="ia-carte text-left px-4 py-4"
                    style={{ border: `1px solid ${T.border}`, backgroundColor: T.surface }}
                  >
                    <Icon size={16} style={{ color: T.accent }} className="mb-3" />
                    <span className="block text-[13px] font-semibold mb-1" style={{ color: T.text }}>{t.label}</span>
                    <span className="block text-[11px] leading-relaxed" style={{ color: T.muted }}>{t.audience}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-10 justify-center text-[11px]" style={{ color: T.muted }}>
              {mode === "live" ? (
                <><Send size={12} style={{ color: T.accent }} /> Les emails partent réellement depuis ce serveur.</>
              ) : (
                <><ShieldCheck size={12} style={{ color: T.success }} /> Mode atelier : les messages sont retenus.</>
              )}
              {!hasKey && <Tag tone="warning">Aucun service d&apos;envoi configuré</Tag>}
              <span>· Chaque envoi s&apos;inscrit au journal de l&apos;écran Emails.</span>
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════ COMPOSITION ═══════════ */
        <div className="ia-anim">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button type="button" onClick={() => setEtape("accueil")} className={btnGhostClass} style={btnGhostStyle}>
              <ArrowLeft size={13} />
              Nouveau message
            </button>
            <h1 className="text-[18px] font-bold" style={{ color: T.text }}>
              {modele ? modele.label : "Message vierge"}
            </h1>
            {modele && <span className="text-[12px] hidden md:inline" style={{ color: T.muted }}>{modele.audience}</span>}
            <button
              type="button"
              onClick={() => setContent(copie(modele ? modele.content : MAILING_VIERGE))}
              title="Vos modifications à l'écran sont remplacées par le texte de départ."
              className={`${btnGhostClass} ml-auto`}
              style={btnGhostStyle}
            >
              <RotateCcw size={13} />
              {modele ? "Repartir du modèle" : "Tout effacer"}
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 items-start">
            {/* ── Colonne édition ── */}
            <div className="flex flex-col gap-5 min-w-0">
              <div>
                <span className={label} style={{ color: T.muted }}>À</span>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="prenom.nom@exemple.fr"
                  type="email"
                  className="w-full text-sm px-3 py-2.5"
                  style={fieldStyle}
                />
              </div>
              <div>
                <span className={label} style={{ color: T.muted }}>Objet</span>
                <input value={content.subject} onChange={(e) => pose({ subject: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
              </div>
              <div>
                <span className={label} style={{ color: T.muted }}>Ligne d&apos;aperçu (boîte de réception · optionnelle)</span>
                <input value={content.preheader} onChange={(e) => pose({ preheader: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <span className={label} style={{ color: T.muted }}>Petite ligne au-dessus du titre (optionnelle)</span>
                  <input value={content.kicker} onChange={(e) => pose({ kicker: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
                </div>
                <div>
                  <span className={label} style={{ color: T.muted }}>Titre du message (optionnel)</span>
                  <input value={content.titre} onChange={(e) => pose({ titre: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
                </div>
              </div>

              {content.blocks.map((b, i) => {
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
                        Paragraphe {content.blocks.slice(0, i + 1).filter((x) => x.type === "paragraphe").length}
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

              {/* Ajouter un élément */}
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
                <textarea
                  value={content.signatureNote}
                  onChange={(e) => pose({ signatureNote: e.target.value })}
                  rows={2}
                  className="w-full text-sm px-3 py-2.5 resize-y"
                  style={fieldStyle}
                />
              </div>
              <div>
                <span className={label} style={{ color: T.muted }}>Pied de page : « Vous recevez ce message… »</span>
                <textarea
                  value={content.motif}
                  onChange={(e) => pose({ motif: e.target.value })}
                  rows={2}
                  className="w-full text-sm px-3 py-2.5 resize-y"
                  style={fieldStyle}
                />
              </div>

              {/* Envoi */}
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
                    disabled={busy || !pretAEnvoyer}
                    className={btnPrimaryClass}
                    style={btnPrimaryStyle}
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Envoyer
                  </button>
                </div>
                <p className="text-[11px] mt-3" style={{ color: T.muted }}>
                  L&apos;envoi demande une adresse, un objet et du texte. La liste rouge s&apos;applique, et chaque envoi s&apos;inscrit au journal de l&apos;écran Emails.
                </p>
              </div>
            </div>

            {/* ── Colonne aperçu ── */}
            <div className="lg:sticky lg:top-6 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Aperçu</h2>
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

              {/* Ce que le destinataire voit avant d'ouvrir. */}
              <div className="px-4 py-3 mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-baseline" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
                <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>À</span>
                <span className="text-[13px] truncate" style={{ color: T.text }}>{to.trim() || "…"}</span>
                <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Objet</span>
                <span className="text-[13px] truncate" style={{ color: T.text }}>{content.subject || "…"}</span>
                <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Aperçu</span>
                <span className="text-[12px] truncate" style={{ color: T.muted }}>{content.preheader || "…"}</span>
              </div>

              <div className="flex justify-center" style={{ border: `1px solid ${T.border}`, backgroundColor: "#04070F" }}>
                <iframe
                  title="Aperçu du message"
                  srcDoc={html}
                  sandbox=""
                  style={{
                    width: viewport === "bureau" ? "100%" : 375,
                    maxWidth: "100%",
                    height: 640,
                    border: 0,
                    display: "block",
                    backgroundColor: "#070F1E",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title={`Envoyer ce message à ${to.trim()} ?`}
        description={
          mode === "live"
            ? `Ce message va réellement partir vers ${to.trim()}, avec l'objet « ${content.subject} ».`
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
    </AdminPage>
  );
}
