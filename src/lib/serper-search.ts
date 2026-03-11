import {
  SerperSearchResponse,
  SerperSearchItem,
  JobResult,
  SearchResponse,
} from "@/types";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SERPER_URL = "https://google.serper.dev/search";

/**
 * Detect which job board a URL belongs to.
 */
export function detectSource(url: string): "Ashby" | "Greenhouse" | "Unknown" {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === "jobs.ashbyhq.com") return "Ashby";
    if (hostname === "jobs.greenhouse.io" || hostname === "boards.greenhouse.io")
      return "Greenhouse";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

/**
 * Parse company name from a job board URL.
 *
 * URL patterns:
 *   https://jobs.ashbyhq.com/openai/abc-123-def
 *   https://jobs.greenhouse.io/hashicorp/jobs/123456
 *   https://boards.greenhouse.io/ramp/jobs/789012
 *
 * The company slug is always the first path segment after the domain.
 */
export function parseCompanyFromUrl(url: string): {
  company: string;
  slug: string;
} {
  try {
    const parsed = new URL(url);
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const slug = pathSegments[0] || "unknown";

    // Convert slug to display name: "my-company" -> "My Company"
    const company = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return { company, slug };
  } catch {
    return { company: "Unknown", slug: "unknown" };
  }
}

/**
 * Clean up the job title from search result title.
 * Strips company suffix if present.
 */
export function parseJobTitle(rawTitle: string, companyName: string): string {
  let title = rawTitle;

  const separators = [" - ", " | ", " — ", " at "];
  for (const sep of separators) {
    const idx = title.lastIndexOf(sep);
    if (idx > 0) {
      const afterSep = title
        .slice(idx + sep.length)
        .trim()
        .toLowerCase();

      if (
        afterSep.includes(companyName.toLowerCase()) ||
        companyName.toLowerCase().includes(afterSep) ||
        afterSep.includes("jobs") ||
        afterSep.includes("careers") ||
        afterSep.includes("ashby") ||
        afterSep.includes("greenhouse")
      ) {
        title = title.slice(0, idx).trim();
        break;
      }
    }
  }

  return title || rawTitle;
}

/**
 * Extract location from snippet and title text.
 */
export function parseLocation(title: string, snippet: string): string {
  const text = `${title} | ${snippet}`;

  const workplaceMatch = text.match(
    /\b(fully remote|remote[- ]?first|remote|hybrid|on[- ]?site)\b/i
  );

  // Ashby/Greenhouse format: "Location. NYC" or "Location. San Francisco"
  const labeledLocationMatch = text.match(
    /Location[.:]\s*([A-Z][A-Za-z\s,]+?)(?:\.|Employment|$)/
  );

  // US states: "City, ST" pattern
  const usLocationMatch = text.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})\b/
  );

  // Known major cities
  const cityMatch = text.match(
    /\b(San Francisco|New York|NYC|Los Angeles|Chicago|Seattle|Austin|Boston|Denver|Miami|Portland|London|Berlin|Paris|Toronto|Singapore|Tokyo|Sydney|Dublin|Amsterdam|Tel Aviv|Bangalore|Bengaluru|Stockholm|Copenhagen|Helsinki|Oslo|Munich|Zurich|Barcelona|Madrid|Lisbon|Seoul|Shanghai|Beijing|Hong Kong|Melbourne|Vancouver|Montreal|Washington DC|Philadelphia|Atlanta|Dallas|Houston|Minneapolis|Detroit|Sao Paulo|Mexico City)\b/i
  );

  // Country names
  const countryMatch = text.match(
    /\b(United States|USA|UK|United Kingdom|Canada|Germany|France|India|Australia|Israel|Japan|Singapore|Sweden|Denmark|Finland|Norway|Switzerland|Spain|Portugal|South Korea|China|Brazil|Mexico|Netherlands|Ireland)\b/i
  );

  const parts: string[] = [];

  if (labeledLocationMatch) {
    parts.push(labeledLocationMatch[1].trim());
  } else if (usLocationMatch) {
    parts.push(`${usLocationMatch[1]}, ${usLocationMatch[2]}`);
  } else if (cityMatch) {
    const city = cityMatch[1] === "NYC" ? "New York" : cityMatch[1];
    parts.push(city);
  } else if (countryMatch) {
    parts.push(countryMatch[1]);
  }

  if (workplaceMatch) {
    const type = workplaceMatch[1].charAt(0).toUpperCase() + workplaceMatch[1].slice(1).toLowerCase();
    const normalized = type.replace(/[- ]?first/i, "").replace(/on[- ]?site/i, "On-site");
    if (!parts.includes(normalized)) {
      parts.push(normalized);
    }
  }

  return parts.join(" \u00b7 ");
}

