interface IframePlayerProps {
  src: string;
}

export default function IframePlayer({ src }: IframePlayerProps) {
  let safeSrc = "";
  try {
    const parsed = new URL(src);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      safeSrc = parsed.toString();
    }
  } catch {
    safeSrc = "";
  }

  if (!safeSrc) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted">
        Invalid streaming URL
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          src={safeSrc}
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
