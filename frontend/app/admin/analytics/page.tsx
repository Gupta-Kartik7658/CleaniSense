// app/admin/analytics/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PollutionService } from '@/services/pollutionService';
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
      const res = await PollutionService.getAnalytics(timeframe);
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
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Average Air Quality Index</span>
            <Wind className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-950 dark:text-white">162 AQI</span>
            <span className="text-xs text-red-650 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              +4.8%
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Unhealthy for sensitive groups • Monitored daily</p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">AI Validation Accuracy</span>
            <Sparkles className="h-5 w-5 text-zinc-950 dark:text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-950 dark:text-white">94.8%</span>
            <span className="text-xs text-emerald-650 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              +1.2%
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Validated over 1.2K reports in the last 30 days</p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-405 dark:text-zinc-500 uppercase tracking-wider">Mean Resolution Duration</span>
            <Clock className="h-5 w-5 text-emerald-650" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-950 dark:text-white dark:text-white">4.2 hours</span>
            <span className="text-xs text-emerald-650 font-bold flex items-center gap-0.5">
              <TrendingDown className="h-3 w-3" />
              -15.4%
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Average response time by municipal officers</p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Weekly Pollution & Report Flow */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-zinc-950 dark:text-white dark:text-white">Incident & Resolution Flow</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Comparison of submitted vs resolved reports over selected timeframe</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer shadow-sm">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-72 flex items-end justify-between px-2 pt-4 relative border-b border-zinc-150 dark:border-zinc-800">
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-1/4 border-t border-zinc-100 dark:border-zinc-800/40 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-t border-zinc-100 dark:border-zinc-800/40 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-t border-zinc-100 dark:border-zinc-800/40 pointer-events-none" />

            {activeTrends.map((trend) => {
              const maxVal = timeframe === 'year' ? 160 : timeframe === 'month' ? 60 : 40;
              const complaintHeight = (trend.complaints / maxVal) * 100;
              const resolvedHeight = (trend.resolved / maxVal) * 100;

              return (
                <div key={trend.label} className="flex-1 flex flex-col items-center group relative z-10">
                  <div className="flex gap-1.5 items-end h-48 w-full justify-center">
                    {/* Complaints Bar */}
                    <div 
                      className="w-4 bg-zinc-950 dark:bg-zinc-200 rounded-t-sm transition-all duration-700 hover:bg-zinc-800 dark:hover:bg-white relative"
                      style={{ height: `${complaintHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-[10px] px-1.5 py-0.5 rounded border border-zinc-800 dark:border-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
                        Reports: {trend.complaints}
                      </div>
                    </div>
                    {/* Resolved Bar */}
                    <div 
                      className="w-4 bg-emerald-555 rounded-t-sm transition-all duration-700 hover:bg-emerald-500 relative"
                      style={{ height: `${resolvedHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-[10px] px-1.5 py-0.5 rounded border border-zinc-800 dark:border-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
                        Resolved: {trend.resolved}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 mt-2">{trend.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 bg-zinc-950 dark:bg-zinc-200 rounded-sm border border-zinc-300 dark:border-zinc-800" />
              <span className="dark:text-zinc-500 dark:text-zinc-400">Reports Registered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 bg-emerald-500 rounded-sm" />
              <span className="dark:text-zinc-500 dark:text-zinc-400">Reports Resolved</span>
            </div>
          </div>
        </div>

        {/* Category breakdown (Donut/Pie Mock representation) */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-zinc-950 dark:text-white dark:text-white">Category breakdown</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Proportional representation of logged issues</p>
          </div>

          <div className="my-6 flex items-center justify-center">
            <div className="relative h-44 w-44 rounded-full border-4 border-zinc-100 dark:border-zinc-850 flex items-center justify-center">
              <div className="absolute inset-1 border-8 border-zinc-950/5 dark:border-white/5 rounded-full" />
              <div className="absolute h-32 w-32 bg-zinc-50 dark:bg-zinc-950 rounded-full flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-850 shadow-inner">
                <span className="text-3xl font-extrabold text-zinc-950 dark:text-white dark:text-white">1,079</span>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Reports</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 dark:text-zinc-400 dark:text-zinc-300 font-medium">
                    <span className={`h-2.5 w-2.5 rounded-full ${cat.color}`} />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-bold text-zinc-950 dark:text-white">{cat.count} ({cat.percentage}%)</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}