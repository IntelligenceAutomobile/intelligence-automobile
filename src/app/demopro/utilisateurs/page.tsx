// Démonstration /demopro — Utilisateurs (gestion des accès, patron).
// Réplique EN LECTURE SEULE de la page utilisateurs du back-office : liste des
// comptes avec rôle et date de création, plus le formulaire « Nouvel utilisateur ».
// Alimentée par des données d'exemple figées (src/lib/demo-data.ts) : aucun accès
// base, aucun fetch. Les champs ne sont pas soumis et les boutons d'action
// affichent un toast au lieu d'agir.
import { UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { ROLES, ROLE_LABEL, ROLE_DESC, type Role } from "@/lib/roles";
import {
  T, Tag, AdminPage, PageHeader, SectionCard,
  fieldStyle, labelClass, btnPrimaryClass, btnPrimaryStyle,
} from "@/app/admin/ui";
import { formatDateFr } from "@/lib/devis";
import { getDemoUsers } from "@/lib/demo-data";
import DemoActionButton from "../DemoActionButton";

const ROLE_TONE: Record<Role, "accent" | "warning" | "muted"> = {
  patron: "accent",
  gestionnaire: "warning",
  vendeur: "muted",
};

// Compte présenté comme « connecté » dans la démo : le patron fondateur.
const CURRENT_USER_ID = "usr-1";

// Date -> "YYYY-MM-DD" à partir des composantes locales (formatDateFr attend un ISO court).
function isoDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function DemoUtilisateursPage() {
  const users = getDemoUsers();
  // Rôle par défaut du formulaire, comme dans le back-office.
  const defaultRole: Role = "vendeur";

  return (
    <AdminPage width="narrow">
      <PageHeader title="Utilisateurs" subtitle="Comptes d'accès au back-office et leurs rôles." />

      {/* Liste des comptes */}
      <div className="mb-8" style={{ border: `1px solid ${T.border}` }}>
        {users.map((u, i) => {
          const isMe = u.id === CURRENT_USER_ID;
          const role = u.role as Role;
          return (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.border}` }}
            >
              <span
                className="flex items-center justify-center w-8 h-8 text-[11px] font-semibold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #24406E, #12233F)",
                  border: "1px solid rgba(199,211,232,0.28)",
                  color: "#C7D3E8",
                }}
              >
                {u.email.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm truncate" style={{ color: T.text }}>
                  {u.email}
                  {isMe && (
                    <span className="ml-2 text-[10px] tracking-widest uppercase" style={{ color: T.muted }}>
                      (vous)
                    </span>
                  )}
                </span>
                <span className="block text-[11px] mt-0.5" style={{ color: T.muted }}>
                  Ajouté le {formatDateFr(isoDay(u.createdAt))}
                </span>
              </span>
              <Tag tone={ROLE_TONE[role] ?? "muted"}>{ROLE_LABEL[role] ?? u.role}</Tag>
              {/* Sélecteur de rôle : champ non soumis (la démo n'enregistre rien). */}
              <select
                defaultValue={u.role}
                className="text-xs px-3 py-2 outline-none cursor-pointer flex-shrink-0"
                style={{ ...fieldStyle, width: undefined }}
                aria-label="Rôle"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
              {isMe ? (
                <button
                  type="button"
                  disabled
                  title="Vous ne pouvez pas vous supprimer"
                  className="p-1.5 opacity-30 flex-shrink-0"
                  style={{ color: T.muted }}
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <DemoActionButton
                  ariaLabel="Supprimer"
                  title="Supprimer"
                  className="p-1.5 transition-colors hover:text-[#FF6B35] flex-shrink-0"
                  style={{ color: T.muted }}
                >
                  <Trash2 size={14} />
                </DemoActionButton>
              )}
            </div>
          );
        })}
      </div>

      {/* Formulaire de création (inerte) */}
      <SectionCard title="Nouvel utilisateur">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Email</label>
            <input type="email" className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Mot de passe</label>
            <input type="text" placeholder="6 caractères min." className="px-4 py-3 text-sm outline-none w-full" style={fieldStyle} />
          </div>
          <div>
            <label className={labelClass} style={{ color: T.textDim }}>Rôle</label>
            <select defaultValue={defaultRole} className="px-4 py-3 text-sm outline-none w-full cursor-pointer" style={fieldStyle}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[12px] flex items-start gap-2" style={{ color: T.muted }}>
          <ShieldCheck size={14} style={{ color: T.accent, flexShrink: 0, marginTop: 1 }} />
          {ROLE_DESC[defaultRole]}
        </p>
        <div className="flex justify-end">
          <DemoActionButton className={btnPrimaryClass} style={btnPrimaryStyle}>
            <UserPlus size={14} />
            Créer l&apos;utilisateur
          </DemoActionButton>
        </div>
      </SectionCard>
    </AdminPage>
  );
}
