"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setMobileSearchOpen } from "@/store/slices/uiSlice";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/trending", label: "Trending" },
  { href: "/search", label: "Search" },
  { href: "/my-list", label: "My List" }
];

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [menuOpen, setMenuOpen] = useState(false);

  const isWatchPage = pathname?.startsWith("/series/watch") || pathname?.startsWith("/movies/watch");

  if (isWatchPage) return null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-gradient-to-b from-black/95 via-black/80 to-black/35 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 md:h-16 md:px-8">
        <Link href="/" className="font-[var(--font-heading)] text-lg font-bold tracking-widest md:text-xl">
          <span className="text-[#E50914]">WATCH</span>
          <span className="text-white">MIRROR</span>
        </Link>

        <nav className="hidden items-center gap-4 md:flex lg:gap-6">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition ${
                pathname === item.href ? "text-white" : "text-gray-300 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="rounded-lg p-2 text-gray-300 transition hover:text-white md:hidden"
            onClick={() => dispatch(setMobileSearchOpen(true))}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <button
            className="rounded-lg p-2 text-gray-300 transition hover:text-white md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            className="hidden rounded-lg border border-gray-600 p-2 text-gray-300 transition hover:text-white md:block"
            onClick={() => dispatch(setMobileSearchOpen(true))}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-[#0a0a0a] md:hidden">
          <nav className="flex flex-col py-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 text-sm font-medium transition ${pathname === item.href ? "bg-primary/10 text-primary" : "text-gray-300 hover:bg-white/5"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
