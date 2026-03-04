"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface TrailerModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrailerModal({ url, isOpen, onClose }: TrailerModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const embedUrl = url.includes("youtube.com/embed") 
    ? url 
    : url.replace("watch?v=", "embed/");

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X size={20} />
        </button>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            src={`${embedUrl}?autoplay=1`}
            className="h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
