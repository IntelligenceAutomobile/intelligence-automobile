"use client";

export default function HeroCta() {
  return (
    <button
      onClick={() =>
        document
          .getElementById("vehicules-list")
          ?.scrollIntoView({ behavior: "smooth" })
      }
      style={{
        backgroundColor: "#F0F5FF",
        color: "#070F1E",
        padding: "11px 26px",
        border: "none",
        borderRadius: 0,
        fontWeight: 700,
        fontSize: "0.8rem",
        letterSpacing: "0.04em",
        cursor: "pointer",
      }}
    >
      Voir le stock →
    </button>
  );
}
