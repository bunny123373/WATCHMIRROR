import { ContentType } from "@/types/content";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function toYouTubeEmbed(videos: { key: string; site: string; type: string }[]): string {
  const trailer = videos.find((item) => item.site === "YouTube" && item.type === "Trailer");
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : "";
}

export function typeFromTMDB(mediaType: string): ContentType {
  return mediaType === "tv" ? "series" : "movie";
}