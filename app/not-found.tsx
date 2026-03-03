import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
      <h2 className="font-[var(--font-heading)] text-3xl">Not Found</h2>
      <p className="mt-2 text-sm text-muted">The requested content does not exist.</p>
      <Link href="/" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-black">
        Back to Home
      </Link>
    </div>
  );
}