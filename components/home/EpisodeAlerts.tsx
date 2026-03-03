"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { Content } from "@/types/content";

const NOTIFIED_KEY = "wm_notified_episodes";

export default function EpisodeAlerts() {
  const continueItems = useAppSelector((state) => state.continue.items);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  const followedSeriesSlugs = useMemo(
    () => Array.from(new Set(continueItems.filter((item) => item.type === "series").map((item) => item.slug))),
    [continueItems]
  );

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  useEffect(() => {
    if (permission !== "granted" || !followedSeriesSlugs.length) return;

    const run = async () => {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const items: Content[] = Array.isArray(data.items) ? data.items : [];
      const map = new Set(JSON.parse(window.localStorage.getItem(NOTIFIED_KEY) || "[]"));
      const now = Date.now();
      const cutoff = now - 1000 * 60 * 60 * 24 * 3;

      items
        .filter((item) => item.type === "series" && followedSeriesSlugs.includes(item.slug))
        .forEach((series) => {
          (series.seasons || []).forEach((season) => {
            (season.episodes || []).forEach((episode) => {
              if (!episode.releaseAt) return;
              const ts = new Date(episode.releaseAt).getTime();
              const key = `${series.slug}-${season.seasonNumber}-${episode.episodeNumber}`;
              if (!Number.isFinite(ts) || ts < cutoff || ts > now || map.has(key)) return;

              new Notification(`${series.title}: New Episode Released`, {
                body: `Season ${season.seasonNumber} • Episode ${episode.episodeNumber} is now available.`
              });
              map.add(key);
            });
          });
        });

      window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(map)));
    };

    run();
  }, [permission, followedSeriesSlugs]);

  if (!followedSeriesSlugs.length || permission === "granted") return null;

  return (
    <section className="glass flex items-center justify-between rounded-2xl p-4">
      <div>
        <p className="font-semibold">Episode Alerts</p>
        <p className="text-sm text-muted">Enable browser notifications for newly released episodes you follow.</p>
      </div>
      <button type="button" onClick={enableNotifications} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-black">
        <Bell size={15} /> Enable
      </button>
    </section>
  );
}
