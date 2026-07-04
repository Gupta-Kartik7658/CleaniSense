import React from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "../SectionHeader";
import { ReportCard } from "./ReportCard";
import { ReportItem } from "../../../types/dashboard";
import { Skeleton } from "../../common/Skeleton";
import { EmptyState } from "../../common/EmptyState";

interface ReportsSectionProps {
  reports?: ReportItem[];
  loading?: boolean;
}

export function ReportsSection({
  reports,
  loading = false,
}: ReportsSectionProps) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push("/complaints/history");
  };

  const handleReportFirstIssue = () => {
    router.push("/complaints");
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Recent Reports" onAction={handleNavigate} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm space-y-3"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : !reports || reports.length === 0 ? (
        <EmptyState
          title="No reports submitted yet."
          description="Report your first environmental issue to help improve local community standards."
          actionLabel="Report an Issue"
          onAction={handleReportFirstIssue}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
