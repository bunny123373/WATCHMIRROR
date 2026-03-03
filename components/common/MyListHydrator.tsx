"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateMyList } from "@/store/slices/myListSlice";
import { MyListItem } from "@/types/content";

const STORAGE_KEY = "watchmirror_my_list";

export default function MyListHydrator() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.myList.items);
  const hydrated = useRef(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as MyListItem[];
        dispatch(hydrateMyList(Array.isArray(parsed) ? parsed : []));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    hydrated.current = true;
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  return null;
}
