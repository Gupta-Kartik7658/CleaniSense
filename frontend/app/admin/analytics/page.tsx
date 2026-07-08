// app/admin/analytics/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { complaintService } from '@/services/complaint';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Wind, 
  Activity, 
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getAnalytics({ timeframe });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically calculate trends based on selected timeframe
  const activeTrends = useMemo(() => {
    if (timeframe === 'day') {
      return [
        { label: '00:00', complaints: 3, resolved: 2 },
        { label: '04:00', complaints: 1, resolved: 1 },
        { label: '08:00', complaints: 8, resolved: 5 },
        { label: '12:00', complaints: 15, resolved: 10 },
        { label: '16:00', complaints: 12, resolved: 9 },
        { label: '20:00', complaints: 6, resolved: 5 },
      ];
    }
    if (timeframe === 'month') {
      return [
        { label: 'Week 1', complaints: 32, resolved: 28 },
        { label: 'Week 2', complaints: 45, resolved: 38 },
        { label: 'Week 3', complaints: 38, resolved: 30 },
        { label: 'Week 4', complaints: 52, resolved: 48 },
      ];
    }
    if (timeframe === 'year') {
      return [
        { label: 'Jan-Feb', complaints: 95, resolved: 82 },
        { label: 'Mar-Apr', complaints: 110, resolved: 95 },
        { label: 'May-Jun', complaints: 130, resolved: 115 },
        { label: 'Jul-Aug', complaints: 88, resolved: 80 },
        { label: 'Sep-Oct', complaints: 145, resolved: 130 },
        { label: 'Nov-Dec', complaints: 125, resolved: 110 },
      ];
    }
    // Default 'week'
    return [
      { label: 'Mon', complaints: 14, resolved: 12 },
      { label: 'Tue', complaints: 22, resolved: 15 },
      { label: 'Wed', complaints: 11, resolved: 10 },
      { label: 'Thu', complaints: 35, resolved: 28 },
      { label: 'Fri', complaints: 28, resolved: 24 },
      { label: 'Sat', complaints: 8, resolved: 7 },
      { label: 'Sun', complaints: 5, resolved: 5 },
    ];
  }, [timeframe]);

  const categoryBreakdown = [
    { name: 'Air Pollution (AQI)', count: 485, color: 'bg-red-500', percentage: 45 },
    { name: 'Illegal Waste Dump', count: 324, color: 'bg-orange-500', percentage: 30 },
    { name: 'Water Contamination', count: 162, color: 'bg-cyan-500', percentage: 15 },
    { name: 'Industrial Noise', count: 108, color: 'bg-yellow-500', percentage: 10 },
  ];

  return (
    <div className="space-y-8 fade-in text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-zinc-950 dark:text-white" />
            System Analytics
          </h1>
          <p className="mt-1 text-sm dark:text-zinc-500 dark:text-zinc-300">Detailed pollution trends, category distributions, and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Timeframe selector with no black backgrounds in light mode */}
          <div className="inline-flex rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-1 shadow-sm">
            {(['day', 'week', 'month', 'year'] as const).map((t) => {
              const isSelected = timeframe === t;
              return (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-white font-extrabold shadow-sm' 
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <button 
            onClick={loadAnalytics}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Critical Severity Reports</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-950 dark:text-white">
              {loading ? '...' : (data?.severity_distribution?.find((s: any) => s.label.toLowerCase() === 'critical')?.count ?? 0)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Verified reports of critical scale</p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">High Severity Reports</span>
            <Sparkles className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-950 dark:text-white">
              {loading ? '...' : (data?.severity_distribution?.find((s: any) => s.label.toLowerCase() === 'high')?.count ?? 0)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Reports flagged with high priority</p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-405 dark:text-zinc-500 uppercase tracking-wider">Medium Severity Reports</span>
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-950 dark:text-white dark:text-white">
              {loading ? '...' : (data?.severity_distribution?.find((s: any) => s.label.toLowerCase() === 'medium')?.count ?? 0)}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Reports flagged with medium priority</p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Status Distribution Flow */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-zinc-950 dark:text-white">Workflow Status Distribution</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Comparison of report counts grouped by workflow lifecycle states</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50" disabled>
              Export Unavailable
            </button>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-72 flex items-end justify-between px-2 pt-4 relative border-b border-zinc-150 dark:border-zinc-800">
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-1/4 border-t border-zinc-100 dark:border-zinc-800/40 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-t border-zinc-100 dark:border-zinc-800/40 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-t border-zinc-100 dark:border-zinc-800/40 pointer-events-none" />

            {loading ? (
              <div className="w-full text-center py-20 text-xs text-zinc-400">Loading charts...</div>
            ) : !data?.status_distribution || data.status_distribution.length === 0 ? (
              <div className="w-full text-center py-20 text-xs text-zinc-400">No status distributions available</div>
            ) : (
              (data.status_distribution as any[]).map((item: any) => {
                const maxVal = Math.max(...(data.status_distribution as any[]).map((d: any) => d.count), 1);
                const heightPercentage = (item.count / maxVal) * 100;

                return (
                  <div key={item.label} className="flex-1 flex flex-col items-center group relative z-10">
                    <div className="flex items-end h-48 w-full justify-center">
                      <div 
                        className="w-6 bg-zinc-950 dark:bg-zinc-200 rounded-t-sm transition-all duration-700 hover:bg-zinc-800 dark:hover:bg-white relative"
                        style={{ height: `${heightPercentage}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-[10px] px-1.5 py-0.5 rounded border border-zinc-800 dark:border-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
                          {item.count}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 mt-2 capitalize truncate max-w-[70px]">{item.label.replace(/_/g, ' ')}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 bg-zinc-950 dark:bg-zinc-200 rounded-sm border border-zinc-300 dark:border-zinc-800" />
              <span className="dark:text-zinc-500 dark:text-zinc-400">Workflow State Metrics</span>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-zinc-950 dark:text-white">Category breakdown</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Proportional representation of logged issues</p>
          </div>

          <div className="my-6 flex items-center justify-center">
            <div className="relative h-44 w-44 rounded-full border-4 border-zinc-100 dark:border-zinc-850 flex items-center justify-center">
              <div className="absolute inset-1 border-8 border-zinc-950/5 dark:border-white/5 rounded-full" />
              <div className="absolute h-32 w-32 bg-zinc-50 dark:bg-zinc-950 rounded-full flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-850 shadow-inner">
                <span className="text-3xl font-extrabold text-zinc-950 dark:text-white">
                  {loading ? '...' : (data?.category_distribution || []).reduce((acc: number, c: any) => acc + c.count, 0)}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Reports</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-4 text-xs text-zinc-400">Loading categories...</div>
            ) : !data?.category_distribution || data.category_distribution.length === 0 ? (
              <div className="text-center py-4 text-xs text-zinc-400">No categories found</div>
            ) : (
              (data.category_distribution as any[]).map((cat: any, i: number) => {
                const totalCount = (data.category_distribution as any[]).reduce((acc: number, c: any) => acc + c.count, 0) || 1;
                const percentage = Math.round((cat.count / totalCount) * 100);
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-blue-500'];
                const color = colors[i % colors.length];

                return (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 dark:text-zinc-400 dark:text-zinc-300 font-medium">
                        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                        <span className="capitalize">{cat.label}</span>
                      </div>
                      <span className="font-bold text-zinc-950 dark:text-white">{cat.count} ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}