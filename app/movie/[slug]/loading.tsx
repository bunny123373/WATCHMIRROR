"use client";

import { useEffect, useState } from "react";

function LogoSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#141414]">
      <svg width="96px" height="96px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
      <h1 className="text-2xl font-bold tracking-wider text-white">
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
