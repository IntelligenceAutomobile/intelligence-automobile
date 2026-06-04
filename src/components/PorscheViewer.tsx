"use client";

import { useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        "auto-rotate"?: boolean;
        "auto-rotate-delay"?: string;
        "rotation-per-second"?: string;
        "camera-controls"?: boolean;
        "shadow-intensity"?: string;
        "shadow-softness"?: string;
        exposure?: string;
        loading?: string;
        "environment-image"?: string;
      };
    }
  }
}

export default function PorscheViewer() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  return (
    <section className="border-t" style={{ borderColor: "#1B3055", backgroundColor: "#040B16" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-4 text-center">
        <p className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: "#6B9FEE" }}>
          Porsche 911 C4S Aerokit
        </p>
        <h2
          className="font-black uppercase leading-none"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.8rem)", letterSpacing: "-0.025em" }}
        >
          Explorez en 3D
        </h2>
      </div>

      <div style={{ width: "100%", height: "70vh", minHeight: "520px" }}>
        {/* @ts-ignore */}
        <model-viewer
          src="/Photo du Site/porsche_911_c4s_2020_aerokit.glb"
          alt="Porsche 911 C4S Aerokit 2020"
          auto-rotate
          auto-rotate-delay="0"
          rotation-per-second="18deg"
          camera-controls
          shadow-intensity="1.2"
          shadow-softness="1"
          exposure="0.85"
          environment-image="neutral"
          loading="lazy"
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        />
      </div>

      <p className="text-center text-xs tracking-widest uppercase pb-12" style={{ color: "#1B3055" }}>
        Glisser pour pivoter · Pincer pour zoomer
      </p>
    </section>
  );
}
