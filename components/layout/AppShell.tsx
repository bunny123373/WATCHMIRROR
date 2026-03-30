"use client";

import { usePathname } from "next/navigation";

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isWatchPage = pathname?.startsWith("/watch/") || pathname?.startsWith("/series/watch/");

  return (
    <main
      className={
        isWatchPage
          ? "w-full min-h-screen flex-1"
          : "w-full min-h-screen flex-1 px-3 pb-24 pt-14 sm:px-4 md:px-8 md:pb-10 md:pt-20"
      }
    >
      {children}
    </main>
  );
}
