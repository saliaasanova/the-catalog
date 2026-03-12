import { JobResult } from "@/types";
import JobCard from "./JobCard";

interface JobListProps {
  jobs: JobResult[];
  totalResults: number;
  searchTime: number;
  query: string;
  hasMore?: boolean;
}

export default function JobList({
  jobs,
  totalResults,
  searchTime,
  query,
  hasMore,
}: JobListProps) {
  return (
    <div className="w-full">
      {/* Section header — newspaper style */}
      <div className="border-t-2 border-b border-text mb-1 py-1 flex items-center justify-between">
        <h2 className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-text">
          Help Wanted
        </h2>
        <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
          {totalResults.toLocaleString()} listings &bull;{" "}
          &ldquo;{query}&rdquo;
        </span>
      </div>

      {/* Thin rule */}
      <div className="border-b border-border mb-3" />

      {/* Classifieds — dense newspaper column */}
      <div className="columns-1">
        {jobs.map((job, i) => (
          <div key={job.id} className="break-inside-avoid">
            {/* Small separator dot between entries */}
            {i > 0 && (
              <div className="flex justify-center py-0.5">
                <span className="text-[8px] text-border-dark">&loz;</span>
              </div>
            )}
            <JobCard job={job} />
          </div>
        ))}
      </div>

      {/* Bottom rule */}
      {!hasMore && (
        <div className="mt-3 border-t border-border pt-1">
          <p className="text-[9px] font-mono text-text-muted text-center tracking-wider uppercase">
            End of listings &bull; {searchTime.toFixed(2)}s
          </p>
        </div>
      )}
    </div>
  );
}
