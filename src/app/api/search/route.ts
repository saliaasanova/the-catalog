import { NextRequest, NextResponse } from "next/server";
import { searchJobs } from "@/lib/serper-search";
import { SearchError } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const startParam = searchParams.get("start");

  // Validate query parameter
  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      {
        error: "Missing required parameter: q",
        details: "Provide a job title or keywords to search.",
      } satisfies SearchError,
      { status: 400 }
    );
  }

  // Validate query length
  if (query.length > 200) {
    return NextResponse.json(
      {
        error: "Query too long",
        details: "Query must be 200 characters or fewer.",
      } satisfies SearchError,
      { status: 400 }
    );
  }

  const start = startParam ? parseInt(startParam, 10) : 1;
  if (isNaN(start) || start < 1 || start > 91) {
    return NextResponse.json(
      {
        error: "Invalid start parameter",
        details: "Must be between 1 and 91.",
      } satisfies SearchError,
      { status: 400 }
    );
  }

  const countParam = searchParams.get("count");
  const count = countParam ? parseInt(countParam, 10) : 50;

  try {
    const data = await searchJobs(query.trim(), start, Math.min(count, 50));
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    let status = 500;
    if (message.includes("quota exceeded")) status = 429;
    if (message.includes("invalid") || message.includes("not enabled"))
      status = 403;
    if (message.includes("Missing Serper")) status = 503;

    return NextResponse.json({ error: message } satisfies SearchError, {
      status,
    });
  }
}
