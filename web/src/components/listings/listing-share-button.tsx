"use client";

import { useState } from "react";

type Props = {
  title: string;
  className?: string;
};

export function ListingShareButton({ title, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      window.prompt("Copia este link", url);
    }
  }

  async function onShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `BuenAuto - ${title}`,
          text: `Mira este auto: ${title}`,
          url,
        });
        return;
      }
    } catch {
      // User cancelled share dialog or share not supported - fall through to copy
    }

    await copy(url);
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={
        className ??
        "inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 px-4 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:border-zinc-800/70 dark:bg-black/40 dark:text-white dark:hover:bg-black/55 dark:focus-visible:ring-white/10"
      }
    >
      {copied ? "Copiado" : "Compartir"}
    </button>
  );
}
