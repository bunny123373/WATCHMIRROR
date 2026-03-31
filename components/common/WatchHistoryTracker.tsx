"use client";

import { useWatchHistory } from "@/hooks/useWatchHistory";

export default function WatchHistoryTracker({ slug }: { slug: string }) {
  useWatchHistory(slug);
  return null;
}
