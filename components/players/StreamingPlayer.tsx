"use client";

import { useState, useMemo } from "react";
import { VideoPlayer } from "@/components/players/VideoPlayer";
import IframePlayer from "@/components/players/IframePlayer";
import { ContentType, SubtitleTrack, VideoSource } from "@/types/content";
import { Globe } from "lucide-react";

type SourceType = "hls" | "iframe";

interface StreamingSource {
  type: SourceType;
  url: string;
  label: string;
  language?: string;
}

interface StreamingPlayerProps {
  type: ContentType;
  slug: string;
  title: string;
  poster: string;
  tmdbId?: string;
  imdbId?: string;
  hlsLink?: string;
  embedIframeLink?: string;
  backupHlsLink?: string;
  backupEmbedIframeLink?: string;
  subtitleTracks?: SubtitleTrack[];
  videoSources?: VideoSource[];
  seasonNumber?: number;
  episodeNumber?: number;
  introStart?: number;
  introEnd?: number;
  outroStart?: number;
}

const LANGUAGES = [
  { code: "EN", name: "English", flag: "🇺🇸" },
  { code: "TE", name: "Telugu", flag: "🇮🇳" },
  { code: "HI", name: "Hindi", flag: "🇮🇳" },
  { code: "TA", name: "Tamil", flag: "🇮🇳" },
  { code: "ML", name: "Malayalam", flag: "🇮🇳" },
  { code: "KN", name: "Kannada", flag: "🇮🇳" },
  { code: "KO", name: "Korean", flag: "🇰🇷" },
  { code: "JA", name: "Japanese", flag: "🇯🇵" },
  { code: "ES", name: "Spanish", flag: "🇪🇸" },
  { code: "TH", name: "Thai", flag: "🇹🇭" },
  { code: "ZH", name: "Chinese", flag: "🇨🇳" }
];

