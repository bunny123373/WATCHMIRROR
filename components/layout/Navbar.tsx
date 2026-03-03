"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setMobileSearchOpen } from "@/store/slices/uiSlice";

const links = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "Series" },
  { href: "/my-list", label: "My List" },
  { href: "/trending", label: "Trending" }
];

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  return (
    <header className="glass fixed inset-x-0 top-0 z-50 border-b border-border/80">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="font-[var(--font-heading)] text-xl tracking-widest text-primary">
          WATCHMIRROR
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition ${pathname === item.href ? "text-primary" : "text-text hover:text-primary"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="rounded-xl border border-border p-2 text-muted transition hover:text-primary"
          onClick={() => dispatch(setMobileSearchOpen(true))}
          aria-label="Open search"
        >
          <Search size={18} />
        </button>
      </div>
    </header>
  );
}
