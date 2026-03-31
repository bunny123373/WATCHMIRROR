export type ContentType = "movie" | "series";

export interface CastMember {
  name: string;
  character: string;
  profileImage?: string;
}

export interface Episode {
  episodeNumber: number;
  episodeTitle: string;
  tmdbId?: string;
  imdbId?: string;
  hlsLink?: string;
  embedIframeLink?: string;
  backupHlsLink?: string;
  backupEmbedIframeLink?: string;
  subtitleTracks?: SubtitleTrack[];
  videoSources?: VideoSource[];
  releaseAt?: string;
  quality?: string;
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
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
  audioLanguages: string[];
  category: string;
  quality: string;
  rating: number;
  tags: string[];
  popularity: number;
  trailerEmbedUrl?: string;
  cast: CastMember[];
  metaTitle: string;
  metaDescription: string;
  tmdbId?: string;
  imdbId?: string;
  hlsLink?: string;
  embedIframeLink?: string;
  backupHlsLink?: string;
  backupEmbedIframeLink?: string;
  subtitleTracks?: SubtitleTrack[];
  videoSources?: VideoSource[];
  downloadLink?: string;
  publishAt?: string;
  seasons?: Season[];
  createdAt?: string;
  updatedAt?: string;
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
}

export interface SubtitleTrack {
  label: string;
  lang: string;
  url: string;
  isDefault?: boolean;
}

export interface VideoSource {
  language: string;
  languageLabel: string;
  hlsLink?: string;
  mp4Link?: string;
  embedLink?: string;
  quality?: string;
  isPrimary?: boolean;
  subtitleTracks?: SubtitleTrack[];
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

export interface MyListItem {
  slug: string;
  type: ContentType;
  title: string;
  poster: string;
  year: number;
  rating: number;
  quality: string;
}
