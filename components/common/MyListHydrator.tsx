"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateMyList } from "@/store/slices/myListSlice";
import { MyListItem } from "@/types/content";

const STORAGE_KEY = "watchmirror_my_list";

export default function MyListHydrator() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.myList.items);
  const hydrated = useRef(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const fetchMyList = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        
        if (data.user) {
          const listRes = await fetch("/api/my-list", { cache: "no-store" });
          const listData = await listRes.json();
          
          if (listData.myList && listData.myList.length > 0) {
            const slugs = listData.myList.join(",");
            const contentRes = await fetch(`/api/content?slugs=${slugs}`);
            const contentData = await contentRes.json();
            
            if (contentData.items && contentData.items.length > 0) {
              const myListItems: MyListItem[] = contentData.items.map((c: {
                slug: string; type: "movie" | "series"; title: string; poster: string; year: number; rating: number; quality: string;
              }) => ({
                slug: c.slug,
                type: c.type,
                title: c.title,
                poster: c.poster,
                year: c.year,
                rating: c.rating,
                quality: c.quality
              }));
              dispatch(hydrateMyList(myListItems));
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(myListItems));
              hydrated.current = true;
              setCheckingAuth(false);
              return;
            }
          }
        }

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as MyListItem[];
            dispatch(hydrateMyList(Array.isArray(parsed) ? parsed : []));
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("MyList hydrate error:", error);
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as MyListItem[];
            dispatch(hydrateMyList(Array.isArray(parsed) ? parsed : []));
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
      } finally {
        hydrated.current = true;
        setCheckingAuth(false);
      }
    };

    fetchMyList();
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated.current || checkingAuth) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, checkingAuth]);

  return null;
}
