import React from 'react'

export default function HotspotsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Active Hotspots</h2>
        <span className="text-sm bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 py-1 px-3 rounded-full font-medium">
          Geospatial Clustering Enabled
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[450px] bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">Interactive Map Interface (Leaflet/OSM) Placeholder</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Hotspot List</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No clusters detected from active reports.</p>
        </div>
      </div>
    </div>
  )
}