/**
 * Strip metadata boilerplate from Serper snippets, keeping only the
 * actual job description text.
 *
 * Typical raw snippets look like:
 *   "Software Engineer. Location. McLean, VA. Employment Type. Full time. Location Type ... Apply for this Job."
 *   "Product Manager. Location. Stockholm. Employment Type. Full ... We treat all candidates equally..."
 */
function cleanSnippet(snippet: string, title: string, company: string): string {
  let s = snippet;

  // Strip leading/trailing ellipsis first so title regex ^ anchors work
  s = s.replace(/^\.{2,}\s*/, "");
  s = s.replace(/\s*\.{2,}$/, "");

  // Remove leading job title — use the base title (before @ / at / | / —)
  const baseTitle = title.split(/\s+[@|—]\s+|\s+at\s+/i)[0].trim();
  if (baseTitle) {
    const baseTitleEscaped = baseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match the base title (possibly with extra words like "- Hybrid", ", International Growth") then a period/ellipsis
    s = s.replace(new RegExp(`^${baseTitleEscaped}[^.]*?(?:\\.|\\.\\.\\.)\\s*`, "i"), "");
  }

  // Strip dots/ellipsis again after title removal
  s = s.replace(/^\.{2,}\s*/, "");

  // Remove labeled metadata fields: "Label. value." or "Label. value ..."
  s = s.replace(
    /\b(Location|Employment\s*Type|Location\s*Type|Department|Compensation|Team|Experience Level?)\s*[.:]\s*[^.]*?(?:\.\s*|\.{3}\s*|\s+(?=\b[A-Z]))/g,
    " "
  );

  // Remove "Compensation Range: $XXX - $XXX." pattern (colon variant)
  s = s.replace(/Compensation\s*Range\s*:\s*[^.]+\.\s*/gi, "");

  // Remove company name at the start
  const companyEscaped = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  s = s.replace(new RegExp(`^${companyEscaped}[.:\\s]*`, "i"), "");

  // Remove reCAPTCHA / privacy boilerplate
  s = s.replace(/This site is protected by reCAPTCHA.*$/i, "");
  s = s.replace(/Powered by\s*[·.]?\s*Privacy Policy\s*Security\s*Vulnerability\s*/gi, "");

  // Remove "Apply for this Job/Role" and truncated "Apply for this" CTAs
  s = s.replace(/Apply\s+(for\s+this\s*(job|role|position)?|now)[.!]?\s*/gi, "");

  // Remove trailing "Apply for this ..." or "... apply."
  s = s.replace(/\.{3}\s*$/i, "");
  s = s.replace(/\.\.\.\s*apply\.\s*$/i, "");

  // Collapse whitespace and trim
  s = s.replace(/\s+/g, " ").trim();

  // Remove leading/trailing punctuation left over from stripping
  s = s.replace(/^[.\-–—:,;\s]+/, "").trim();
  s = s.replace(/[.\-–—:,;\s]+$/, "").trim();

  // If the cleaned snippet is too short to be meaningful, treat as empty
  if (s.length < 30) return "";

  return s;
}

/**
 * Transform a Serper search item into our JobResult domain model.
 */
