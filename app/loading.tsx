export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-card" />
      <div className="h-[320px] animate-pulse rounded-2xl bg-card md:h-[420px]" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div key={idx} className="aspect-[2/3] animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    </div>
  );
}