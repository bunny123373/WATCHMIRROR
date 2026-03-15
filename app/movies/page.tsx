import type { Metadata } from "next";
import { Suspense } from "react";
import MoviesContent from "./MoviesContent";

export const revalidate = 180;

export const metadata: Metadata = {
  title: "Movies - WATCHMIRROR"
};

export default function MoviesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; language?: string; genre?: string; year?: string; sort?: string }>;
}) {
  return (
    <div className="min-h-screen bg-black pt-0">
      <Suspense fallback={<div className="p-4 text-white">Loading...</div>}>
        <MoviesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
