"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clapperboard, Tv, Flame, Search } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setMobileSearchOpen } from "@/store/slices/uiSlice";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Clapperboard },
  { href: "/series", label: "Series", icon: Tv },
  { href: "/trending", label: "Trending", icon: Flame }
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 backdrop-blur-lg">
      <ul className="flex justify-between px-2">
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 transition ${active ? "text-primary" : "text-gray-400"}`}
              >
                <ActiveIcon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            onClick={() => dispatch(setMobileSearchOpen(true))}
            className="flex flex-col items-center gap-1 px-3 py-2 text-gray-400 transition hover:text-white"
          >
            <Search size={20} />
            <span className="text-[10px] font-medium">Search</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
