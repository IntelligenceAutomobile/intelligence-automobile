"use client";

// Planning atelier de la démonstration : vue semaine (lun→sam, 8h→19h) en
// LECTURE SEULE. Reproduit fidèlement la grille du back-office (colonnes jours,
// échelle horaire, blocs de RDV colorés par type, indisponibilités hachurées).
// Les boutons d'action (navigation, nouvel événement, modifier) affichent un
// message de démo. Un clic sur un bloc ouvre un panneau de détail. Aucun réseau.
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Car, Users, X, Clock, User } from "lucide-react";
import {
  APPOINTMENT_TYPES, TYPE_LABEL, TYPE_COLOR, DAY_START_MIN, DAY_END_MIN,
  formatMin, formatDayFr, type AppointmentType,
} from "@/lib/planning";
import { T, AdminPage, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import { DemoPageHeader } from "@/app/demopro/DemoPageHeader";
import { useToast } from "@/app/admin/toast";
import { DEMO_MSG } from "../demo";

export type DemoApptRow = {
  id: string;
  date: string;
  startMin: number;
  durationMin: number;
  type: string;
  title: string;
  person: string | null;
  clientLabel: string | null;
  vehicleLabel: string | null;
  vehicleYear: number | null;
};

const PX_PER_HOUR = 48;
const GRID_H = ((DAY_END_MIN - DAY_START_MIN) / 60) * PX_PER_HOUR;

export default function PlanningBoard({
  rows, weekKeys, todayKey, weekLabel,
}: {
  rows: DemoApptRow[];
  weekKeys: string[];
  todayKey: string;
  weekLabel: string;
}) {
  const toast = useToast();
  const demo = () => toast.info(DEMO_MSG);
  const [selected, setSelected] = useState<DemoApptRow | null>(null);

  const hours = Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }, (_, i) => DAY_START_MIN + i * 60);

  return (
    <AdminPage>
      <DemoPageHeader
        title="Planning atelier"
        subtitle={`Semaine du ${weekLabel} · essais, livraisons, préparation, indisponibilités.`}
        action={
          <div className="flex items-center gap-3">
            <div className="flex" style={{ border: `1px solid ${T.border}` }}>
              <button type="button" onClick={demo} className="p-2.5 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }} aria-label="Semaine précédente">
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={demo}
                className="px-3 py-2.5 text-[11px] tracking-widest uppercase transition-colors hover:text-[#F0F5FF]"
                style={{ color: T.textDim, borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}
              >
                Aujourd&apos;hui
              </button>
              <button type="button" onClick={demo} className="p-2.5 transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }} aria-label="Semaine suivante">
                <ChevronRight size={15} />
              </button>
            </div>
            <button type="button" onClick={demo} className={btnPrimaryClass} style={btnPrimaryStyle}>
              <Plus size={14} />
              Événement
            </button>
          </div>
        }
      />

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
        {APPOINTMENT_TYPES.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase" style={{ color: T.muted }}>
            <span style={{ width: 9, height: 9, backgroundColor: TYPE_COLOR[t].bd, flexShrink: 0 }} />
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>

      {/* Grille semaine */}
      <div className="overflow-x-auto" style={{ border: `1px solid ${T.border}` }}>
        <div className="min-w-[900px]">
          {/* En-têtes des jours */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(6, 1fr)` }}>
            <div style={{ borderBottom: `1px solid ${T.border}` }} />
            {weekKeys.map((key) => {
              const d = new Date(`${key}T00:00:00`);
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className="px-3 py-2.5 text-[11px] tracking-[0.14em] uppercase"
                  style={{
                    color: isToday ? T.accent : T.textDim,
                    fontWeight: isToday ? 600 : 400,
                    borderBottom: `1px solid ${T.border}`,
                    borderLeft: `1px solid ${T.border}`,
                    backgroundColor: isToday ? "rgba(107,159,238,0.06)" : T.surfaceAlt,
                  }}
                >
                  {formatDayFr(d)}
                </div>
              );
            })}
          </div>

          {/* Corps */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(6, 1fr)` }}>
            {/* Gouttière horaire */}
            <div className="relative" style={{ height: GRID_H }}>
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 text-[10px]"
                  style={{ top: ((h - DAY_START_MIN) / 60) * PX_PER_HOUR - 6, color: T.muted }}
                >
                  {formatMin(h)}
                </span>
              ))}
            </div>

            {weekKeys.map((key) => {
              const isToday = key === todayKey;
              const dayAppts = rows.filter((a) => a.date === key);
              return (
                <div
                  key={key}
                  className="relative"
                  style={{
                    height: GRID_H,
                    borderLeft: `1px solid ${T.border}`,
                    backgroundColor: isToday ? "rgba(107,159,238,0.04)" : "transparent",
                  }}
                >
                  {hours.slice(1).map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0"
                      style={{ top: ((h - DAY_START_MIN) / 60) * PX_PER_HOUR, height: 1, backgroundColor: T.border, opacity: 0.45 }}
                    />
                  ))}

                  {dayAppts.map((a) => {
                    const c = TYPE_COLOR[(a.type as AppointmentType) ?? "autre"] ?? TYPE_COLOR.autre;
                    const top = ((a.startMin - DAY_START_MIN) / 60) * PX_PER_HOUR;
                    const height = Math.max(22, (a.durationMin / 60) * PX_PER_HOUR - 2);
                    const isIndispo = a.type === "indispo";
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelected(a)}
                        className="absolute inset-x-1 text-left px-2 py-1 overflow-hidden transition-transform hover:scale-[1.015] cursor-pointer"
                        style={{
                          top,
                          height,
                          backgroundColor: c.bg,
                          borderLeft: `2px solid ${c.bd}`,
                          backgroundImage: isIndispo
                            ? "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(124,146,181,0.12) 5px, rgba(124,146,181,0.12) 7px)"
                            : undefined,
                        }}
                      >
                        <span className="block text-[11px] font-medium truncate" style={{ color: c.fg }}>
                          {isIndispo && a.person ? `${a.person} — ` : ""}
                          {a.title || TYPE_LABEL[(a.type as AppointmentType) ?? "autre"]}
                        </span>
                        <span className="block text-[10px] truncate" style={{ color: T.muted }}>
                          {formatMin(a.startMin)} · {TYPE_LABEL[(a.type as AppointmentType) ?? "autre"]}
                        </span>
                        {height > 56 && (a.clientLabel || a.vehicleLabel) && (
                          <span className="block text-[10px] truncate mt-0.5" style={{ color: T.textDim }}>
                            {a.clientLabel && (
                              <span className="inline-flex items-center gap-1 mr-2">
                                <Users size={9} />
                                {a.clientLabel}
                              </span>
                            )}
                            {a.vehicleLabel && (
                              <span className="inline-flex items-center gap-1">
                                <Car size={9} />
                                {a.vehicleLabel}
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] mt-3" style={{ color: T.muted }}>
        Cliquez sur un événement pour afficher son détail.
      </p>

      {/* Panneau de détail (lecture seule) */}
      {selected && (
        <DetailPanel appt={selected} onClose={() => setSelected(null)} onEdit={demo} />
      )}
    </AdminPage>
  );
}

/* ── Panneau de détail latéral ── */
function DetailPanel({ appt, onClose, onEdit }: { appt: DemoApptRow; onClose: () => void; onEdit: () => void }) {
  const c = TYPE_COLOR[(appt.type as AppointmentType) ?? "autre"] ?? TYPE_COLOR.autre;
  const label = TYPE_LABEL[(appt.type as AppointmentType) ?? "autre"] ?? appt.type;
  const day = formatDayFr(new Date(`${appt.date}T00:00:00`));
  const endMin = appt.startMin + appt.durationMin;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      style={{ backgroundColor: "rgba(4,11,22,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm h-full overflow-y-auto p-6"
        style={{ backgroundColor: T.surface, borderLeft: `1px solid ${T.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase" style={{ color: c.fg }}>
            <span style={{ width: 9, height: 9, backgroundColor: c.bd, flexShrink: 0 }} />
            {label}
          </span>
          <button type="button" onClick={onClose} className="transition-colors hover:text-[#F0F5FF]" style={{ color: T.muted }} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <h2 className="text-lg font-light mb-6" style={{ color: T.text, letterSpacing: "-0.01em" }}>
          {appt.title || label}
        </h2>

        <dl className="space-y-4">
          <Row icon={<Clock size={14} />} term="Créneau">
            {day} · {formatMin(appt.startMin)} → {formatMin(endMin)}
          </Row>
          {appt.person && (
            <Row icon={<User size={14} />} term="Personne">{appt.person}</Row>
          )}
          {appt.clientLabel && (
            <Row icon={<Users size={14} />} term="Client">{appt.clientLabel}</Row>
          )}
          {appt.vehicleLabel && (
            <Row icon={<Car size={14} />} term="Véhicule">
              {appt.vehicleLabel}{appt.vehicleYear ? ` · ${appt.vehicleYear}` : ""}
            </Row>
          )}
        </dl>

        <div className="mt-8 pt-5" style={{ borderTop: `1px solid ${T.surfaceAlt}` }}>
          <button type="button" onClick={onEdit} className={btnPrimaryClass + " w-full justify-center"} style={btnPrimaryStyle}>
            Modifier l&apos;événement
          </button>
          <p className="text-[11px] mt-3 text-center" style={{ color: T.muted }}>
            Aperçu de démonstration en lecture seule.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, term, children }: { icon: React.ReactNode; term: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 flex-shrink-0" style={{ backgroundColor: "rgba(107,159,238,0.07)", border: `1px solid ${T.border}`, color: T.accent }}>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] tracking-[0.14em] uppercase mb-0.5" style={{ color: T.muted }}>{term}</dt>
        <dd className="text-sm" style={{ color: T.textDim }}>{children}</dd>
      </div>
    </div>
  );
}
