"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/context";

type Category = { label: string; items: string[] };

export default function EquipementsAccordion({ categories }: { categories: Category[] }) {
  const { t } = useLocale();
  const categoryLabels = t.vehicleModal.categoryLabels;

  const [open, setOpen] = useState<Set<string>>(
    () => new Set(categories[0] ? [categories[0].label] : [])
  );

  const toggle = (label: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  return (
    <div
      className="flex flex-col"
      style={{ border: "1px solid rgba(107,159,238,0.18)" }}
    >
      {categories.map((cat, catIdx) => {
        const isOpen = open.has(cat.label);
        const displayLabel = categoryLabels[cat.label as keyof typeof categoryLabels] ?? cat.label;
        return (
          <div
            key={cat.label}
            style={{ borderTop: catIdx > 0 ? "1px solid rgba(107,159,238,0.12)" : "none" }}
          >
            {/* Header */}
            <button
              onClick={() => toggle(cat.label)}
              className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors duration-150"
              style={{
                backgroundColor: isOpen ? "rgba(107,159,238,0.07)" : "transparent",
                borderLeft: `3px solid ${isOpen ? "#6B9FEE" : "rgba(107,159,238,0.25)"}`,
              }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="text-sm tracking-[0.4em] uppercase font-semibold"
                  style={{ color: isOpen ? "#6B9FEE" : "#C8D8EE" }}
                >
                  {displayLabel}
                </span>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 tabular-nums"
                  style={{
                    backgroundColor: isOpen ? "rgba(107,159,238,0.15)" : "rgba(107,159,238,0.05)",
                    color: "#6B9FEE",
                    border: "1px solid rgba(107,159,238,0.22)",
                    borderRadius: "3px",
                  }}
                >
                  {cat.items.length}
                </span>
              </div>
              <span
                className="text-xl leading-none transition-transform duration-200 flex-shrink-0"
                style={{
                  color: isOpen ? "#6B9FEE" : "rgba(107,159,238,0.45)",
                  display: "inline-block",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                ›
              </span>
            </button>

            {/* Content */}
            {isOpen && (
              <div style={{ borderTop: "1px solid rgba(107,159,238,0.1)" }}>
                {Array.from({ length: Math.ceil(cat.items.length / 2) }, (_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 sm:grid-cols-2"
                    style={{
                      borderTop: i > 0 ? "1px solid rgba(107,159,238,0.15)" : "none",
                      backgroundColor: i % 2 === 0 ? "rgba(107,159,238,0.05)" : "transparent",
                    }}
                  >
                    {[0, 1].map((j) => {
                      const item = cat.items[i * 2 + j];
                      if (!item) return <div key={j} />;
                      return (
                        <div
                          key={j}
                          className="flex items-start gap-3 px-6 py-5"
                          style={{
                            borderLeft: j === 1 ? "1px solid rgba(107,159,238,0.12)" : "none",
                          }}
                        >
                          <span
                            className="flex-shrink-0 rounded-full mt-1.5"
                            style={{ width: "5px", height: "5px", minWidth: "5px", backgroundColor: "#6B9FEE" }}
                          />
                          <span
                            className="text-base leading-snug"
                            style={{ color: "#E8F0FC", fontWeight: 400 }}
                          >
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
