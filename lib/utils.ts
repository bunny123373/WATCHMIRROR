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

export const VID_SRC_BASE = "https://vidsrc-embed.ru/embed";

export function getVidsrcMovieEmbed(tmdbId?: string, imdbId?: string, options?: { ds_lang?: string; sub_url?: string; autoplay?: boolean }): string {
  if (imdbId) {
    let url = `${VID_SRC_BASE}/movie?imdb=${imdbId}`;
    if (options?.ds_lang) url += `&ds_lang=${options.ds_lang}`;
    if (options?.sub_url) url += `&sub_url=${encodeURIComponent(options.sub_url)}`;
    if (options?.autoplay === false) url += `&autoplay=0`;
    return url;
  }
  if (tmdbId) {
    let url = `${VID_SRC_BASE}/movie?tmdb=${tmdbId}`;
    if (options?.ds_lang) url += `&ds_lang=${options.ds_lang}`;
    if (options?.sub_url) url += `&sub_url=${encodeURIComponent(options.sub_url)}`;
    if (options?.autoplay === false) url += `&autoplay=0`;
    return url;
  }
  return "";
}

export function getVidsrcTvEmbed(tmdbId?: string, imdbId?: string, options?: { ds_lang?: string }): string {
  if (imdbId) {
    let url = `${VID_SRC_BASE}/tv?imdb=${imdbId}`;
    if (options?.ds_lang) url += `&ds_lang=${options.ds_lang}`;
    return url;
  }
  if (tmdbId) {
    let url = `${VID_SRC_BASE}/tv?tmdb=${tmdbId}`;
    if (options?.ds_lang) url += `&ds_lang=${options.ds_lang}`;
    return url;
  }
  return "";
}

export function getVidsrcEpisodeEmbed(
  season: number,
  episode: number,
  tmdbId?: string,
  imdbId?: string,
  options?: { ds_lang?: string; sub_url?: string; autoplay?: boolean; autonext?: boolean }
): string {
  const seasonEp = `${season}-${episode}`;
  
  if (imdbId) {
    let url = `${VID_SRC_BASE}/tv/${imdbId}/${seasonEp}`;
    const params = new URLSearchParams();
    if (options?.ds_lang) params.append("ds_lang", options.ds_lang);
    if (options?.sub_url) params.append("sub_url", options.sub_url);
    if (options?.autoplay === false) params.append("autoplay", "0");
    if (options?.autonext) params.append("autonext", "1");
    const query = params.toString();
    return query ? `${url}?${query}` : url;
  }
  if (tmdbId) {
    let url = `${VID_SRC_BASE}/tv/${tmdbId}/${seasonEp}`;
    const params = new URLSearchParams();
    if (options?.ds_lang) params.append("ds_lang", options.ds_lang);
    if (options?.sub_url) params.append("sub_url", options.sub_url);
    if (options?.autoplay === false) params.append("autoplay", "0");
    if (options?.autonext) params.append("autonext", "1");
    const query = params.toString();
    return query ? `${url}?${query}` : url;
  }
  return "";
}