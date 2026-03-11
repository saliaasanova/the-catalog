"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import JobList from "@/components/JobList";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { JobResult, SearchResponse } from "@/types";

const SUGGESTED_SEARCHES = [
  "Product Manager",
  "Software Engineer",
  "AI Engineer",
  "Designer",
  "Data Scientist",
  "Forward Deployed Engineer",
  "Implementation Manager",
  "Data Operations",
  "ML Ops",
  "GTM",
  "Marketing",
  "DevOps",
];

/**
 * Normalize location strings to reduce duplicates in filter chips.
 * e.g. "San Francisco / Bay Area" → "San Francisco"
 */
function normalizeLocation(loc: string): string {
  let normalized = loc
    .replace(/\s*\/\s*Bay\s*(Area)?/i, "")
    .replace(/\s*Bay\s*Area/i, "")
    .replace(/\s*\(HQ\)/i, "")
    .replace(/,\s*(California|New York|Texas|Washington|Massachusetts|Colorado|Illinois|Georgia|Pennsylvania|Virginia|Florida|Oregon)$/i, "")
    .replace(/,\s*(CA|NY|TX|WA|MA|CO|IL|GA|PA|VA|FL|OR|DC)$/i, "")
    .trim();

  // Normalize NYC variants
  if (/^(NYC|New York City)$/i.test(normalized)) {
    normalized = "New York";
  }

  return normalized;
}

export default function Home() {
  const [results, setResults] = useState<JobResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  async function handleSearch(searchQuery: string) {
    setIsLoading(true);
    setError(null);
    setQuery(searchQuery);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Search failed (${response.status})`
        );
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setTotalResults(data.totalResults);
      setSearchTime(data.searchTime);
      setLocationFilter("");
      setPage(1);
      setHasMore(data.results.length >= 30);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMore() {
    if (!query || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const startFrom = results.length + 1;
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&start=${startFrom}&count=10`
      );

      if (!response.ok) throw new Error("Failed to load more");

      const data: SearchResponse = await response.json();
      setResults((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newResults = data.results.filter((r) => !existingIds.has(r.id));
        return [...prev, ...newResults];
      });
      setPage(page + 1);
      setHasMore(data.results.length >= 10);
    } catch {
      // silently fail — user can retry
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Build normalized location chips, deduplicating similar locations
  const locationMap = new Map<string, string>(); // normalized → first raw value
  for (const r of results) {
    if (!r.location) continue;
    const norm = normalizeLocation(r.location);
    if (!locationMap.has(norm)) {
      locationMap.set(norm, r.location);
    }
  }
  const locations = Array.from(locationMap.keys()).sort();

  const filteredResults = locationFilter
    ? results.filter((r) => normalizeLocation(r.location) === locationFilter)
    : results;

  return (
    <div className="min-h-screen">
      {/* Top border strip */}
      <div className="h-1.5 bg-accent" />

      <main className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div
          className={`flex flex-col items-center transition-all duration-500 ${
            hasSearched ? "pt-8 pb-6" : "pt-20 pb-10"
          }`}
        >
          {!hasSearched && (
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-border-dark" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-text-dim font-mono">
                Est. 2025
              </span>
              <div className="h-px w-8 bg-border-dark" />
            </div>
          )}

          <h1
            className={`font-display font-bold tracking-tight text-text transition-all duration-500 ${
              hasSearched ? "text-xl" : "text-4xl sm:text-5xl"
            }`}
          >
            The Catalog
          </h1>

          {!hasSearched && (
            <>
              <p className="text-text-mid text-sm font-mono mt-3 tracking-wide">
                Startup jobs you won&apos;t find on LinkedIn.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted border border-border px-2 py-0.5 font-mono">
                  Ashby
                </span>
                <span className="text-text-muted text-xs">&bull;</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted border border-border px-2 py-0.5 font-mono">
                  Greenhouse
                </span>
                <span className="text-text-muted text-xs">&bull;</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted border border-border px-2 py-0.5 font-mono">
                  100+ Startups
                </span>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className={`mb-8 ${hasSearched ? "" : "max-w-xl mx-auto"}`}>
          <SearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            initialQuery={query}
          />
        </div>

        {/* Suggested Searches */}
        {!hasSearched && (
          <div className="flex flex-col items-center mt-2">
            <p className="text-[10px] text-text-muted font-mono mb-3 uppercase tracking-[0.2em]">
              Browse by role
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_SEARCHES.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="px-3.5 py-1.5 text-xs font-mono text-text-mid border-2 border-border bg-bg-card hover:border-accent hover:text-accent transition-colors duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location filter */}
        {!isLoading && !error && results.length > 0 && locations.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider mr-1">
              Location:
            </span>
            <button
              onClick={() => setLocationFilter("")}
              className={`px-2.5 py-1 text-[11px] font-mono border transition-colors duration-200 ${
                !locationFilter
                  ? "border-accent text-accent bg-bg-card"
                  : "border-border text-text-dim hover:border-accent hover:text-accent"
              }`}
            >
              All
            </button>
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() =>
                  setLocationFilter(loc === locationFilter ? "" : loc)
                }
                className={`px-2.5 py-1 text-[11px] font-mono border transition-colors duration-200 ${
                  locationFilter === loc
                    ? "border-accent text-accent bg-bg-card"
                    : "border-border text-text-dim hover:border-accent hover:text-accent"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && <LoadingState />}

        {/* Error */}
        {!isLoading && error && (
          <ErrorState message={error} onRetry={() => handleSearch(query)} />
        )}

        {/* Empty */}
        {!isLoading && !error && hasSearched && results.length === 0 && (
          <EmptyState query={query} />
        )}

        {/* Results */}
        {!isLoading && !error && filteredResults.length > 0 && (
          <JobList
            jobs={filteredResults}
            totalResults={locationFilter ? filteredResults.length : totalResults}
            searchTime={searchTime}
            query={query}
          />
        )}

        {/* Load More */}
        {!isLoading && !error && results.length > 0 && hasMore && !locationFilter && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="px-6 py-2 text-xs font-mono font-bold uppercase tracking-widest border-2 border-border-dark text-text hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-text border-t-transparent rounded-full animate-spin" />
                  Loading
                </span>
              ) : (
                "Load More Listings"
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="py-8 mt-16 text-center border-t-2 border-border">
          <p className="text-[10px] text-text-muted font-mono tracking-[0.15em] uppercase">
            Data from Ashby &amp; Greenhouse
          </p>
        </footer>
      </main>
    </div>
  );
}
