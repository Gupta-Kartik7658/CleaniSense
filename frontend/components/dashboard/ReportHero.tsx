"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function ReportHero() {
  const t = useTranslations("dashboard.hero");

  return (
    <div className="hero-card topo-grid relative overflow-hidden text-left">
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-5">
          <span className="page-kicker">Available Today</span>
          <div className="space-y-3">
            <h3 className="text-[clamp(1.8rem,3vw,3rem)] font-semibold tracking-tight text-[color:var(--foreground)]">
              {t("title")}
            </h3>
            <p className="page-copy max-w-2xl">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/complaints" className="primary-action">
              {t("ctaReport")}
            </Link>
            <Link href="/complaints/history" className="secondary-action">
              {t("ctaView")}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Photo Evidence", "Upload visual proof with each complaint."],
              ["Live Tracking", "Follow review, assignment, and resolution states."],
              ["Local Hotspots", "Review active clusters around your area."],
            ].map(([title, copy]) => (
              <div key={title} className="metric-card min-h-[130px]">
                <p className="metric-label">{title}</p>
                <p className="mt-4 text-sm leading-6 text-[color:var(--foreground-soft)]">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <p className="metric-label">Verified Workflow</p>
            <h4 className="text-xl font-semibold tracking-tight text-[color:var(--foreground)]">
              Citizen reporting with a clear review trail
            </h4>
            <p className="fine-print">
              The current frontend focuses on the live citizen portal: complaint submission, tracking, hotspot review, and profile preferences.
            </p>
          </div>
          <div className="space-y-3">
            {[
              ["01", "Report issue", "Add category, location, and attachments."],
              ["02", "Review status", "Watch the complaint move through the lifecycle."],
              ["03", "Inspect response", "Read municipal updates and outcome evidence."],
            ].map(([step, title, copy]) => (
              <div key={step} className="flex items-start gap-3 rounded-[20px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-sm font-semibold text-[color:var(--accent-strong)]">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">{title}</p>
                  <p className="fine-print mt-1">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
