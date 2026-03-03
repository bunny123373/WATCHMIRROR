"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { hydrateContinue } from "@/store/slices/continueSlice";
import { ContinueWatchingItem } from "@/types/content";

const STORAGE_KEY = "watchmirror_continue_watching";

export default function ContinueHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const items = JSON.parse(raw) as ContinueWatchingItem[];
      dispatch(hydrateContinue(Array.isArray(items) ? items : []));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [dispatch]);

  return null;
}