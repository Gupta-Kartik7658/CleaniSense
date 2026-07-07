import React from "react";
import { useTranslations } from "next-intl";

export function DashboardHeader() {
  const t = useTranslations("dashboard");
  const today = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="hero-card topo-grid relative overflow-hidden">
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <span className="page-kicker">Citizen Portal</span>
          <h2 className="page-title max-w-2xl text-[clamp(2rem,3.4vw,3.6rem)]">
            {t("title")}
          </h2>
          <p className="page-copy max-w-xl">
            {t("subtitle")}
          </p>
        </div>
        <div className="section-card max-w-sm space-y-3 lg:w-[320px]">
          <div className="flex items-center justify-between">
            <p className="metric-label">Status Window</p>
            <span className="pill-badge tone-accent">Live</span>
          </div>
          <p className="text-sm font-medium text-[color:var(--foreground)]">
            Track reports, follow municipal responses, and monitor nearby hotspots from one workspace.
          </p>
          <p className="fine-print">Updated for {today}</p>
        </div>
      </div>
    </div>
  );
}
