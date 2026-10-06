"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | undefined;
    let generation = 0;

    const sync = async () => {
      const current = ++generation;
      instance?.destroy();
      instance = undefined;

      if (!desktop.matches || reducedMotion.matches) return;

      const { default: Lenis } = await import("lenis");
      if (current !== generation) return;

      instance = new Lenis({
        autoRaf: true,
        anchors: false,
        stopInertiaOnNavigate: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.16,
      });
    };

    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const hash = anchor.hash;
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      if (location.hash !== hash) history.pushState(history.state, "", hash);
      target.focus({ preventScroll: true });
      const offset = -(parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      if (instance && !reducedMotion.matches) {
        instance.scrollTo(target, { offset, duration: 0.8 });
      } else {
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY + offset,
          behavior: reducedMotion.matches ? "instant" : "smooth",
        });
      }
    };

    const update = () => { void sync(); };
    update();
    desktop.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("click", onAnchorClick);

    return () => {
      ++generation;
      instance?.destroy();
      desktop.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("click", onAnchorClick);
    };
  }, []);

  return null;
}
