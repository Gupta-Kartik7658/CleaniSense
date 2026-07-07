// app/admin/reports/page.tsx
'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  MapPin,
  Activity,
  Printer,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  Wind,
  FileSpreadsheet,
  FileIcon,
  RefreshCw
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('pollution');
  const [dateRange, setDateRange] = useState('7d');
  const [format, setFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const reportTypes = [
    { id: 'pollution', label: 'Pollution Report', icon: Activity, desc: 'Air and land pollution statistics' },
    { id: 'aqi', label: 'AQI Analysis', icon: Wind, desc: 'Air Quality Index trends and predictions' },
    { id: 'users', label: 'User Activity', icon: Users, desc: 'User engagement and reports summary' },
    { id: 'hotspots', label: 'Hotspot Analysis', icon: MapPin, desc: 'Pollution hotspot clusters and trends' },
    { id: 'incidents', label: 'Incident Summary', icon: AlertTriangle, desc: 'All reported incidents overview' },
    { id: 'performance', label: 'Performance Metrics', icon: TrendingUp, desc: 'Resolution times and efficiency' },
  ];

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];

  const recentReports = [
    { id: 1, name: 'Weekly Pollution Report', type: 'pollution', date: '2024-12-15', size: '2.4 MB' },
    { id: 2, name: 'Monthly AQI Analysis', type: 'aqi', date: '2024-12-01', size: '4.1 MB' },
    { id: 3, name: 'User Activity Summary', type: 'users', date: '2024-12-10', size: '1.8 MB' },
    { id: 4, name: 'Hotspot Detection Report', type: 'hotspots', date: '2024-12-08', size: '3.2 MB' },
  ];

  const downloadReportFile = (name: string, type: string) => {
    const dateStr = new Date().toLocaleDateString('en-IN');
    const citiesStr = selectedCities.length > 0 ? selectedCities.join(', ') : 'All Cities';
    
    let content = '';
    let mimeType = 'text/plain';
    let fileExtension = 'txt';
    
    if (format === 'csv') {
      mimeType = 'text/csv';
      fileExtension = 'csv';
      content = `Report Name,${name}\nReport Type,${type}\nExport Date,${dateStr}\nTarget Cities,${citiesStr}\nDate Range,${dateRange}\n\n`;
      content += `Metric,Value,Status\n`;
      content += `Total Incidents,842,Active\n`;
      content += `Critical Pollution Hotspots,12,Pending Review\n`;
      content += `Mean Resolution Duration,4.2 hours,Normal\n`;
      content += `Air Quality Index average,162,Unhealthy\n`;
    } else {
      // Create a valid simple PDF content mock natively
      mimeType = 'application/pdf';
      fileExtension = 'pdf';
      content = `%PDF-1.4\n%${String.fromCharCode(226, 227, 207, 211)}\n`;
      content += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
      content += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
      content += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.275 841.889] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
      content += `4 0 obj\n<< /Length 200 >>\nstream\nBT\n/F1 14 Tf\n50 800 Td\n(CleaniSense System Report: ${name}) Tj\n0 -25 Td\n(Report Type: ${type}) Tj\n0 -25 Td\n(Generated Date: ${dateStr}) Tj\n0 -25 Td\n(Cities: ${citiesStr}) Tj\n0 -25 Td\n(Timeframe: ${dateRange}) Tj\n0 -50 Td\n(Status Summary: Operational. Metrics collected via CleaniSense gateway.) Tj\nET\nendstream\nendobj\n`;
      content += `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
      content += `xref\n0 6\n0000000000 65535 f \n0000000015 00000 n \n0000000074 00000 n \n0000000139 00000 n \n0000000276 00000 n \n0000000527 00000 n \n`;
      content += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n609\n%%EOF`;
    }

    const filename = `${name.replace(/\s+/g, '_')}_${dateRange}.${fileExtension}`;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGenerating(false);
    downloadReportFile(`${reportType.toUpperCase()} Report`, reportType);
  };

  return (
    <div className="space-y-6 fade-in text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">Generate Reports</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">Create and download comprehensive data reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
            <Clock className="h-4 w-4" />
            Scheduled Reports
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Report Configuration */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white mb-6">Report Configuration</h2>
          
          {/* Report Type Selection */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Report Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {reportTypes.map((type) => {
                const isSelected = reportType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-955 dark:border-white bg-zinc-50 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <type.icon className={`h-6 w-6 mb-2 ${
                      isSelected ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                    }`} />
                    <div className={`text-sm font-bold ${
                      isSelected ? 'text-zinc-950 dark:text-white' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-300 mt-1">{type.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Date Range</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '24h', label: 'Last 24 Hours' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last Quarter' },
                { value: '1y', label: 'Last Year' },
              ].map((range) => {
                const isSelected = dateRange === range.value;
                return (
                  <button
                    key={range.value}
                    onClick={() => setDateRange(range.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm'
                        : 'bg-white dark:bg-zinc-950 dark:text-zinc-400 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Cities */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Target Cities</label>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => {
                const isSelected = selectedCities.includes(city);
                return (
                  <button
                    key={city}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCities(prev => prev.filter(c => c !== city));
                      } else {
                        setSelectedCities(prev => [...prev, city]);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm'
                        : 'bg-white dark:bg-zinc-950 dark:text-zinc-400 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Selector */}
          <div className="mb-8">
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Format</label>
            <div className="flex gap-4">
              {[
                { value: 'pdf', label: 'PDF Document', icon: FileIcon },
                { value: 'csv', label: 'CSV Spreadsheet', icon: FileSpreadsheet },
              ].map((fmt) => {
                const isSelected = format === fmt.value;
                return (
                  <button
                    key={fmt.value}
                    onClick={() => setFormat(fmt.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-800 text-zinc-950 dark:text-white'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <fmt.icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full py-3 bg-zinc-950 dark:bg-white hover:bg-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 text-white dark:text-zinc-950 font-bold rounded-md transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-transparent"
          >
            {generating ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Compiling report data...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Generate and Download
              </>
            )}
          </button>
        </div>

        {/* Recent Reports List */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-zinc-950 dark:text-white dark:text-white mb-2">Export Library</h3>
            <p className="text-xs dark:text-zinc-500 dark:text-zinc-300">Previously generated system summaries</p>
            
            <div className="mt-6 space-y-3">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg flex items-center justify-between text-left"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{report.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{report.date} • {report.size}</p>
                  </div>
                  <button 
                    onClick={() => downloadReportFile(report.name, report.type)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:bg-zinc-800 transition-all cursor-pointer shrink-0 border border-transparent"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}