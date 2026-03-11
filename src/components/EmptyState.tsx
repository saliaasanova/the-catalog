interface EmptyStateProps {
  query: string;
}

export default function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="w-full">
      <div className="border-t-2 border-b border-text mb-1 py-1">
        <h2 className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-text">
          Help Wanted
        </h2>
      </div>
      <div className="border-b border-border mb-6" />

      <div className="text-center py-10">
        <p className="text-sm font-mono text-text-dim mb-1">
          No classifieds matched &ldquo;{query}&rdquo;
        </p>
        <p className="text-[11px] font-mono text-text-muted">
          Try broader keywords or check back tomorrow.
        </p>
      </div>

      <div className="border-t border-border pt-1">
        <p className="text-[9px] font-mono text-text-muted text-center tracking-wider uppercase">
          End of listings
        </p>
      </div>
    </div>
  );
}
