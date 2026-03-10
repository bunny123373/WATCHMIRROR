"use client";

import { useEffect, useState } from "react";

function LogoSkeleton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#141414]">
      <div className="relative flex items-center justify-center">
        <div className="relative animate-pulse">
          <svg
            width={mounted ? "64px" : "48px"}
            height={mounted ? "64px" : "48px"}
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-all duration-300 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28"
          >
            <g fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <g>
                <line x1="11.8942" y1="11.85" x2="17.9471" y2="36.15" />
                <line x1="24" y1="11.85" x2="17.9471" y2="36.15" />
              </g>
              <g>
                <line x1="24" y1="11.85" x2="30.0529" y2="36.15" />
                <line x1="36.1058" y1="11.85" x2="30.0529" y2="36.15" />
              </g>
            </g>
            <circle cx="24" cy="24" r="21.5" fill="none" stroke="#E50914" strokeWidth="2" />
          </svg>
        </div>
        <div className="absolute inset-0 animate-ping rounded-full bg-[#E50914]/20" />
      </div>
      <h1
        className="mt-4 animate-pulse text-lg font-bold tracking-wider text-white transition-all duration-300 sm:text-xl md:text-2xl lg:text-3xl"
      >
        WATCH <span className="text-[#E50914]">MIRROR</span>
      </h1>
    </div>
  );
}

export default function Loading() {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSkeleton(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] p-3 sm:p-4 md:p-8">
      {!showSkeleton ? (
        <LogoSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-[#2a2a2a] sm:h-10 sm:w-64" />
          <div className="h-[280px] animate-pulse rounded-2xl bg-[#2a2a2a] sm:h-[320px] md:h-[380px] lg:h-[420px]" />
          <div className="space-y-4 sm:space-y-6">
            {[1, 2, 3].map((row) => (
              <div key={row} className="space-y-2 sm:space-y-3">
                <div className="h-5 w-32 animate-pulse rounded-lg bg-[#2a2a2a] sm:h-6 sm:w-40" />
                <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-[120px] shrink-0 animate-pulse rounded-lg bg-[#2a2a2a] sm:w-[150px] md:w-[180px] lg:w-[200px]"
                    >
                      <div className="aspect-[2/3] rounded-lg bg-[#2a2a2a]" />
                      <div className="mt-2 h-3 w-3/4 rounded bg-[#2a2a2a] sm:h-4" />
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
