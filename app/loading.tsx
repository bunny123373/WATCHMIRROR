export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-card" />
      <div className="h-[320px] animate-pulse rounded-2xl bg-card md:h-[420px]" />
      <div className="space-y-6">
        {[1, 2, 3].map((row) => (
          <div key={row} className="space-y-3">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-card" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="w-[150px] shrink-0 animate-pulse rounded-lg bg-card sm:w-[180px] md:w-[200px] lg:w-[220px]">
                  <div className="aspect-[2/3] rounded-lg bg-card" />
                  <div className="mt-2 h-4 w-3/4 rounded bg-card" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}