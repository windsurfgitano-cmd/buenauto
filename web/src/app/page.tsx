import { getCurrentUser } from "@/lib/server/session";
import { getFeedListings } from "@/lib/turbo/feed-store";
import { pointsBalance } from "@/lib/turbo/points-store";
import { FeedClient } from "@/components/turbo/feed-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// La portada ES la experiencia TURBO: el feed de autos, visible sin login.
export default async function Home() {
  const user = await getCurrentUser();

  const [listings, points] = await Promise.all([
    getFeedListings(user ? { id: user.id, favorites: user.favorites } : null),
    user ? pointsBalance(user.id) : Promise.resolve(0),
  ]);

  return <FeedClient initialListings={listings} initialPoints={points} isLoggedIn={!!user} />;
}
