import React from "react";
import { ReportItem } from "../../../types/dashboard";
import { StatusBadge } from "../StatusBadge";

interface ReportCardProps {
  report: ReportItem;
}

export function ReportCard({ report }: ReportCardProps) {
  const severityScore = report.severityScore;
  const severityLabel = report.severity
    ? report.severity.charAt(0).toUpperCase() + report.severity.slice(1)
    : "Unscored";

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left transition-colors duration-150">
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">{report.title}</h4>
          <StatusBadge status={report.status} />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-350 flex items-center gap-1">
          <span className="text-slate-400">📍</span>
          <span>{report.locationName}</span>
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Submitted on{" "}
          {new Date(report.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center dark:border-amber-900/70 dark:bg-amber-950/20">
          <div className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Severity
          </div>
          <div className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
            {severityScore !== undefined && severityScore !== null
              ? `${Math.round(severityScore)}%`
              : severityLabel}
          </div>
        </div>
        <a
          href={`/complaints/${report.id}`}
          className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-750 dark:text-slate-300 dark:border-slate-700 text-xs font-bold px-4 py-2 border rounded-lg transition-colors cursor-pointer text-center block w-full sm:w-auto"
        >
          View Details
        </a>
      </div>
    </div>
  );
}
