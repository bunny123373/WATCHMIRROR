import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60 px-4 py-8 text-center text-sm text-muted">
      <span className="font-bold tracking-wide">
        <span className="text-[#E50914]">WATCH</span>
        <span className="text-white">MIRROR</span>
      </span>{" "}
      {new Date().getFullYear()}
    </footer>
  );
}
