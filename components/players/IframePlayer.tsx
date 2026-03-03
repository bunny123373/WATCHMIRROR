interface IframePlayerProps {
  src: string;
}

export default function IframePlayer({ src }: IframePlayerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1F232D] bg-[#0E1015]">
      <div className="relative aspect-video w-full">
        <iframe
          src={src}
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}