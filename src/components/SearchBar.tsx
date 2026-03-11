"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export default function SearchBar({
  onSearch,
  isLoading,
  initialQuery = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      onSearch(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex border-2 border-border-dark bg-bg-card focus-within:border-accent transition-colors duration-300">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a job title..."
          className="flex-1 bg-transparent px-4 py-3 text-sm font-mono text-text placeholder-text-muted focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || value.trim().length === 0}
          className="px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest border-l-2 border-border-dark text-bg-card bg-text hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-bg-card border-t-transparent rounded-full animate-spin" />
              Wait
            </span>
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
}
