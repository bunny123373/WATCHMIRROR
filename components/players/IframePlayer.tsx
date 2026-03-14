"use client";

interface IframePlayerProps {
  src: string;
}

export default function IframePlayer({ src }: IframePlayerProps) {
  return (
    <div className="w-full bg-black">
      <div 
        className="relative w-full"
        style={{ aspectRatio: '16/9' }}
      >
        <iframe
          src={src}
          allowFullScreen
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        />
      </div>
    </div>
  );
}
