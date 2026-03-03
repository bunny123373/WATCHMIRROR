export type ContentType = "movie" | "series";

export interface CastMember {
  name: string;
  character: string;
  profileImage?: string;
}

export interface Episode {
  episodeNumber: number;
  episodeTitle: string;
  hlsLink?: string;
  embedIframeLink?: string;
  backupHlsLink?: string;
  backupEmbedIframeLink?: string;
  subtitleTracks?: SubtitleTrack[];
  releaseAt?: string;
  quality?: string;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Content {
  _id?: string;
  type: ContentType;
  title: string;
  slug: string;
  poster: string;
  banner: string;
  description: string;
  year: number;
  language: string;
  category: string;
  quality: string;
  rating: number;
  tags: string[];
  popularity: number;
  trailerEmbedUrl?: string;
  cast: CastMember[];
  metaTitle: string;
  metaDescription: string;
  hlsLink?: string;
  embedIframeLink?: string;
  backupHlsLink?: string;
  backupEmbedIframeLink?: string;
  subtitleTracks?: SubtitleTrack[];
  publishAt?: string;
  seasons?: Season[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubtitleTrack {
  label: string;
  lang: string;
  url: string;
  isDefault?: boolean;
}

export interface ContinueWatchingItem {
  slug: string;
  type: ContentType;
  title: string;
  poster: string;
  currentTime: number;
  duration: number;
  seasonNumber?: number;
  episodeNumber?: number;
  updatedAt: string;
}
