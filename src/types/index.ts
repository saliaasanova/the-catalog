// The structured job result our API returns to the frontend
export interface JobResult {
  id: string;
  title: string;
  company: string;
  companySlug: string;
  location: string;
  snippet: string;
  url: string;
  source: string;
}

// The response shape from our /api/search endpoint
export interface SearchResponse {
  results: JobResult[];
  totalResults: number;
  searchTime: number;
  query: string;
}

// Error response shape
export interface SearchError {
  error: string;
  details?: string;
}

// Serper.dev API response types
export interface SerperSearchResponse {
  organic?: SerperSearchItem[];
  searchParameters?: { q: string };
  searchInformation?: { totalResults: number; timeTaken: number };
}

export interface SerperSearchItem {
  position: number;
  title: string;
  link: string;
  displayedLink: string;
  snippet: string;
}
