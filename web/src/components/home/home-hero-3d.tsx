"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef } from "react";

import gsap from "gsap";

import { SearchForm } from "@/components/search/search-form";
import { HeroThreeBg } from "@/components/home/hero-three-bg";

type Props = {
  brands: string[];
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HomeHero3D({ brands }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const values = useMemo(() => ({ sort: "newest" as const }), []);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const headline = root.querySelector("[data-hero='headline']");
      const sub = root.querySelector("[data-hero='sub']");
      const ctas = root.querySelectorAll("[data-hero='cta']");
      const search = root.querySelector("[data-hero='search']");
      const chips = root.querySelectorAll("[data-hero='chip']");

      gsap.set([headline, sub, ctas, search, chips], {
        autoAlpha: 0,
        y: 14,
      });

      const tl = gsap.timeline({
        defaults: { duration: 0.8, ease: "power3.out" },
      });

      tl.to(headline, { autoAlpha: 1, y: 0 })
        .to(sub, { autoAlpha: 1, y: 0 }, "<0.12")
        .to(ctas, { autoAlpha: 1, y: 0, stagger: 0.08 }, "<0.12")
        .to(search, { autoAlpha: 1, y: 0 }, "<0.12")
        .to(chips, { autoAlpha: 1, y: 0, stagger: 0.06 }, "<0.12");
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-zinc-200/60 via-zinc-100/30 to-transparent blur-3xl dark:from-white/10 dark:via-white/5" />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-rose-200/35 via-zinc-100/25 to-transparent blur-3xl dark:from-rose-500/10 dark:via-white/5" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-80">
        <HeroThreeBg />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div ref={rootRef} className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-600/80 dark:text-zinc-300/80">
              BuenAuto · Marketplace Chile
            </p>
            <h1
              data-hero="headline"
              className="mt-3 text-5xl font-semibold leading-[0.95] tracking-tight text-zinc-900 dark:text-white sm:text-6xl"
            >
              Vende tu auto rápido y compra seguro
            </h1>
            <p data-hero="sub" className="mt-4 text-base text-zinc-600 dark:text-zinc-300">
              Publica en minutos. Filtra por marca, modelo y región. Guarda favoritos y
              administra tus avisos.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                data-hero="cta"
                href="/autos"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white/10"
              >
                Ver avisos
              </Link>
              <Link
                data-hero="cta"
                href="/publicar"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-5 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55 dark:focus-visible:ring-white/10"
              >
                Publicar mi auto
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span
                data-hero="chip"
                className="relative rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/70 dark:bg-black/30 dark:text-zinc-200 dark:before:via-white/10"
              >
                Sin comisiones (MVP)
              </span>
              <span
                data-hero="chip"
                className="relative rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/70 dark:bg-black/30 dark:text-zinc-200 dark:before:via-white/10"
              >
                Catálogo Chile 2000–2025
              </span>
              <span
                data-hero="chip"
                className="relative rounded-full border border-zinc-200/70 bg-white/60 px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/70 dark:bg-black/30 dark:text-zinc-200 dark:before:via-white/10"
              >
                Favoritos + Mis avisos
              </span>
            </div>
          </div>

          <div className="lg:col-span-6" data-hero="search">
            <div className="relative">
              <SearchForm brands={brands} showAdvanced={false} values={values} />
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
                Tip: escribe “Corolla 2017” o filtra por región.
              </p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div
                data-hero="chip"
                className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Publica
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  en 2 minutos
                </p>
              </div>
              <div
                data-hero="chip"
                className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Revisa
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  favoritos
                </p>
              </div>
              <div
                data-hero="chip"
                className="relative rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10"
              >
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Administra
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                  tus avisos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
