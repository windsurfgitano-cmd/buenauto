"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const SEEN_KEY = "turbo_swipe_coach_seen";

// Suscripción vacía: el flag solo lo cambia este componente (vía estado local).
const subscribe = () => () => {};
function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // sin almacenamiento: no molestamos con el coach
  }
}

// Overlay de una sola vez que enseña los gestos del feed:
//   ↕ deslizar para cambiar de auto   ·   ↔ deslizar para ver más fotos.
// Se auto-oculta a los 5s y recuerda (localStorage) que ya se mostró. Usa
// useSyncExternalStore para leer localStorage sin romper la hidratación
// (el servidor renderiza "ya visto" → nada).
export function SwipeCoach() {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  const [dismissed, setDismissed] = useState(false);
  const show = !seen && !dismissed;

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* almacenamiento no disponible */
    }
    setDismissed(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, [show, dismiss]);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={dismiss}
      aria-label="Entendido"
      className="turbo-sheet-backdrop fixed inset-0 z-[55] flex flex-col items-center justify-center gap-10 bg-black/75 px-8 text-center backdrop-blur-sm"
    >
      {/* Gesto vertical */}
      <div className="flex flex-col items-center gap-2">
        <span className="turbo-nudge-y text-4xl leading-none">👆</span>
        <div className="flex flex-col items-center leading-tight text-paper">
          <span className="text-2xl">↑↓</span>
          <span className="mt-1 text-base font-bold">Desliza para cambiar de auto</span>
        </div>
      </div>

      {/* Gesto horizontal */}
      <div className="flex flex-col items-center gap-2">
        <span className="turbo-nudge-x text-4xl leading-none">👆</span>
        <div className="flex flex-col items-center leading-tight text-paper">
          <span className="text-2xl">← →</span>
          <span className="mt-1 text-base font-bold">Desliza (o toca los lados) para ver más fotos</span>
        </div>
      </div>

      <span className="mt-2 rounded-full bg-racing px-6 py-3 text-base font-extrabold text-white">
        Entendido 🔥
      </span>
      <span className="text-xs uppercase tracking-widest text-white/50">toca para continuar</span>
    </button>
  );
}
