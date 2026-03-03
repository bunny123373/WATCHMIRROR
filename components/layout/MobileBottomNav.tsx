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
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/80 p-2 md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = pathname === item.href;

          return (
            <li key={item.href}>
              <Link href={item.href} className={`flex flex-col items-center rounded-xl py-2 text-xs ${active ? "text-primary" : "text-muted"}`}>
                <ActiveIcon size={16} />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            onClick={() => dispatch(setMobileSearchOpen(true))}
            className="flex w-full flex-col items-center rounded-xl py-2 text-xs text-muted"
          >
            <Search size={16} />
            Search
          </button>
        </li>
      </ul>
    </nav>
  );
}