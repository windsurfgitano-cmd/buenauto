"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  title: string;
  images?: string[];
};

export function ListingGallery({ title, images }: Props) {
  const srcs = useMemo(() => {
    const list = Array.isArray(images) ? images.filter(Boolean) : [];
    return list.length > 0 ? list : ["/car-placeholder.svg"];
  }, [images]);

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, srcs.length - 1));
  const current = srcs[safeIndex] ?? "/car-placeholder.svg";

  function prev() {
    setIndex((i) => (i - 1 + srcs.length) % srcs.length);
  }

  function next() {
    setIndex((i) => (i + 1) % srcs.length);
  }

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-100 shadow-sm before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent dark:border-zinc-800/60 dark:bg-zinc-900 dark:before:via-white/15">
        <Image
          src={current}
          alt={title}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />

        {srcs.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              →
            </button>
          </>
        ) : null}

        {srcs.length > 1 ? (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {safeIndex + 1}/{srcs.length}
          </div>
        ) : null}
      </div>

      {srcs.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {srcs.map((src, i) => {
            const active = i === safeIndex;

            return (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={
                  active
                    ? "relative block w-24 shrink-0 overflow-hidden rounded-xl border-2 border-zinc-900 dark:border-white"
                    : "relative block w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
                }
                aria-current={active}
              >
                <span className="relative block aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={src}
                    alt={`${title} ${i + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
