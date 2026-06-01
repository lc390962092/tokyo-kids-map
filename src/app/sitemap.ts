import type { MetadataRoute } from "next";
import { getPlaceRepository } from "@/lib/repositories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tokyo-kids-map.vercel.app";
  const places = await getPlaceRepository().findAll();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...places.map((place) => ({
      url: `${baseUrl}/place/${place.id}`,
      lastModified: place.updatedAt ? new Date(place.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
