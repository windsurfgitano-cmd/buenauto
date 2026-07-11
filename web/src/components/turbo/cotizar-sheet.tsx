"use client";

import { useEffect } from "react";

import type { Listing } from "@/lib/types";
import { QuotePanel } from "./quote-panel";

// Bottom-sheet que abre el cotizador SOBRE el feed, sin navegar a otra página.
// Así el journey gamificado (descubrir → cotizar → enviar) se resuelve dentro
// del feed; la página /cotizar y la ficha /autos quedan como salida secundaria.
export function CotizarSheet({
  listing,
  initialPoints,
  prefill,
  onClose,
  onPointsChange,
}: {
  listing: Listing;
  initialPoints: number;
  prefill: { name: string; email: string };
  onClose: () => void;
  onPointsChange: (balance: number) => void;
}) {
  // Bloquea el scroll del feed y cierra con Escape. Capturamos el evento antes
  // que el handler de flechas del feed para que Escape no lo dispare.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="turbo-scope fixed inset-0 z-[60] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Cotizar ${listing.brand} ${listing.model}`}
    >
      {/* Backdrop: cierra al tocar fuera */}
      <button
        type="button"
        aria-label="Cerrar cotizador"
        onClick={onClose}
        className="turbo-sheet-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="turbo-sheet no-scrollbar relative z-10 max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-edge bg-carbon">
        {/* Barra fija del sheet */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-edge bg-carbon/95 px-4 py-3 backdrop-blur">
          <span className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-racing-bright">
            <span aria-hidden>🔥</span> Cotiza sin salir del feed
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full border border-edge px-3 py-1 text-sm font-bold text-paper transition-colors hover:border-mutedwhite"
          >
            ✕
          </button>
        </div>

        {/* Asa visual */}
        <div className="pointer-events-none flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-edge" />
        </div>

        <div className="px-4 pb-10 pt-3">
          <QuotePanel
            listing={listing}
            initialPoints={initialPoints}
            prefill={prefill}
            variant="sheet"
            onClose={onClose}
            onPointsChange={onPointsChange}
          />
        </div>
      </div>
    </div>
  );
}
