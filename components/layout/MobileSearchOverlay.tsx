"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMobileSearchOpen, setSearchTerm } from "@/store/slices/uiSlice";

export default function MobileSearchOverlay() {
  const dispatch = useAppDispatch();
  const { mobileSearchOpen, searchTerm } = useAppSelector((state) => state.ui);
  const items = useAppSelector((state) => state.continue.items);

  useEffect(() => {
    if (!mobileSearchOpen) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(setMobileSearchOpen(false));
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [mobileSearchOpen, dispatch]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(term)).slice(0, 10);
  }, [items, searchTerm]);

  return (
    <AnimatePresence>
      {mobileSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/80 p-4 md:hidden"
          onClick={() => dispatch(setMobileSearchOpen(false))}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass h-full rounded-2xl p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-[var(--font-heading)] text-lg">Search</h3>
              <button onClick={() => dispatch(setMobileSearchOpen(false))}>
                <X size={18} />
              </button>
            </div>

            <input
              autoFocus
              value={searchTerm}
              onChange={(event) => dispatch(setSearchTerm(event.target.value))}
              placeholder="Search continue watching..."
              className="w-full rounded-xl border border-border bg-black/30 px-4 py-3 text-sm outline-none ring-primary/50 focus:ring"
            />

            <div className="mt-4 space-y-3 overflow-y-auto">
              {filtered.map((item) => (
                <Link
                  key={`${item.slug}-${item.episodeNumber || 0}`}
                  href={item.type === "movie" ? `/watch/${item.slug}` : `/series/watch/${item.slug}`}
                  onClick={() => dispatch(setMobileSearchOpen(false))}
                  className="flex items-center gap-3 rounded-xl border border-border bg-black/20 p-2"
                >
                  <Image src={item.poster} alt={item.title} width={56} height={72} className="rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted">{item.type.toUpperCase()}</p>
                  </div>
                </Link>
              ))}
              {!filtered.length && <p className="text-sm text-muted">No matching content found.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}