import "server-only";

import { query } from "@/lib/server/db";
import { POINTS, type PointAction } from "@/lib/turbo/points";

/** Inserta en el ledger. Devuelve true si fue fila nueva (idempotente por user+action+ref). */
export async function addLedger(
  userId: string,
  action: string,
  points: number,
  ref: string,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `INSERT INTO turbo_points (user_id, action, points, ref)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, action, ref) DO NOTHING
     RETURNING id`,
    [userId, action, points, ref],
  );
  return rows.length > 0;
}

export async function awardPoints(
  userId: string,
  action: Exclude<PointAction, "redeem">,
  ref: string,
): Promise<boolean> {
  return addLedger(userId, action, POINTS[action], ref);
}

export async function pointsBalance(userId: string): Promise<number> {
  const rows = await query<{ total: number }>(
    `SELECT COALESCE(SUM(points), 0)::int AS total FROM turbo_points WHERE user_id = $1`,
    [userId],
  );
  return rows[0]?.total ?? 0;
}

/** Cuántos anuncios rewarded otorgó hoy este usuario (para el tope diario). */
export async function countRewardedToday(userId: string): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM turbo_points
     WHERE user_id = $1 AND action = 'rewarded' AND created_at >= date_trunc('day', now())`,
    [userId],
  );
  return rows[0]?.n ?? 0;
}
