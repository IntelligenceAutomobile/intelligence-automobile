import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { oublierListeRouge } from "@/lib/mailer";

// ────────────────────────────────────────────────────────────────────────────
// Retours du service d'envoi (Resend) : remis, ouvert, cliqué, adresse morte,
// plainte pour spam. Chaque avis se range sur la ligne du journal qui porte le
// même identifiant de message. Une adresse morte ou une plainte inscrit
// l'adresse en liste rouge : on cesse d'écrire à qui ne veut pas, ou ne peut
// plus, nous lire.
//
// Réglage côté Resend : Webhooks → Add endpoint →
//   https://intelligenceautomobile.fr/api/webhooks/resend
// puis coller le « Signing secret » (whsec_…) dans RESEND_WEBHOOK_SECRET.
// ────────────────────────────────────────────────────────────────────────────

type Evenement = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    subject?: string;
    bounce?: { type?: string; message?: string; subType?: string };
    click?: { link?: string };
  };
};

// Vérification de signature (norme Svix, employée par Resend) : le message est
// signé avec le secret partagé, horodaté, et refusé passé cinq minutes.
function signatureValide(req: NextRequest, corps: string, secret: string): boolean {
  const id = req.headers.get("svix-id") ?? "";
  const ts = req.headers.get("svix-timestamp") ?? "";
  const sigs = req.headers.get("svix-signature") ?? "";
  if (!id || !ts || !sigs) return false;

  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;

  const cle = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const attendu = createHmac("sha256", cle).update(`${id}.${ts}.${corps}`).digest();

  return sigs.split(" ").some((s) => {
    const [version, valeur] = s.split(",");
    if (version !== "v1" || !valeur) return false;
    const recu = Buffer.from(valeur, "base64");
    return recu.length === attendu.length && timingSafeEqual(recu, attendu);
  });
}

async function bloque(adresse: string, motif: string): Promise<void> {
  const value = adresse.trim().toLowerCase();
  if (!value.includes("@")) return;
  const existe = await prisma.emailBlock.findUnique({ where: { value } });
  if (existe) return;
  await prisma.emailBlock.create({ data: { value, reason: motif.slice(0, 200), author: "Retour Resend" } });
  oublierListeRouge();
}

export async function POST(req: NextRequest) {
  const secret = (process.env.RESEND_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });

  const corps = await req.text();
  if (!signatureValide(req, corps, secret)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let ev: Evenement;
  try {
    ev = JSON.parse(corps) as Evenement;
  } catch {
    return NextResponse.json({ error: "Charge illisible." }, { status: 400 });
  }

  const type = ev.type ?? "";
  const messageId = ev.data?.email_id ?? "";
  const quand = ev.created_at && !isNaN(new Date(ev.created_at).getTime()) ? new Date(ev.created_at).toISOString() : new Date().toISOString();
  const destinataires = Array.isArray(ev.data?.to) ? ev.data.to : ev.data?.to ? [ev.data.to] : [];

  try {
    if (messageId) {
      const patch: Record<string, string> = {};
      if (type === "email.delivered") patch.deliveredAt = quand;
      // Première ouverture et premier clic : ce sont eux qui comptent.
      if (type === "email.opened") patch.openedAt = quand;
      if (type === "email.clicked") patch.clickedAt = quand;
      if (type === "email.bounced") {
        patch.bouncedAt = quand;
        patch.bounceReason = [ev.data?.bounce?.type, ev.data?.bounce?.subType, ev.data?.bounce?.message].filter(Boolean).join(" · ").slice(0, 300);
      }
      if (type === "email.complained") patch.complainedAt = quand;

      if (Object.keys(patch).length > 0) {
        const lignes = await prisma.emailLog.findMany({ where: { messageId }, select: { id: true, openedAt: true, clickedAt: true } });
        for (const l of lignes) {
          const data = { ...patch };
          if (data.openedAt && l.openedAt) delete data.openedAt;
          if (data.clickedAt && l.clickedAt) delete data.clickedAt;
          if (Object.keys(data).length > 0) await prisma.emailLog.update({ where: { id: l.id }, data });
        }
      }
    }

    // Adresse définitivement injoignable, ou plainte : liste rouge.
    if (type === "email.complained") {
      for (const a of destinataires) await bloque(a, "Plainte pour spam signalée par le service d'envoi");
    } else if (type === "email.bounced" && (ev.data?.bounce?.type ?? "").toLowerCase() === "permanent") {
      for (const a of destinataires) await bloque(a, "Adresse injoignable (retour définitif du service d'envoi)");
    }
  } catch (e) {
    console.error("[webhook resend] traitement impossible :", e);
    // Répondre 200 malgré tout : le service renverrait sinon le même avis en boucle.
  }

  return NextResponse.json({ ok: true });
}
