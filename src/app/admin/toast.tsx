"use client";

// Notifications toast du back-office : ToastProvider (monté dans le layout
// admin) + hook useToast() pour émettre depuis n'importe quel composant client.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { T, TONE, type Tone } from "./ui";

type ToastKind = Extract<Tone, "success" | "danger" | "accent">;
type Toast = { id: number; kind: ToastKind; message: string; leaving: boolean };

type PushToast = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<PushToast>({
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const ICON = {
  success: CheckCircle2,
  danger: AlertTriangle,
  accent: Info,
} as const;

const AUTO_DISMISS_MS = 5000;
const LEAVE_MS = 220;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), LEAVE_MS);
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, kind, message, leaving: false }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  // push est stable (useCallback sur dismiss stable) : l'API mémoïsée l'est aussi.
  const api = useMemo<PushToast>(
    () => ({
      success: (m: string) => push("success", m),
      error: (m: string) => push("danger", m),
      info: (m: string) => push("accent", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <style>{`
        @keyframes ia-toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 items-end" aria-live="polite">
        {toasts.map((t) => {
          const tone = TONE[t.kind];
          const Icon = ICON[t.kind];
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 pl-4 pr-3 py-3 max-w-sm"
              style={{
                backgroundColor: T.surface,
                border: `1px solid ${tone.bd}`,
                boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
                animation: "ia-toast-in 0.22s ease",
                opacity: t.leaving ? 0 : 1,
                transform: t.leaving ? "translateY(6px)" : "none",
                transition: `opacity ${LEAVE_MS}ms ease, transform ${LEAVE_MS}ms ease`,
              }}
            >
              <Icon size={16} style={{ color: tone.fg, flexShrink: 0 }} />
              <span className="text-sm" style={{ color: T.textDim }}>
                {t.message}
              </span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fermer"
                className="p-1 transition-colors hover:text-[#F0F5FF]"
                style={{ color: T.muted }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
