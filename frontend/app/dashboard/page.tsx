import React from 'react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Overview Dashboard</h2>
        <span className="text-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 py-1 px-3 rounded-full font-medium">
          Live Data
        </span>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Complaints', value: '0', color: 'border-blue-500' },
          { label: 'Active Hotspots', value: '0', color: 'border-amber-500' },
          { label: 'Weather Alerts', value: 'None', color: 'border-emerald-500' },
          { label: 'Critical Zones', value: '0', color: 'border-rose-500' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 ${stat.color} border border-slate-100 dark:border-slate-700`}>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Pollution monitoring data will appear here once active.</p>
      </div>
    </div>
  )
}
