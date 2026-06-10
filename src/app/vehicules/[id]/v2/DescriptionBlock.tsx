"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/context";

function renderDesc(text: string) {
  const parts = text.split(/([\d][\d\s,]*(?:ch système|ch|km\/h|km|L\/100\s*km|%|rapports))/g);
  return parts.map((part, i) =>
    /^\d/.test(part) ? (
      <span key={i} style={{ color: "#6B9FEE", fontWeight: 600 }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function DescriptionBlock({ paragraphs }: { paragraphs: string[] }) {
  const { t } = useLocale();
  const tm = t.vehicleModal;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? paragraphs : paragraphs.slice(0, 2);

  return (
    <div className="flex flex-col gap-4">
      {visible.map((p, i) => (
        <p key={i} className="text-sm leading-loose" style={{ color: "#C8D8EE", fontWeight: 400 }}>
          {renderDesc(p)}
        </p>
      ))}
      {paragraphs.length > 2 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[10px] tracking-wide transition-opacity hover:opacity-80 self-start"
          style={{ color: "#6B9FEE" }}
        >
          {expanded ? tm.readLess : tm.readMore}
        </button>
      )}
    </div>
  );
}
