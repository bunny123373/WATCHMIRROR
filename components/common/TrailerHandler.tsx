"use client";

import { useState, useEffect } from "react";
import TrailerModal from "@/components/common/TrailerModal";

export default function TrailerHandler() {
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
