"use client";

// Fenêtre « Devis / Facture » du stock : on choisit le document et le client,
// le reste se crée tout seul (ligne de vente au prix affiché, encart véhicule,
// TVA sur marge). La facture passe par la conversion commune : mêmes contrôles
// et même numérotation que depuis l'écran des devis.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, ReceiptText } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { T, Thumb, fieldStyle, btnGhostClass, btnGhostStyle, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import { useToast } from "../toast";
import type { StockItem } from "./StockList";

type ClientLite = { id: string; name: string; company: string; email: string; phone: string };

const DOC_CHOICES = [
  { value: "devis", label: "Devis", icon: FileText, hint: "À envoyer au client pour accord." },
  { value: "facture", label: "Facture", icon: ReceiptText, hint: "Émise immédiatement, numéro FAC définitif." },
] as const;
type DocChoice = (typeof DOC_CHOICES)[number]["value"];

export default function DocumentDialog({ vehicle, onClose }: { vehicle: StockItem; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [docType, setDocType] = useState<DocChoice>("devis");
  const [clients, setClients] = useState<ClientLite[] | null>(null);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<ClientLite | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Le carnet de clients, pour proposer les fiches existantes pendant la saisie.
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/clients")
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!alive || !Array.isArray(list)) return;
        setClients(list.map((c) => ({
          id: String(c.id),
          name: String(c.name ?? ""),
          company: String(c.company ?? ""),
          email: String(c.email ?? ""),
          phone: String(c.phone ?? ""),
        })));
      })
      .catch(() => { if (alive) setClients([]); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const results = useMemo(() => {
    if (!clients || chosen) return [];
    const q = query.trim().toLowerCase();
    const source = q
      ? clients.filter((c) =>
          [c.name, c.company, c.email, c.phone].some((f) => f.toLowerCase().includes(q)),
        )
      : clients;
    return source.slice(0, 6);
  }, [clients, chosen, query]);

  const newName = !chosen ? query.trim() : "";
  const ready = chosen !== null || newName !== "";

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/vehicules/${vehicle.id}/document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chosen ? { docType, clientId: chosen.id } : { docType, clientName: newName }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      if (j.factureId) {
        toast.success(`Facture ${j.number} créée.`);
        router.push(`/admin/devis/${j.factureId}`);
      } else if (j.manque) {
        // Un élément obligatoire manque pour facturer : le devis pré-rempli
        // s'ouvre, il reste à le compléter puis à cliquer « Créer la facture ».
        toast.info(`${j.manque} Le devis pré-rempli s'ouvre : complétez-le, puis « Créer la facture ».`);
        router.push(`/admin/devis/${j.devisId}`);
      } else {
        toast.success(`Devis ${j.number} créé.`);
        router.push(`/admin/devis/${j.devisId}`);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La création a échoué.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={busy ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Créer un devis ou une facture"
    >
      <div
        className="w-full max-w-md p-6"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Le véhicule, pour confirmer d'un coup d'œil qu'on est sur la bonne voiture. */}
        <div className="flex items-center gap-3 mb-5">
          <Thumb src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} w={72} h={54} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-[10px] tracking-[0.18em] uppercase flex-shrink-0" style={{ color: T.accent }}>{vehicle.make}</span>
              <span className="text-[14px] font-medium truncate" style={{ color: T.text }}>{vehicle.model}</span>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>
              {vehicle.year} · {formatNumber(vehicle.mileage)} km
              {" · "}
              <span style={{ color: vehicle.price > 0 ? T.textDim : T.warning }}>
                {vehicle.price > 0 ? `${formatNumber(vehicle.price)} €` : "Prix à définir"}
              </span>
            </div>
          </div>
        </div>

        {/* Le document */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {DOC_CHOICES.map((c) => {
            const on = docType === c.value;
            const Icon = c.icon;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setDocType(c.value)}
                className="p-3 text-left transition-colors"
                style={{
                  border: `1px solid ${on ? T.accent : T.border}`,
                  backgroundColor: on ? "var(--adm-accent-soft)" : "transparent",
                }}
              >
                <span className="flex items-center gap-2 text-[13px] font-medium" style={{ color: on ? T.text : T.textDim }}>
                  <Icon size={15} style={{ color: on ? T.accent : T.muted }} />
                  {c.label}
                </span>
                <span className="block text-[11px] mt-1" style={{ color: T.muted }}>{c.hint}</span>
              </button>
            );
          })}
        </div>
        {docType === "facture" && vehicle.price <= 0 && (
          <p className="text-[11px] mb-2" style={{ color: T.warning }}>
            Le prix reste à définir sur la fiche : le devis pré-rempli s&apos;ouvrira pour le poser avant de facturer.
          </p>
        )}

        {/* Le client */}
        <div className="mt-4">
          <div className="text-[10px] tracking-[0.14em] uppercase mb-2" style={{ color: T.muted }}>Client</div>
          <input
            ref={inputRef}
            autoFocus
            value={chosen ? chosen.name : query}
            onChange={(e) => { setChosen(null); setQuery(e.target.value); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Chercher une fiche, ou saisir un nouveau nom…"
            className="px-3 py-2 text-sm outline-none w-full"
            style={{
              ...fieldStyle,
              ...(chosen ? { borderColor: T.accent } : {}),
            }}
          />
          {results.length > 0 && (
            <div className="mt-1 max-h-48 overflow-y-auto" style={{ border: `1px solid ${T.border}` }}>
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setChosen(c); setQuery(""); }}
                  className="w-full flex items-baseline gap-2 px-3 py-2 text-left transition-colors hover:bg-[rgba(107,159,238,0.10)]"
                >
                  <span className="text-[13px] truncate" style={{ color: T.textDim }}>{c.name}</span>
                  {(c.company || c.email) && (
                    <span className="text-[11px] truncate ml-auto flex-shrink-0" style={{ color: T.muted }}>
                      {c.company || c.email}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {chosen && (
            <p className="text-[11px] mt-1.5" style={{ color: T.muted }}>
              Fiche CRM existante : ses coordonnées arrivent sur le document.
            </p>
          )}
          {newName !== "" && (
            <p className="text-[11px] mt-1.5" style={{ color: T.muted }}>
              Une nouvelle fiche client « {newName} » sera créée dans le CRM.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} disabled={busy} className={btnGhostClass} style={btnGhostStyle}>
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!ready || busy}
            className={btnPrimaryClass}
            style={btnPrimaryStyle}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : docType === "facture" ? <ReceiptText size={13} /> : <FileText size={13} />}
            {docType === "facture" ? "Créer la facture" : "Créer le devis"}
          </button>
        </div>
      </div>
    </div>
  );
}
