"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";

export default function Loading() {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSkeleton(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#141414]">
      {!showSkeleton ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
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
      ) : (
        <div className="space-y-8 p-4">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-[#2a2a2a]" />
          <div className="h-[320px] animate-pulse rounded-2xl bg-[#2a2a2a] md:h-[420px]" />
          <div className="space-y-6">
            {[1, 2, 3].map((row) => (
              <div key={row} className="space-y-3">
                <div className="h-6 w-40 animate-pulse rounded-lg bg-[#2a2a2a]" />
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-[150px] shrink-0 animate-pulse rounded-lg bg-[#2a2a2a] sm:w-[180px] md:w-[200px] lg:w-[220px]"
                    >
                      <div className="aspect-[2/3] rounded-lg bg-[#2a2a2a]" />
                      <div className="mt-2 h-4 w-3/4 rounded bg-[#2a2a2a]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
