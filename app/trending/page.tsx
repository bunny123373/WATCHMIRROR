import type { Metadata } from "next";
import { Suspense } from "react";
import TrendingContent from "./TrendingContent";

export const revalidate = 180;

export const metadata: Metadata = {
  title: "Trending - WATCHMIRROR"
};

export default function TrendingPage({
  searchParams
}: {
  searchParams: Promise<{ time?: string; type?: string }>;
}) {
  return (
    <div className="min-h-screen bg-black pt-20">
      <Suspense fallback={<div className="p-4 text-white">Loading...</div>}>
        <TrendingContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
