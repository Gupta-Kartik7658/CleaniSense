import React from "react";
import { ReportItem } from "../../../types/dashboard";
import { StatusBadge } from "../StatusBadge";

interface ReportCardProps {
  report: ReportItem;
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <div className="section-card flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="text-base font-semibold text-[color:var(--foreground)]">{report.title}</h4>
          <StatusBadge status={report.status} />
        </div>
        <div className="grid gap-2 text-sm text-[color:var(--foreground-soft)] sm:grid-cols-2">
          <p>{report.locationName}</p>
          <p>{report.category || "Other"} category</p>
          <p>
            Severity:{" "}
            <span className="font-semibold text-[color:var(--foreground)]">
              {report.severity || "Moderate"}
            </span>
          </p>
          <p>
            Submitted{" "}
            {new Date(report.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <a href={`/complaints/${report.id}`} className="secondary-action whitespace-nowrap">
          View Details
        </a>
      </div>
    </div>
  );
}
