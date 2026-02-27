import { Container } from "@/components/ui/container";

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-20 rounded bg-zinc-900/10 dark:bg-white/10" />
      <div className="h-11 rounded-xl bg-zinc-900/10 dark:bg-white/10" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/60 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10">
      <div className="relative aspect-[16/10] w-full bg-zinc-900/10 dark:bg-white/10" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="h-4 w-3/4 rounded bg-zinc-900/10 dark:bg-white/10" />
            <div className="mt-2 h-3 w-2/3 rounded bg-zinc-900/10 dark:bg-white/10" />
          </div>
          <div className="h-4 w-16 rounded bg-zinc-900/10 dark:bg-white/10" />
        </div>
        <div className="mt-4 h-4 w-1/2 rounded bg-zinc-900/10 dark:bg-white/10" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <Container className="py-12">
      <div className="animate-pulse motion-reduce:animate-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-8 w-56 rounded-xl bg-zinc-900/10 dark:bg-white/10" />
            <div className="mt-2 h-4 w-48 rounded-lg bg-zinc-900/10 dark:bg-white/10" />
          </div>
          <div className="h-4 w-28 rounded-lg bg-zinc-900/10 dark:bg-white/10" />
        </div>

        <div className="relative mt-6 rounded-2xl border border-zinc-200/60 bg-white/60 p-4 shadow-sm backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-zinc-900/10 before:to-transparent dark:border-zinc-800/60 dark:bg-black/30 dark:before:via-white/10">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="flex items-end lg:col-span-2">
              <div className="h-11 w-full rounded-xl bg-zinc-900/10 dark:bg-white/10" />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="h-4 w-32 rounded bg-zinc-900/10 dark:bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 rounded-xl bg-zinc-900/10 dark:bg-white/10" />
            <div className="h-10 w-28 rounded-xl bg-zinc-900/10 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </Container>
  );
}