function transformItem(item: SerperSearchItem): JobResult {
  const { company, slug } = parseCompanyFromUrl(item.link);
  const title = parseJobTitle(item.title, company);
  const location = parseLocation(item.title, item.snippet || "");

  const id = Buffer.from(item.link).toString("base64url");

  return {
    id,
    title,
    company,
    companySlug: slug,
    location,
    snippet: cleanSnippet(item.snippet || "", title, company),
    url: item.link,
    source: detectSource(item.link),
  };
}

/**
 * Parse the Greenhouse job ID from a URL.
 * e.g. https://boards.greenhouse.io/toast/jobs/7592625 → { slug: "toast", jobId: "7592625" }
 */
function parseGreenhouseUrl(url: string): { slug: string; jobId: string } | null {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const jobsIdx = segments.indexOf("jobs");
    if (jobsIdx >= 0 && segments[jobsIdx + 1]) {
      return { slug: segments[0], jobId: segments[jobsIdx + 1] };
    }
    return null;
  } catch {
    return null;
  }
}

interface EnrichmentData {
  location?: string;
  description?: string;
}

/**
 * Strip HTML to plain text and truncate.
 */
function htmlToSnippet(html: string): string {
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= 200) return plain;
  return plain.slice(0, 200).replace(/\s\S*$/, "") + "...";
}

/**
 * Fetch location + description for Ashby results via their public GraphQL API.
 * Uses the batch listing query for locations, then individual queries for descriptions
 * only when the Serper snippet was empty.
 */
async function fetchAshbyData(
  results: JobResult[]
): Promise<Map<string, EnrichmentData>> {
  const dataMap = new Map<string, EnrichmentData>();
  const bySlug = new Map<string, JobResult[]>();

  for (const r of results) {
    if (r.source !== "Ashby") continue;
    const existing = bySlug.get(r.companySlug) || [];
    existing.push(r);
    bySlug.set(r.companySlug, existing);
  }

  // Batch fetch locations from the listing endpoint
  const locationFetches = Array.from(bySlug.entries()).map(async ([slug, jobs]) => {
    try {
      const resp = await fetch(
        "https://jobs.ashbyhq.com/api/non-user-graphql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operationName: "ApiJobBoardWithTeams",
            variables: { organizationHostedJobsPageName: slug },
            query: `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
              jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
                jobPostings { id title locationName }
              }
            }`,
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!resp.ok) return;

      const data = await resp.json();
      const postings: { id: string; title: string; locationName: string }[] =
        data?.data?.jobBoard?.jobPostings || [];

      for (const job of jobs) {
        const segments = new URL(job.url).pathname.split("/").filter(Boolean);
        const jobId = segments[1];
        const posting = postings.find((p) => p.id === jobId);
        if (posting?.locationName) {
          dataMap.set(job.url, { location: posting.locationName });
        }
      }
    } catch {
      // Ignore
    }
  });

  await Promise.allSettled(locationFetches);

  // Fetch descriptions individually only for results that have no snippet
  const needsDescription = results.filter(
    (r) => r.source === "Ashby" && !r.snippet
  );

  const descFetches = needsDescription.map(async (r) => {
    const segments = new URL(r.url).pathname.split("/").filter(Boolean);
    const jobId = segments[1];
    try {
      const resp = await fetch(
        "https://jobs.ashbyhq.com/api/non-user-graphql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operationName: "ApiJobPosting",
            variables: {
              organizationHostedJobsPageName: r.companySlug,
              jobPostingId: jobId,
            },
            query: `query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) {
              jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName, jobPostingId: $jobPostingId) {
                descriptionHtml
              }
            }`,
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!resp.ok) return;

      const data = await resp.json();
      const html = data?.data?.jobPosting?.descriptionHtml;
      if (html) {
        const existing = dataMap.get(r.url) || {};
        existing.description = htmlToSnippet(html);
        dataMap.set(r.url, existing);
      }
    } catch {
      // Ignore
    }
  });

  await Promise.allSettled(descFetches);
  return dataMap;
}

