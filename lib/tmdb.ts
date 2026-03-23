import { Content } from "@/types/content";
import { slugify, toYouTubeEmbed, typeFromTMDB } from "@/lib/utils";

const baseImage = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/original";

interface TMDBSearchResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("Missing TMDB_API_KEY");

  const res = await fetch(`https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}api_key=${key}`, {
    next: { revalidate: 3600 }
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function searchTMDB(query: string) {
  const data = await tmdbFetch<{ results: TMDBSearchResult[] }>(`/search/multi?query=${encodeURIComponent(query)}`);

  return data.results
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 20)
    .map((item) => ({
      id: item.id,
      mediaType: item.media_type,
      title: item.title || item.name || "Untitled",
      year: Number((item.release_date || item.first_air_date || "").slice(0, 4)) || null,
      rating: item.vote_average || 0,
      popularity: item.popularity || 0,
      poster: item.poster_path ? `${baseImage}${item.poster_path}` : "",
      banner: item.backdrop_path ? `${baseImage}${item.backdrop_path}` : ""
    }));
}

export async function getTMDBDetails(id: string, mediaType: "movie" | "tv"): Promise<Partial<Content>> {
  const [details, videos, credits] = await Promise.all([
    tmdbFetch<any>(`/${mediaType}/${id}`),
    tmdbFetch<{ results: { key: string; site: string; type: string }[] }>(`/${mediaType}/${id}/videos`),
    tmdbFetch<{ cast: { name: string; character: string; profile_path?: string }[] }>(`/${mediaType}/${id}/credits`)
  ]);

  const title = details.title || details.name || "Untitled";
  const releaseDate = details.release_date || details.first_air_date || "";
  const year = Number(releaseDate.slice(0, 4)) || new Date().getFullYear();
  const genres = (details.genres || []).map((item: { name: string }) => item.name);
  const type = typeFromTMDB(mediaType);
  const rating = Number(details.vote_average || 0);
  const popularity = Number(details.popularity || 0);

  return {
    type,
    title,
    slug: slugify(title),
    poster: details.poster_path ? `${baseImage}${details.poster_path}` : "",
    banner: details.backdrop_path ? `${baseImage}${details.backdrop_path}` : "",
    description: details.overview || "No description available.",
    year,
    language: (details.original_language || "en").toUpperCase(),
    category: popularity > 100 || rating > 7.5 ? "Trending" : "Latest",
    quality: "HD",
    rating,
    tags: genres,
    popularity,
    trailerEmbedUrl: toYouTubeEmbed(videos.results || []),
    cast: (credits.cast || []).slice(0, 8).map((item) => ({
      name: item.name,
      character: item.character || "Unknown",
      profileImage: item.profile_path ? `${baseImage}${item.profile_path}` : ""
    })),
    metaTitle: `${title} (${year})`,
    metaDescription: (details.overview || `${title} streaming on WATCHMIRROR.`).slice(0, 155),
    tmdbId: String(id),
    imdbId: details.imdb_id || undefined,
    seasons:
      type === "series"
        ? Array.from({ length: Number(details.number_of_seasons || 1) }).map((_, index) => ({
            seasonNumber: index + 1,
            episodes: []
          }))
        : undefined
  };
}

export async function getTMDBSimilar(id: string, mediaType: "movie" | "tv") {
  const data = await tmdbFetch<{ results: TMDBSearchResult[] }>(`/${mediaType}/${id}/similar`);
  return data.results.slice(0, 12).map((item) => ({
    id: item.id,
    mediaType: item.media_type || mediaType,
    title: item.title || item.name || "Untitled",
    poster: item.poster_path ? `${baseImage}${item.poster_path}` : "",
    banner: item.backdrop_path ? `${baseImage}${item.backdrop_path}` : "",
    rating: item.vote_average || 0,
    popularity: item.popularity || 0,
    year: Number((item.release_date || item.first_air_date || "").slice(0, 4)) || null
  }));
}

export interface TMDBSeason {
  seasonNumber: number;
  seasonName: string;
  episodeCount: number;
  airDate: string;
  overview: string;
  poster: string;
}

export interface TMBDEpisode {
  episodeNumber: number;
  episodeTitle: string;
  airDate: string;
  overview: string;
  stillPath: string;
  tmdbId: string;
}

export async function getTMDBSeasons(tmdbId: string): Promise<TMDBSeason[]> {
  const details = await tmdbFetch<any>(`/tv/${tmdbId}`);
  return (details.seasons || [])
    .filter((s: any) => s.season_number > 0)
    .map((s: any) => ({
      seasonNumber: s.season_number,
      seasonName: s.name || `Season ${s.season_number}`,
      episodeCount: s.episode_count,
      airDate: s.air_date || "",
      overview: s.overview || "",
      poster: s.poster_path ? `${baseImage}${s.poster_path}` : ""
    }));
}

export async function getTMDBSeasonEpisodes(tmdbId: string, seasonNumber: number): Promise<TMBDEpisode[]> {
  const data = await tmdbFetch<any>(`/tv/${tmdbId}/season/${seasonNumber}`);
  return (data.episodes || []).map((ep: any) => ({
    episodeNumber: ep.episode_number,
    episodeTitle: ep.name || `Episode ${ep.episode_number}`,
    airDate: ep.air_date || "",
    overview: ep.overview || "",
    stillPath: ep.still_path ? `${baseImage}${ep.still_path}` : "",
    tmdbId: String(ep.id)
  }));
}