interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  const isQuotaError = message.toLowerCase().includes("quota");

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="border-2 border-stamp bg-bg-card px-6 py-5 max-w-md w-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-stamp text-sm font-mono font-bold">!</span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stamp">
            Error
          </span>
        </div>
        <div className="border-t border-dashed border-border mb-2" />
        <p className="text-[11px] font-mono text-text-dim leading-relaxed break-words">
          {message}
        </p>
        {isQuotaError && (
          <p className="text-[10px] font-mono text-text-muted mt-2">
            Free tier: 100 queries/day.
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim border-2 border-border px-4 py-2 hover:border-accent hover:text-accent transition-colors duration-200 bg-bg-card"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
