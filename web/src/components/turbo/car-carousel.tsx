"use client";

import { useCallback, useRef, useState } from "react";

// Carrusel de fotos que se navega por TAP (izquierda = anterior, derecha =
// siguiente) + flechas en escritorio. El tap no compite con el scroll vertical
// del feed. También conserva el arrastre horizontal donde el navegador lo permite.
export function CarCarousel({
  images,
  alt,
  className = "",
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const pics = images.length > 0 ? images : ["/car-placeholder.svg"];
  const many = pics.length > 1;

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      const n = pics.length;
      const idx = ((i % n) + n) % n; // circular
      el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
      setActive(idx);
    },
    [pics.length],
  );

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (idx !== prev ? idx : prev));
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
      >
        {pics.map((src, i) => (
          <div key={i} className="relative h-full w-full flex-[0_0_100%] snap-center bg-carbon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {many && (
        <>
          {/* Zonas de tap (parte superior, sin tapar los botones de abajo) */}
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={() => goTo(active - 1)}
            className="absolute left-0 top-0 z-20 h-[60%] w-1/3"
          />
          <button
            type="button"
            aria-label="Foto siguiente"
            onClick={() => goTo(active + 1)}
            className="absolute right-0 top-0 z-20 h-[60%] w-2/3"
          />

          {/* Flechas (escritorio) */}
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => goTo(active - 1)}
            className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/45 px-3 py-1.5 text-xl leading-none text-white backdrop-blur transition-colors hover:bg-black/70 sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => goTo(active + 1)}
            className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/45 px-3 py-1.5 text-xl leading-none text-white backdrop-blur transition-colors hover:bg-black/70 sm:flex"
          >
            ›
          </button>

          {/* Puntos indicadores */}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center gap-1.5 px-6">
            {pics.map((_, i) => (
              <span
                key={i}
                className={`h-[3px] flex-1 rounded-full ${i === active ? "bg-racing" : "bg-white/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
