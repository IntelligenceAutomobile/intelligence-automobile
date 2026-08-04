"use client";

// Mesure d'audience : signale la page ouverte, puis disparaît. Le composant ne
// rend rien et ne retarde rien.
//
// Il est monté par <Header/>, donc présent sur les pages publiques et sur elles
// seules : le back-office et la vitrine de démonstration affichent leur propre
// en-tête et restent hors du comptage.
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function MesureVisite() {
  const pathname = usePathname();
  // React monte deux fois les effets en développement : sans ce repère, chaque
  // page compterait double sur le poste local.
  const dejaSignalee = useRef("");

  useEffect(() => {
    if (dejaSignalee.current === pathname) return;
    dejaSignalee.current = pathname;

    const corps = JSON.stringify({
      path: pathname,
      referrer: document.referrer,
      // Le marqueur se lit dans l'adresse d'arrivée. window.location évite
      // useSearchParams, qui imposerait une frontière <Suspense> à chaque page.
      src: new URLSearchParams(window.location.search).get("src") ?? "",
    });

    // sendBeacon survit à la fermeture de l'onglet : le visiteur qui repart
    // aussitôt, exactement le clic depuis une annonce, est compté quand même.
    try {
      if (navigator.sendBeacon("/api/mesure", corps)) return;
    } catch {
      // Le repli ci-dessous prend la suite.
    }
    fetch("/api/mesure", { method: "POST", body: corps, keepalive: true }).catch(() => {});
  }, [pathname]);

  return null;
}
