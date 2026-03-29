"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { hydrateContinue } from "@/store/slices/continueSlice";
import { ContinueWatchingItem } from "@/types/content";

const STORAGE_KEY = "watchmirror_continue_watching";
const PROFILE_KEY = "watchmirror_profile";

export default function ContinueHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const hydrate = async () => {
      const profileName = window.localStorage.getItem(PROFILE_KEY)?.trim() || "";

      if (profileName) {
        try {
          const res = await fetch(`/api/progress?profile=${encodeURIComponent(profileName)}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data.items) ? (data.items as ContinueWatchingItem[]) : [];
            dispatch(hydrateContinue(items));
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            return;
          }
        } catch {}
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        dispatch(hydrateContinue([]));
        return;
      }

      try {
        const items = JSON.parse(raw) as ContinueWatchingItem[];
        dispatch(hydrateContinue(Array.isArray(items) ? items : []));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        dispatch(hydrateContinue([]));
      }
    };

    hydrate();
  }, [dispatch]);

  return null;
}
