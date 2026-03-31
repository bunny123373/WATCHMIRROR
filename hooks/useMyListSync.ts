"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleMyList as toggleMyListAction, removeMyList as removeMyListAction } from "@/store/slices/myListSlice";
import { MyListItem } from "@/types/content";
import { useAuth } from "@/components/providers/auth-provider";

export function useMyListSync() {
  const dispatch = useAppDispatch();
  const myList = useAppSelector((state) => state.myList.items);
  const { user } = useAuth();

  const isInList = useCallback(
    (slug: string, type: "movie" | "series") => {
      return myList.some((item) => item.slug === slug && item.type === type);
    },
    [myList]
  );

  const toggleMyList = useCallback(
    async (item: MyListItem) => {
      const exists = isInList(item.slug, item.type);

      dispatch(toggleMyListAction(item));

      if (user) {
        try {
          await fetch("/api/my-list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentId: item.slug,
              action: exists ? "remove" : "add"
            })
          });
        } catch (error) {
          console.error("MyList sync error:", error);
        }
      }
    },
    [dispatch, isInList, user]
  );

  const removeMyList = useCallback(
    async (slug: string, type: "movie" | "series") => {
      dispatch(removeMyListAction({ slug, type }));

      if (user) {
        try {
          await fetch("/api/my-list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentId: slug,
              action: "remove"
            })
          });
        } catch (error) {
          console.error("MyList sync error:", error);
        }
      }
    },
    [dispatch, user]
  );

  return { myList, isInList, toggleMyList, removeMyList };
}
