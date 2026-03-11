export default function LoadingState() {
  return (
    <div className="w-full">
      {/* Section header skeleton */}
      <div className="border-t-2 border-b border-text mb-1 py-1 flex items-center justify-between">
        <div className="h-2.5 w-28 bg-border animate-pulse" />
        <div className="h-2 w-20 bg-border animate-pulse" />
      </div>
      <div className="border-b border-border mb-3" />

      {/* Classified text skeletons */}
      <div className="columns-1 md:columns-2 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid py-1.5"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5">
                <div className="h-2.5 w-20 bg-border animate-pulse inline-block" />
                <div className="h-2.5 w-32 bg-border/70 animate-pulse inline-block" />
                <div className="h-2.5 w-24 bg-border/50 animate-pulse inline-block" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <div className="h-2.5 w-full bg-border/40 animate-pulse" />
              </div>
            </div>
            {i < 7 && (
              <div className="flex justify-center py-1">
                <div className="h-1.5 w-1.5 bg-border animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-border pt-2 text-center">
        <span className="inline-flex items-center gap-2 text-[9px] font-mono text-text-dim">
          <span className="inline-block w-2.5 h-2.5 border border-accent border-t-transparent rounded-full animate-spin" />
          Scanning classifieds...
        </span>
      </div>
    </div>
  );
}
