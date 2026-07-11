"use client";

import { useRef, useState } from "react";

// Carrusel horizontal con scroll-snap (sin dependencias). Muestra puntos de posición.
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

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  }

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

      {pics.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center gap-1.5 px-6">
          {pics.map((_, i) => (
            <span
              key={i}
              className={`h-[3px] flex-1 rounded-full ${i === active ? "bg-racing" : "bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
