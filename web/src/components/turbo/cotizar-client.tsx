"use client";

import Link from "next/link";
import { useState } from "react";

import type { Listing } from "@/lib/types";
import { PointsBadge } from "./points-badge";
import { QuotePanel } from "./quote-panel";

// Página /cotizar/[id]: la "plataforma completa" del cotizador (deep-link,
// compartir, SEO). Dentro del feed se usa el mismo QuotePanel en un bottom-sheet.
export function CotizarClient({
  listing,
  initialPoints,
  prefill,
}: {
  listing: Listing;
  initialPoints: number;
  prefill: { name: string; email: string };
}) {
  const [points, setPoints] = useState(initialPoints);

  return (
    <div className="turbo-scope min-h-dvh bg-carbon px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-mutedwhite hover:text-paper">
            ← Volver al feed
          </Link>
          <PointsBadge points={points} />
        </div>
        <div className="mt-3">
          <QuotePanel
            listing={listing}
            initialPoints={initialPoints}
            prefill={prefill}
            variant="page"
            onPointsChange={setPoints}
          />
        </div>
      </div>
    </div>
  );
}
