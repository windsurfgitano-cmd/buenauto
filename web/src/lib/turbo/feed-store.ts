import "server-only";

import { getListings } from "@/lib/server/listings-store";
import type { Listing } from "@/lib/types";
import { getSwipedIds } from "./swipes-store";

export type FeedItem = Listing & { liked: boolean };

const FEED_LIMIT = 60;

/** Avisos publicados para el feed: excluye los que el usuario ya deslizó y marca los favoritos. */
export async function getFeedListings(
  user: { id: string; favorites: string[] } | null,
): Promise<FeedItem[]> {
  const listings = await getListings();

  if (!user) {
    return listings.slice(0, FEED_LIMIT).map((l) => ({ ...l, liked: false }));
  }

  const swiped = new Set(await getSwipedIds(user.id));
  const favs = new Set(user.favorites);

  return listings
    .filter((l) => !swiped.has(l.id))
    .slice(0, FEED_LIMIT)
    .map((l) => ({ ...l, liked: favs.has(l.id) }));
}
