"use client";

// Gestion des utilisateurs (patron) : liste, création, changement de rôle, suppression.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { ROLES, ROLE_LABEL, ROLE_DESC, type Role } from "@/lib/roles";
import { T, Tag, AdminPage, PageHeader, SectionCard, fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle } from "../ui";
import { useToast } from "../toast";
import { ConfirmDialog } from "../confirm";

export type UserRow = { id: string; email: string; role: string };

const ROLE_TONE: Record<Role, "accent" | "warning" | "muted"> = {
  patron: "accent",
  gestionnaire: "warning",
  vendeur: "muted",
};

export default function UtilisateursClient({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ email: "", password: "", role: "vendeur" as Role });

  async function createUser() {
    if (!form.email.trim() || form.password.length < 6) {
      toast.error("Email valide et mot de passe (6+ caractères) requis.");
      return;
    }
    setBusy("new");
    try {
      const res = await fetch("/api/admin/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Utilisateur créé.");
      setForm({ email: "", password: "", role: "vendeur" });
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La création a échoué.");
    } finally {
      setBusy(null);
    }
  }

  async function changeRole(u: UserRow, role: Role) {
    setBusy(u.id);
    try {
      const res = await fetch(`/api/admin/utilisateurs/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Rôle mis à jour.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La mise à jour a échoué.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteUser(u: UserRow) {
    setBusy(u.id);
    try {
      const res = await fetch(`/api/admin/utilisateurs/${u.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      toast.success("Utilisateur supprimé.");
      setConfirmDelete(null);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "La suppression a échoué.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminPage width="narrow">
      <PageHeader title="Utilisateurs" subtitle="Comptes d'accès au back-office et leurs rôles." />

      {/* Liste */}
      <div className="mb-8" style={{ border: `1px solid ${T.border}` }}>
        {users.map((u, i) => {
          const isMe = u.id === currentUserId;
          return (
            <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}>
              <span className="flex items-center justify-center w-8 h-8 text-[11px] font-semibold flex-shrink-0" style={{ background: "linear-gradient(135deg, #24406E, #12233F)", border: "1px solid rgba(199,211,232,0.28)", color: "#C7D3E8" }}>
                {u.email.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-sm truncate min-w-0 flex-1" style={{ color: T.text }}>
                {u.email}
                {isMe && <span className="ml-2 text-[10px] tracking-widest uppercase" style={{ color: T.muted }}>(vous)</span>}
              </span>
              <Tag tone={ROLE_TONE[u.role as Role] ?? "muted"}>{ROLE_LABEL[u.role as Role] ?? u.role}</Tag>
              <select
                value={u.role}
                disabled={busy === u.id}
                onChange={(e) => changeRole(u, e.target.value as Role)}
                className="text-xs px-3 py-2 outline-none cursor-pointer flex-shrink-0"
                style={{ ...fieldStyle, width: undefined }}
                aria-label="Rôle"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setConfirmDelete(u)}
                disabled={busy === u.id || isMe}
                title={isMe ? "Vous ne pouvez pas vous supprimer" : "Supprimer"}
                className="p-1.5 transition-colors hover:text-[#FF6B35] disabled:opacity-30 flex-shrink-0"
                style={{ color: T.muted }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Création */}
      <SectionCard title="Nouvel utilisateur">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Mot de passe</label>
            <input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="6 caractères min." className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Rôle</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        </div>
        <p className="text-[12px] flex items-start gap-2" style={{ color: T.muted }}>
          <ShieldCheck size={14} style={{ color: T.accent, flexShrink: 0, marginTop: 1 }} />
          {ROLE_DESC[form.role]}
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={createUser} disabled={busy === "new"} className={btnPrimaryClass} style={btnPrimaryStyle}>
            <UserPlus size={14} />
            Créer l&apos;utilisateur
          </button>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer cet utilisateur ?"
        description={confirmDelete ? `${confirmDelete.email} n'aura plus accès au back-office.` : undefined}
        busy={busy === confirmDelete?.id}
        onConfirm={() => confirmDelete && deleteUser(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </AdminPage>
  );
}