export default function StreamingPlayer(props: StreamingPlayerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const hasUsableSource = (source?: VideoSource | null) =>
    Boolean(
      source?.hlsLink?.trim() ||
      source?.mp4Link?.trim() ||
      source?.embedLink?.trim()
    );

  const vidsrcEmbedUrl = useMemo(() => {
    if (props.tmdbId || props.imdbId) {
      const base = "https://vidsrc-embed.ru/embed";
      if (props.type === "movie") {
        const id = props.imdbId || props.tmdbId;
        const param = props.imdbId ? `imdb=${props.imdbId}` : `tmdb=${props.tmdbId}`;
        return `${base}/movie?${param}`;
      } else if (props.type === "series" && props.seasonNumber && props.episodeNumber) {
        const id = props.imdbId || props.tmdbId;
        return `${base}/tv/${id}/${props.seasonNumber}-${props.episodeNumber}`;
      } else if (props.type === "series") {
        const id = props.imdbId || props.tmdbId;
        const param = props.imdbId ? `imdb=${props.imdbId}` : `tmdb=${props.tmdbId}`;
        return `${base}/tv?${param}`;
      }
    }
    return null;
  }, [props.tmdbId, props.imdbId, props.type, props.seasonNumber, props.episodeNumber]);

  const languageSources = useMemo(() => {
    if (!props.videoSources || props.videoSources.length === 0) return null;
    const validSources = props.videoSources.filter(hasUsableSource);
    return validSources.length > 0 ? validSources : null;
  }, [props.videoSources]);

  const availableLanguages = useMemo(() => {
    if (!languageSources) return [];
    return languageSources.map(ls => ({
      code: ls.language,
      name: ls.languageLabel,
      flag: LANGUAGES.find(l => l.code === ls.language)?.flag || "🌐"
    }));
  }, [languageSources]);

  const currentLanguageSource = useMemo(() => {
    if (!languageSources || availableLanguages.length === 0) return null;
    const langCode = selectedLanguage || availableLanguages[0]?.code;
    return languageSources.find(ls => ls.language === langCode) || languageSources[0];
  }, [languageSources, selectedLanguage, availableLanguages]);

  const sources: StreamingSource[] = useMemo(() => {
    if (currentLanguageSource) {
      const langInfo = LANGUAGES.find(l => l.code === currentLanguageSource.language);
      const prefix = langInfo ? `${langInfo.flag} ${langInfo.name}` : "Video";
      const items: StreamingSource[] = [];
      
      if (currentLanguageSource.hlsLink?.trim()) {
        items.push({ type: "hls" as SourceType, url: currentLanguageSource.hlsLink, label: `${prefix} HLS`, language: currentLanguageSource.language });
      }
      if (currentLanguageSource.mp4Link?.trim()) {
        items.push({ type: "hls" as SourceType, url: currentLanguageSource.mp4Link, label: `${prefix} MP4`, language: currentLanguageSource.language });
      }
      if (currentLanguageSource.embedLink?.trim()) {
        items.push({ type: "iframe" as SourceType, url: currentLanguageSource.embedLink, label: `${prefix} Embed`, language: currentLanguageSource.language });
      }
      return items;
    }
    
    const items: StreamingSource[] = [];
    if (props.hlsLink?.trim()) items.push({ type: "hls" as SourceType, url: props.hlsLink, label: "Primary HLS" });
    if (props.backupHlsLink?.trim()) items.push({ type: "hls" as SourceType, url: props.backupHlsLink, label: "Backup HLS" });
    if (props.embedIframeLink?.trim()) items.push({ type: "iframe" as SourceType, url: props.embedIframeLink, label: "Primary Embed" });
    if (props.backupEmbedIframeLink?.trim()) items.push({ type: "iframe" as SourceType, url: props.backupEmbedIframeLink, label: "Backup Embed" });
    return items;
  }, [currentLanguageSource, props.hlsLink, props.backupHlsLink, props.embedIframeLink, props.backupEmbedIframeLink]);

  const activeSource = sources[activeSourceIndex];

  if (!activeSource && !vidsrcEmbedUrl) {
    return (
      <div className="flex aspect-video items-center justify-center bg-[#181818] text-gray-400">
        Streaming not available
      </div>
    );
  }

  if (!activeSource && vidsrcEmbedUrl) {
    return <IframePlayer src={vidsrcEmbedUrl} />;
  }

  return (
    <div>
      {activeSource.type === "hls" ? (
        <VideoPlayer 
          src={activeSource.url} 
          poster={props.poster}
          subtitleTracks={currentLanguageSource?.subtitleTracks || props.subtitleTracks}
          introEnd={props.introEnd}
          outroStart={props.outroStart}
          slug={props.slug}
          type={props.type}
          seasonNumber={props.seasonNumber}
          episodeNumber={props.episodeNumber}
          title={props.title}
        />
      ) : (
        <IframePlayer src={activeSource.url} />
      )}

      {languageSources && availableLanguages.length > 1 && (
        <div className="mx-4 mt-3 rounded-lg border border-[#2a2a2a] bg-[#181818] p-3">
          <div className="mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-400">
              Language: <span className="text-white">{currentLanguageSource?.languageLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setSelectedLanguage(lang.code);
                  setActiveSourceIndex(0);
                }}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs ${
                  (selectedLanguage === lang.code || (!selectedLanguage && lang.code === availableLanguages[0]?.code))
                    ? "bg-red-600 text-white"
                    : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sources.length > 1 && (
        <div className="mx-4 mt-3 rounded-lg border border-[#2a2a2a] bg-[#181818] p-3">
          <p className="mb-2 text-xs text-gray-400">
            Source: <span className="text-white">{activeSource.label}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <button
                key={index}
                onClick={() => setActiveSourceIndex(index)}
                className={`rounded px-3 py-1.5 text-xs ${
                  index === activeSourceIndex ? "bg-red-600 text-white" : "bg-[#2a2a2a] text-gray-300"
                }`}
              >
                {source.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
