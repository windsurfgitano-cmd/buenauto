import { formatPoints } from "@/lib/turbo/points";

export function PointsBadge({ points, className = "" }: { points: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-racing/40 bg-racing/10 px-2.5 py-1 font-mono text-sm font-bold text-racing-bright tabular-nums ${className}`}
      title="Tus puntos TURBO"
    >
      <span aria-hidden>🔥</span>
      {formatPoints(points)}
      <span className="text-[10px] font-semibold text-racing/80">pts</span>
    </span>
  );
}
