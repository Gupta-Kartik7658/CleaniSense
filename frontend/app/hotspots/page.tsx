"use client";

import React from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";

export default function HotspotsPage() {
  return (
    <PortalLayout>
      <div className="space-y-6 max-w-7xl mx-auto p-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Active Hotspots
          </h2>
          <span className="inline-block self-start text-xs bg-amber-50 text-amber-800 border border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 py-1.5 px-3.5 rounded-full font-bold">
            Geospatial Clustering Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[450px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Interactive Map Interface (Leaflet/OSM) Placeholder
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest">
              Hotspot List
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              No clusters detected from active reports.
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
