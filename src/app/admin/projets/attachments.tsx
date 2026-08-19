"use client";

// Pièces jointes des projets (photos + fichiers) : reprise du mécanisme de
// l'Atelier, sorti dans un module pour être partagé entre les écrans Projets.

import { useState, useEffect, useRef } from "react";
import { upload } from "@vercel/blob/client";
import type { Attachment, AttachmentKind } from "@/lib/collab-attachments";

export const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface Pending {
  file: File;
  kind: AttachmentKind;
  preview: string | null;
}

export type AttachApi = ReturnType<typeof useAttachments>;

export function useAttachments() {
  const [pending, setPending] = useState<Pending[]>([]);
  const pendingRef = useRef<Pending[]>([]);
  useEffect(() => { pendingRef.current = pending; }, [pending]);

  // Révoque les URL d'aperçu (blob:) restantes au démontage, pour éviter les fuites mémoire.
  useEffect(() => () => {
    pendingRef.current.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
  }, []);

  function addFiles(files: File[], kind: AttachmentKind) {
    const entries: Pending[] = files.map(file => ({
      file,
      kind,
      preview: kind === "image" ? URL.createObjectURL(file) : null,
    }));
    setPending(prev => [...prev, ...entries]);
  }

  function removeAt(index: number) {
    setPending(prev => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function clear() {
    setPending(prev => {
      prev.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
      return [];
    });
  }

  async function uploadAll(): Promise<Attachment[]> {
    const results = await Promise.all(
      pending.map(async p => {
        try {
          const blob = await upload(p.file.name, p.file, {
            access: "public",
            handleUploadUrl: "/api/collab/upload",
          });
          return { url: blob.url, name: p.file.name, kind: p.kind } as Attachment;
        } catch {
          return null;
        }
      })
    );
    return results.filter((a): a is Attachment => a !== null);
  }

  return { pending, addFiles, removeAt, clear, uploadAll };
}

function AttachButton({ icon, label, count, small, onClick }: {
  icon: string;
  label: string;
  count: number;
  small?: boolean;
  onClick: () => void;
}) {
  const active = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border ${small ? "px-2 py-1" : "px-3 py-1.5"} text-xs`}
      style={{ borderColor: active ? "#6B9FEE" : "#2C4B7C", color: active ? "#6B9FEE" : "#C8D8EE", backgroundColor: "#0D1E38" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#6B9FEE"; e.currentTarget.style.color = active ? "#9CC0FF" : "#F0F5FF"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = active ? "#6B9FEE" : "#2C4B7C"; e.currentTarget.style.color = active ? "#6B9FEE" : "#C8D8EE"; }}
    >
      <span>{icon}</span>
      <span>{label}{active ? ` · ${count}` : ""}</span>
    </button>
  );
}

export function AttachBar({ att, small }: { att: AttachApi; small?: boolean }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCount = att.pending.filter(p => p.kind === "image").length;
  const fileCount = att.pending.filter(p => p.kind === "file").length;
  function pick(e: React.ChangeEvent<HTMLInputElement>, kind: AttachmentKind) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) att.addFiles(files, kind);
    e.target.value = "";
  }
  return (
    <div className="flex items-center gap-2">
      <AttachButton icon="📷" label="Visuels" count={imageCount} small={small} onClick={() => imageInputRef.current?.click()} />
      <AttachButton icon="📎" label="Fichiers" count={fileCount} small={small} onClick={() => fileInputRef.current?.click()} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => pick(e, "image")} />
      <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} multiple className="hidden" onChange={e => pick(e, "file")} />
    </div>
  );
}

export function AttachPreviews({ att, size = 80, className = "" }: { att: AttachApi; size?: number; className?: string }) {
  if (att.pending.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-start gap-2 ${className}`}>
      {att.pending.map((p, i) => (
        <div key={i} className="relative">
          {p.kind === "image" ? (
            p.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.preview} alt="aperçu" decoding="async" className="object-cover border" style={{ width: size, height: size, borderColor: "#1B3055" }} />
            ) : (
              <div className="border flex items-center justify-center text-xs" style={{ width: size, height: size, borderColor: "#1B3055", color: "#1B3055" }}>…</div>
            )
          ) : (
            <div className="border flex flex-col items-center justify-center gap-1 px-2 text-center" style={{ width: size, height: size, borderColor: "#2C4B7C", color: "#9CC0FF" }}>
              <span style={{ fontSize: "18px" }}>📄</span>
              <span className="leading-tight w-full truncate" style={{ fontSize: "10px" }}>{p.file.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => att.removeAt(i)}
            className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs"
            style={{ backgroundColor: "#0B1930", color: "#C8D8EE", border: "1px solid #1B3055" }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function FileChips({ files, className = "" }: { files: Attachment[]; className?: string }) {
  if (files.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {files.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs border"
          style={{ borderColor: "#2C4B7C", color: "#9CC0FF" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6B9FEE"; e.currentTarget.style.color = "#F0F5FF"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2C4B7C"; e.currentTarget.style.color = "#9CC0FF"; }}
        >
          <span>📄</span>
          <span className="truncate" style={{ maxWidth: "180px" }}>{a.name}</span>
        </a>
      ))}
    </div>
  );
}
