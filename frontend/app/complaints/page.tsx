"use client";

import React from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";

export default function ComplaintsPage() {
  return (
    <PortalLayout>
      <div className="space-y-6 max-w-7xl mx-auto p-4 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pollution Complaints
          </h2>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow-sm transition-colors text-sm cursor-pointer">
            Report Pollution
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center py-16">
          <p className="text-slate-500 dark:text-slate-400">
            No complaints reported yet. Click above to submit one.
          </p>
        </div>
      </div>
    </PortalLayout>
  );
}
