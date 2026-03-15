import type { Metadata } from "next";
import { Suspense } from "react";
import SeriesContent from "./SeriesContent";

export const revalidate = 180;

export const metadata: Metadata = {
  title: "TV Shows - WATCHMIRROR"
};

export default function SeriesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; language?: string; genre?: string; year?: string; sort?: string }>;
}) {
  return (
    <div className="min-h-screen bg-black pt-0">
      <Suspense fallback={<div className="p-4 text-white">Loading...</div>}>
        <SeriesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
