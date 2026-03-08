"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clapperboard, Tv, Flame, Search, User } from "lucide-react";
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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl md:hidden">
      <ul className="flex items-center justify-around px-1">
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-3 transition-all ${
                  active 
                    ? "text-red-600" 
                    : "text-gray-500"
                }`}
              >
                <div className={`relative ${active ? "scale-110" : ""}`}>
                  {active && (
                    <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-red-600" />
                  )}
                  <ActiveIcon size={22} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-semibold ${active ? "text-red-600" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            onClick={() => dispatch(setMobileSearchOpen(true))}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-3 text-gray-500 transition-all"
          >
            <Search size={22} strokeWidth={2} />
            <span className="text-[10px] font-semibold text-gray-500">Search</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
