"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";

export default function MovieDetailsLoading() {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSkeleton(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!showSkeleton) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#141414]">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E50914]">
            <Play className="ml-1 h-10 w-10 fill-white text-white" />
          </div>
          <div className="absolute inset-0 animate-ping rounded-full bg-[#E50914]/30" />
        </div>
        <h1 className="text-2xl font-bold tracking-wider text-white">
          WATCH <span className="text-[#E50914]">MIRROR</span>
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#141414] p-4">
      <div className="h-[320px] animate-pulse rounded-2xl bg-[#2a2a2a] md:h-[420px]" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded-lg bg-[#2a2a2a]" />
        <div className="h-4 w-1/4 animate-pulse rounded-lg bg-[#2a2a2a]" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-20 animate-pulse rounded-lg bg-[#2a2a2a]" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-[#2a2a2a]" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-[#2a2a2a]" />
      </div>
    </div>
  );
}
