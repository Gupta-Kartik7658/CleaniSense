"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function ReportHero() {
  const t = useTranslations("dashboard.hero");

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden text-left p-6 md:p-8 transition-colors duration-150">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side Copy and CTAs */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("title")}
          </h3>
          <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed max-w-xl">
            {t("subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/complaints"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs py-3 px-6 rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all duration-150 cursor-pointer"
            >
              {t("ctaReport")}
            </Link>
            <Link
              href="/complaints/history"
              className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-750 dark:text-slate-300 dark:border-slate-700 font-bold text-center text-xs py-3 px-6 rounded-xl transition-all duration-150 cursor-pointer"
            >
              {t("ctaView")}
            </Link>
          </div>
        </div>

        {/* Right Side Workflow Flowchart */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-xl text-center">
          <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest block mb-4">
            Audited Incident Resolution Flow
          </span>
          <div className="flex flex-col sm:flex-row justify-around items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            <div className="space-y-0.5">
              <span className="text-lg block">👤</span>
              <p>Citizen</p>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">➔</span>
            <div className="space-y-0.5">
              <span className="text-lg block">🤖</span>
              <p className="text-emerald-600 dark:text-emerald-450">AI Verify</p>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">➔</span>
            <div className="space-y-0.5">
              <span className="text-lg block">🏛️</span>
              <p>Municipal</p>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">➔</span>
            <div className="space-y-0.5">
              <span className="text-lg block">✅</span>
              <p className="text-emerald-600 dark:text-emerald-450 font-extrabold">Resolved</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