/**
 * Fetch location + description for Greenhouse results via their public board API.
 */
async function fetchGreenhouseData(
  results: JobResult[]
): Promise<Map<string, EnrichmentData>> {
  const dataMap = new Map<string, EnrichmentData>();

  const fetches = results
    .filter((r) => r.source === "Greenhouse")
    .map(async (r) => {
      const parsed = parseGreenhouseUrl(r.url);
      if (!parsed) return;

      try {
        const resp = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${parsed.slug}/jobs/${parsed.jobId}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (!resp.ok) return;

        const data = await resp.json();
        const enrichment: EnrichmentData = {};
        if (data?.location?.name) {
          enrichment.location = data.location.name;
        }
        if (!r.snippet && data?.content) {
          enrichment.description = htmlToSnippet(data.content);
        }
        dataMap.set(r.url, enrichment);
      } catch {
        // Ignore — keep existing data
      }
    });

  await Promise.allSettled(fetches);
  return dataMap;
}

/**
 * Enrich results with real location and description data from Ashby/Greenhouse APIs.
 */
async function enrichResults(results: JobResult[]): Promise<JobResult[]> {
  const [ashbyMap, greenhouseMap] = await Promise.all([
    fetchAshbyData(results),
    fetchGreenhouseData(results),
  ]);

  return results.map((r) => {
    const data = ashbyMap.get(r.url) || greenhouseMap.get(r.url);
    if (!data) return r;

    const updates: Partial<JobResult> = {};
    if (data.location) updates.location = data.location;
    if (!r.snippet && data.description) updates.snippet = data.description;

    return Object.keys(updates).length > 0 ? { ...r, ...updates } : r;
  });
}

/**
 * Build search query with site: operators for Ashby and Greenhouse.
 */
export function buildSearchQuery(userQuery: string): string {
  return `(site:jobs.ashbyhq.com OR site:jobs.greenhouse.io OR site:boards.greenhouse.io) ("${userQuery}") ("hiring" OR "apply" OR "open role")`;
}

/**
 * Fetch a single page of Serper results.
 */
async function fetchSerperPage(
  searchQuery: string,
  page: number
): Promise<SerperSearchResponse> {
  const response = await fetch(SERPER_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: searchQuery,
      num: 10,
      page,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 429) throw new Error("API quota exceeded. Try again later.");
    if (response.status === 401 || response.status === 403) throw new Error("Serper API key is invalid.");
    throw new Error(`Serper API error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Execute a search against the Serper.dev API.
 * Fetches `count` results (default 30) by making parallel page requests.
 */
export async function searchJobs(
  query: string,
  start: number = 1,
  count: number = 30
): Promise<SearchResponse> {
  if (!SERPER_API_KEY) {
    throw new Error(
      "Missing Serper API key. Set SERPER_API_KEY in .env.local"
    );
  }

  const searchQuery = buildSearchQuery(query);
  const startPage = Math.ceil(start / 10);
  const numPages = Math.ceil(count / 10);

  // Fetch pages in parallel
  const pagePromises = Array.from({ length: numPages }, (_, i) =>
    fetchSerperPage(searchQuery, startPage + i)
  );
  const pages = await Promise.all(pagePromises);

  // Merge results, dedup by URL
  const seen = new Set<string>();
  const allRaw: JobResult[] = [];
  let totalResults = 0;
  let searchTime = 0;

  for (const data of pages) {
    totalResults = data.searchInformation?.totalResults || totalResults;
    searchTime = data.searchInformation?.timeTaken || searchTime;
    for (const item of data.organic || []) {
      if (!seen.has(item.link)) {
        seen.add(item.link);
        allRaw.push(transformItem(item));
      }
    }
  }

  const results = await enrichResults(allRaw);

  return {
    results,
    totalResults: totalResults || results.length,
    searchTime,
    query,
  };
}
