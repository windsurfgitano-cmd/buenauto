import Link from "next/link";

import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-zinc-200/60 bg-white/40 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-black/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-900/10 to-transparent dark:via-white/10" />
      <Container className="flex flex-col gap-4 py-10 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-600/80 dark:text-zinc-400/80">
          © {new Date().getFullYear()} BuenAuto
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/autos"
            className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Autos
          </Link>
          <Link
            href="/publicar"
            className="rounded-full px-3 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-zinc-700/80 transition hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-200/80 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Publicar
          </Link>
        </div>
      </Container>
    </footer>
  );
}
