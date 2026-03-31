import type { MetadataRoute } from "next";
import { getAllContent } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://watchmirror.vercel.app";
  const items = await getAllContent();

  const dynamicRoutes = items.map((item) => ({
    url: `${base}/${item.type === "movie" ? "movie" : "series"}/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/movies`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/series`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/trending`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    ...dynamicRoutes
  ];
}