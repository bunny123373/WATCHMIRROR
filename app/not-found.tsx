import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] w-full items-center justify-center py-8">
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="font-[var(--font-heading)] text-3xl">Not Found</h2>
        <p className="mt-2 text-sm text-muted">The requested content does not exist.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-black">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
