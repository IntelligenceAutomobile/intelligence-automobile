"use client";

// Mailings : trois modèles prêts à l'emploi, tout est modifiable, l'aperçu
// montre le message exact, et l'envoi part vers une adresse à la fois.
import { useMemo, useState } from "react";
import { Loader2, Monitor, RotateCcw, Send, ShieldCheck, Smartphone } from "lucide-react";
import { T, Tag, AdminPage, PageHeader, fieldStyle, btnPrimaryClass, btnPrimaryStyle, btnGhostClass, btnGhostStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";
import { MAILING_TEMPLATES, renderMailing, type MailingContent } from "@/lib/mailings";

// Copie franche d'un modèle : l'édition travaille sur sa propre matière,
// le modèle de départ reste intact pour le bouton « Recharger ».
function copie(c: MailingContent): MailingContent {
  return JSON.parse(JSON.stringify(c)) as MailingContent;
}

const label = "block text-[10px] tracking-[0.14em] uppercase mb-1.5";

export default function MailingsClient({ mode, hasKey }: { mode: string; hasKey: boolean }) {
  const toast = useToast();
  const [templateId, setTemplateId] = useState(MAILING_TEMPLATES[0].id);
  const [content, setContent] = useState<MailingContent>(() => copie(MAILING_TEMPLATES[0].content));
  const [to, setTo] = useState("");
  const [viewport, setViewport] = useState<"bureau" | "telephone">("bureau");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const template = MAILING_TEMPLATES.find((t) => t.id === templateId) ?? MAILING_TEMPLATES[0];
  const html = useMemo(() => renderMailing(content), [content]);

  function charge(id: string) {
    const t = MAILING_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setTemplateId(id);
    setContent(copie(t.content));
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
      toast.success(`Mailing envoyé à ${to}. Il apparaît au journal de l'écran Emails.`);
      setTo("");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "L'envoi a échoué.");
    } finally {
      setBusy(false);
    }
  }

  const pretAEnvoyer = to.trim().length > 3 && content.subject.trim().length > 0;

  return (
    <AdminPage>
      <PageHeader
        title="Mailings"
        subtitle="Trois modèles prêts à l'emploi. Modifiez librement, relisez l'aperçu, envoyez à une adresse."
      />

      {/* État de l'envoi : le même repère que l'écran Emails. */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
        {mode === "live" ? (
          <>
            <Send size={16} style={{ color: T.accent }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              Les emails partent réellement depuis ce serveur : chaque envoi atteint son destinataire.
            </span>
          </>
        ) : (
          <>
            <ShieldCheck size={16} style={{ color: T.success }} />
            <span className="text-sm" style={{ color: T.textDim }}>
              Mode atelier : tout message qui pourrait atteindre une vraie personne est retenu.
            </span>
          </>
        )}
        {!hasKey && (
          <span className="ml-auto">
            <Tag tone="warning">Aucun service d&apos;envoi configuré</Tag>
          </span>
        )}
      </div>

      {/* Choix du modèle */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {MAILING_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => charge(t.id)}
            aria-pressed={templateId === t.id}
            className="adm-chip text-[11px] tracking-widest uppercase px-3 py-1.5 transition-colors"
            style={
              templateId === t.id
                ? { backgroundColor: T.accent, color: T.bg, border: `1px solid ${T.accent}` }
                : { border: `1px solid ${T.border}`, color: T.textDim }
            }
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => charge(templateId)}
          title="Recharger le modèle : vos modifications à l'écran sont remplacées par le texte d'origine."
          className={`${btnGhostClass} ml-auto`}
          style={btnGhostStyle}
        >
          <RotateCcw size={13} />
          Recharger le modèle
        </button>
      </div>
      <p className="text-[12px] mb-6" style={{ color: T.muted }}>
        {template.audience}. Vos modifications restent à l&apos;écran : recharger le modèle ou changer d&apos;onglet les remplace.
      </p>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* ── Colonne édition ── */}
        <div className="flex flex-col gap-5 min-w-0">
          <div>
            <span className={label} style={{ color: T.muted }}>Objet</span>
            <input value={content.subject} onChange={(e) => pose({ subject: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
          </div>
          <div>
            <span className={label} style={{ color: T.muted }}>Ligne d&apos;aperçu (visible dans la boîte de réception, invisible dans le message)</span>
            <input value={content.preheader} onChange={(e) => pose({ preheader: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className={label} style={{ color: T.muted }}>Petite ligne au-dessus du titre</span>
              <input value={content.kicker} onChange={(e) => pose({ kicker: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
            </div>
            <div>
              <span className={label} style={{ color: T.muted }}>Titre du message</span>
              <input value={content.titre} onChange={(e) => pose({ titre: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
            </div>
          </div>

          {content.blocks.map((b, i) => {
            if (b.type === "paragraphe") {
              return (
                <div key={i}>
                  <span className={label} style={{ color: T.muted }}>Paragraphe {content.blocks.slice(0, i + 1).filter((x) => x.type === "paragraphe").length}</span>
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
                  <span className={label} style={{ color: T.muted }}>Liste à puces (une ligne par puce · **gras** pour un intitulé en blanc)</span>
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
              <div key={i} className="grid gap-5 sm:grid-cols-2">
                <div>
                  <span className={label} style={{ color: T.muted }}>Texte du bouton</span>
                  <input value={b.label} onChange={(e) => poseBloc(i, { label: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
                </div>
                <div>
                  <span className={label} style={{ color: T.muted }}>Lien du bouton</span>
                  <input value={b.url} onChange={(e) => poseBloc(i, { url: e.target.value })} className="w-full text-sm px-3 py-2.5" style={fieldStyle} />
                </div>
              </div>
            );
          })}

          <div>
            <span className={label} style={{ color: T.muted }}>Ligne grise sous la signature</span>
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
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex-1 min-w-[220px]">
                <span className={label} style={{ color: T.muted }}>Adresse du destinataire</span>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && pretAEnvoyer && !busy) setConfirming(true); }}
                  placeholder="prenom.nom@exemple.fr"
                  type="email"
                  className="w-full text-sm px-3 py-2.5"
                  style={fieldStyle}
                />
              </label>
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
              La liste rouge s&apos;applique, et chaque envoi s&apos;inscrit au journal de l&apos;écran Emails avec la mention « mailing ».
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

          {/* Ligne de boîte de réception : ce que le destinataire voit avant d'ouvrir. */}
          <div className="px-4 py-3 mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-baseline" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Objet</span>
            <span className="text-[13px] truncate" style={{ color: T.text }}>{content.subject || "…"}</span>
            <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>Aperçu</span>
            <span className="text-[12px] truncate" style={{ color: T.muted }}>{content.preheader || "…"}</span>
          </div>

          <div className="flex justify-center" style={{ border: `1px solid ${T.border}`, backgroundColor: "#04070F" }}>
            <iframe
              title="Aperçu du mailing"
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

      <ConfirmDialog
        open={confirming}
        title={`Envoyer ce mailing à ${to.trim()} ?`}
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
