import { Container } from "@/components/ui/container";

function Line({ className }: { className: string }) {
  return (
    <div className={`rounded bg-zinc-900/10 dark:bg-white/10 ${className}`} />
  );
}

function SpecCard({ className }: { className?: string }) {
  return (
    <div
      className={`relative rounded-xl border border-zinc-200/60 bg-white/60 p-3 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10 ${
        className ?? ""
      }`}
    >
      <Line className="h-3 w-16" />
      <Line className="mt-2 h-4 w-24" />
    </div>
  );
}

export default function Loading() {
  return (
    <Container className="pt-12 pb-28 sm:py-12">
      <div className="animate-pulse motion-reduce:animate-none">
        <Line className="h-4 w-44" />

        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-900/10 shadow-sm before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent dark:border-zinc-800/60 dark:bg-white/10 dark:before:via-white/15" />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200/60 bg-zinc-900/10 dark:border-zinc-800/60 dark:bg-white/10"
                />
              ))}
            </div>
          </div>

          <div>
            <Line className="h-9 w-72" />
            <Line className="mt-3 h-8 w-40" />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Line className="h-11 w-28 rounded-xl" />
              <Line className="h-11 w-28 rounded-xl" />
              <Line className="h-11 w-28 rounded-xl" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <SpecCard />
              <SpecCard />
              <SpecCard />
              <SpecCard />
              <SpecCard className="col-span-2" />
            </div>

            <div className="relative mt-6 rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10">
              <Line className="h-4 w-28" />
              <Line className="mt-3 h-3 w-full" />
              <Line className="mt-2 h-3 w-5/6" />
              <Line className="mt-2 h-3 w-4/6" />
            </div>

            <div className="relative mt-6 rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10">
              <Line className="h-4 w-28" />
              <Line className="mt-3 h-3 w-44" />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Line className="h-11 w-full rounded-xl" />
                <Line className="h-11 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
