"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import gsap from "gsap";

import { SearchForm } from "@/components/search/search-form";

type Props = {
  brands: string[];
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(Boolean(media.matches));

    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return reduced;
}

export function HomeHero({ brands }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const values = useMemo(() => ({ sort: "newest" as const }), []);

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
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
  }, [prefersReducedMotion]);

  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-emerald-200/60 via-sky-200/40 to-transparent blur-3xl dark:from-emerald-500/20 dark:via-sky-500/10" />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-fuchsia-200/40 via-amber-200/30 to-transparent blur-3xl dark:from-fuchsia-500/10 dark:via-amber-500/10" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div ref={rootRef} className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              BuenAuto · Marketplace Chile
            </p>
            <h1
              data-hero="headline"
              className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-5xl"
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
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm shadow-zinc-900/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Ver avisos
              </Link>
              <Link
                data-hero="cta"
                href="/publicar"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md dark:border-zinc-800 dark:bg-black dark:text-white dark:hover:bg-white/10"
              >
                Publicar mi auto
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span
                data-hero="chip"
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                Sin comisiones (MVP)
              </span>
              <span
                data-hero="chip"
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                Catálogo Chile 2000–2025
              </span>
              <span
                data-hero="chip"
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
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
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
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
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
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
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
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
