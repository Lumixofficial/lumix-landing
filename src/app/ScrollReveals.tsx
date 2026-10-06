"use client";

import { useLayoutEffect } from "react";

export default function ScrollReveals() {
  useLayoutEffect(() => {
    const groups = [...document.querySelectorAll<HTMLElement>("[data-reveal-group]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const showAll = () => groups.forEach((group) => { group.dataset.revealState = "visible"; });

    if (reducedMotion.matches || !window.IntersectionObserver) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        const group = target as HTMLElement;
        if (group.dataset.revealState === "pending") group.dataset.revealState = "revealed";
        observer.unobserve(group);
      }
    }, { threshold: 0, rootMargin: "0px 0px 24px 0px" });

    for (const group of groups) {
      if (!group.dataset.revealState) {
        const items = group.matches("[data-reveal-item]")
          ? [group]
          : [...group.querySelectorAll<HTMLElement>("[data-reveal-item]")];
        items.forEach((item, index) => item.style.setProperty("--reveal-delay", `${Math.min(index * 40, 120)}ms`));
        // SSR content stays visible. Only prepare text that has not entered the
        // viewport; hydration must never hide text the visitor can already see.
        group.dataset.revealState = group.getBoundingClientRect().top > window.innerHeight + 24
          ? "pending"
          : "visible";
      }
      if (group.dataset.revealState === "pending") observer.observe(group);
    }

    const onMotionChange = () => {
      if (!reducedMotion.matches) return;
      observer.disconnect();
      showAll();
    };
    reducedMotion.addEventListener("change", onMotionChange);
    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", onMotionChange);
      // Preserve terminal states across effect restarts; never reset a reveal.
    };
  }, []);

  return null;
}
