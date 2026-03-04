"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TrailerModal from "@/components/common/TrailerModal";

function TrailerHandlerInner() {
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenTrailer = (e: CustomEvent) => {
      setTrailerUrl(e.detail);
    };
    window.addEventListener("openTrailer", handleOpenTrailer as EventListener);
    return () => window.removeEventListener("openTrailer", handleOpenTrailer as EventListener);
  }, []);

  if (!trailerUrl) return null;

  return <TrailerModal url={trailerUrl} isOpen={!!trailerUrl} onClose={() => setTrailerUrl(null)} />;
}

export default function TrailerHandler() {
  return (
    <Suspense fallback={null}>
      <TrailerHandlerInner />
    </Suspense>
  );
}
