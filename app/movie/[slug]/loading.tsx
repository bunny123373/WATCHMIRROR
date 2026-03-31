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

export default function MovieDetailsLoading() {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSkeleton(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!showSkeleton) {
    return <LogoSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#141414] p-3 sm:p-4 md:p-8">
      <div className="space-y-6 sm:space-y-8">
        <div className="h-[280px] animate-pulse rounded-2xl bg-[#2a2a2a] sm:h-[320px] md:h-[380px] lg:h-[450px]" />
        <div className="space-y-3 sm:space-y-4">
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-[#2a2a2a] sm:h-8 md:h-9" />
          <div className="h-4 w-20 animate-pulse rounded-lg bg-[#2a2a2a] sm:h-5 sm:w-24" />
        </div>
        <div className="space-y-2 sm:space-y-3">
          <div className="h-5 w-16 animate-pulse rounded-lg bg-[#2a2a2a] sm:h-6 sm:w-20" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-[#2a2a2a]" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-[#2a2a2a]" />
          <div className="h-4 w-3/4 animate-pulse rounded-lg bg-[#2a2a2a]" />
        </div>
      </div>
    </div>
  );
}
