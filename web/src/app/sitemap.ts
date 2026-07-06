import type { MetadataRoute } from "next";

import { getListings } from "@/lib/server/listings-store";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/autos`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/publicar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/planes`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let listingRoutes: MetadataRoute.Sitemap = [];

  try {
    const listings = await getListings();
    listingRoutes = listings.map((l) => ({
      url: `${SITE_URL}/autos/${l.id}`,
      lastModified: new Date(l.publishedAt ?? l.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Sin DB disponible el sitemap igual sirve las rutas estáticas.
  }

  return [...staticRoutes, ...listingRoutes];
}
