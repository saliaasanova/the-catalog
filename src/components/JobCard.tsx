"use client";

import { useState } from "react";
import { JobResult } from "@/types";

interface JobCardProps {
  job: JobResult;
}

function slugToColor(slug: string): string {
  const colors = ["#d4622b", "#2a7a6e", "#8b6914", "#6b4c3b", "#4a6741", "#7a5c8a"];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function JobCard({ job }: JobCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="py-1.5 font-mono text-[11.5px] leading-[1.6]">
        <div className="mb-0.5">
          <span className="inline-flex items-center gap-1.5 align-baseline">
            {!imgError ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${job.companySlug}.com&sz=32`}
                alt=""
                width={14}
                height={14}
                className="inline-block rounded-sm"
                onError={() => setImgError(true)}
              />
            ) : (
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm text-[8px] font-bold text-bg-card shrink-0"
                style={{ backgroundColor: slugToColor(job.companySlug) }}
              >
                {job.company.charAt(0)}
              </span>
            )}
            <span className="font-bold uppercase text-text">
              {job.company}
            </span>
          </span>
          {" \u2014 "}
          <span className="text-text group-hover:text-accent transition-colors duration-150">
            {job.title}
          </span>
          {job.location && (
            <span className="text-teal">
              {" \u00b7 "}
              {job.location}
            </span>
          )}
          <span className="text-text-muted">
            {" \u00b7 "}
            {job.source}
          </span>
        </div>
        {job.snippet ? (
          <div className="text-text-mid">
            {job.snippet}{" "}
            <span className="text-accent group-hover:underline whitespace-nowrap">
              Apply &rarr;
            </span>
          </div>
        ) : (
          <div className="text-text-mid">
            <span className="text-accent group-hover:underline whitespace-nowrap">
              View listing &rarr;
            </span>
          </div>
        )}
      </div>
    </a>
  );
}
