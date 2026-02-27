"use client";

import { useLayoutEffect } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  rootId: string;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RevealAnimations({ rootId }: Props) {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const root = document.getElementById(rootId);
    if (!root) return;

    const ctx = gsap.context(() => {
      const fadeUps = gsap.utils.toArray<HTMLElement>("[data-anim='fade-up']");

      for (const el of fadeUps) {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 12, filter: "blur(8px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "power3.out",
            clearProps: "filter",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          },
        );
      }

      const groups = gsap.utils.toArray<HTMLElement>("[data-anim-stagger]");

      for (const group of groups) {
        const items = group.querySelectorAll<HTMLElement>("[data-anim-item]");
        if (items.length === 0) continue;

        gsap.fromTo(
          items,
          { autoAlpha: 0, y: 14, filter: "blur(10px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.95,
            ease: "power3.out",
            stagger: 0.07,
            clearProps: "filter",
            scrollTrigger: {
              trigger: group,
              start: "top 80%",
              once: true,
            },
          },
        );
      }
    }, root);

    return () => ctx.revert();
  }, [rootId]);

  return null;
}
