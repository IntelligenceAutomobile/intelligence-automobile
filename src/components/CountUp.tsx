"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

type Part = { text: string; num: number | null };

// Découpe une valeur affichée ("+2 000", "20–30%", "100%") en segments :
// les nombres seront animés, le reste (signes, %, tiret, espaces) reste figé.
function parse(value: string): Part[] {
  const re = /\d[\d\s  ,]*\d|\d/g;
  const parts: Part[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    if (m.index > last) parts.push({ text: value.slice(last, m.index), num: null });
    parts.push({ text: m[0], num: parseInt(m[0].replace(/[\s  ,]/g, ""), 10) });
    last = m.index + m[0].length;
  }
  if (last < value.length) parts.push({ text: value.slice(last), num: null });
  return parts;
}

/**
 * Affiche une statistique avec un effet « count-up » au scroll.
 * - SSR / sans JS / reduced-motion → la valeur finale exacte est rendue (pas de "0" figé).
 * - Sinon : remet à 0 au montage puis compte jusqu'à la valeur quand l'élément entre dans le viewport.
 */
export default function CountUp({ value }: { value: string }) {
  const parts = useMemo(() => parse(value), [value]);
  const [progress, setProgress] = useState(1);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    setProgress(0);

    const run = () => {
      const duration = 1400;
      let start: number | null = null;
      const tick = (now: number) => {
        if (start === null) start = now;
        const t = Math.min(1, (now - start) / duration);
        setProgress(1 - Math.pow(1 - t, 3)); // easeOutCubic
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          obs.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  const display =
    progress >= 1
      ? value
      : parts
          .map((p) => (p.num === null ? p.text : formatNumber(Math.round(p.num * progress))))
          .join("");

  return <span ref={ref}>{display}</span>;
}
