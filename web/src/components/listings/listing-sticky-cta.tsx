"use client";

import { useState } from "react";

type Props = {
  title: string;
  phone?: string;
  whatsappHref?: string;
};

export function ListingStickyCta({ title, phone, whatsappHref }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const url = window.location.href;

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

    await onCopy();
  }

  const showContact = Boolean(phone || whatsappHref);

  if (!showContact) return null;

  const cols = phone && whatsappHref ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/60 bg-white/80 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-black/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-900/10 to-transparent dark:via-white/10" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-[env(safe-area-inset-bottom)] pt-3 sm:px-6 lg:px-10">
        <div className={`grid gap-2 ${cols}`}>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-3 text-xs font-semibold tracking-[0.18em] uppercase text-white shadow-sm shadow-zinc-900/10 transition active:scale-[0.98] dark:bg-white dark:text-black"
            >
              Llamar
            </a>
          ) : null}

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-white px-3 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition active:scale-[0.98] dark:border-zinc-800/70 dark:bg-black dark:text-white"
            >
              WhatsApp
            </a>
          ) : null}

          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-white px-3 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-900 shadow-sm transition active:scale-[0.98] dark:border-zinc-800/70 dark:bg-black dark:text-white"
          >
            {copied ? "Copiado" : "Compartir"}
          </button>
        </div>
      </div>
    </div>
  );
}
