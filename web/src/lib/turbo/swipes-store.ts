import "server-only";

import { query } from "@/lib/server/db";

export async function recordSwipe(
  userId: string,
  listingId: string,
  direction: "like" | "pass",
): Promise<void> {
  await query(
    `INSERT INTO turbo_swipes (user_id, listing_id, direction)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, listing_id)
     DO UPDATE SET direction = EXCLUDED.direction, created_at = now()`,
    [userId, listingId, direction],
  );
}

export async function getSwipedIds(userId: string): Promise<string[]> {
  const rows = await query<{ listing_id: string }>(
    `SELECT listing_id FROM turbo_swipes WHERE user_id = $1`,
    [userId],
  );
  return rows.map((r) => r.listing_id);
}
