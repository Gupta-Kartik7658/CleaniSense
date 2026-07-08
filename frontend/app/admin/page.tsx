// app/admin/page.tsx (Upgraded Next.js 15 Admin Dashboard - Geist Dynamic Light/Dark Theme)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dashboardService } from '@/services/dashboard';
import { complaintService } from '@/services/complaint';
import { PollutionService } from '@/services/pollutionService';
import { IncidentReport } from '@/types/pollution';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Thermometer,
  BarChart3,
  TrendingDown,
  Filter,
  Eye,
  MapPinned,
  Building2,
  Wind,
  Droplets,
  Gauge,
  Radio,
  Settings,
  Target,
  Shield,
  Zap,
  X,
  UserCheck,
  Check,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('24h');
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [detailedComplaint, setDetailedComplaint] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('Rajesh Kumar');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getDashboard();
      setDashboardData(data);

      const recentReports = data.recent_reports || [];
      const mapped = recentReports.map((c: any) => ({
        id: c.id,
        description: c.description || c.title || 'No Description',
        severity: (c.severity?.toLowerCase() || 'medium') as any,
        status: (c.status?.toLowerCase() || 'submitted') as any,
        type: c.category?.name?.toLowerCase() || 'general',
        reportedAt: c.created_at || new Date().toISOString(),
        userName: c.user?.name || 'Anonymous Citizen',
        userEmail: c.user?.email || 'N/A',
        location: {
          latitude: c.latitude || 0,
          longitude: c.longitude || 0,
          address: c.location_name || 'Location Verified',
          city: 'Mumbai',
          district: '',
          state: ''
        },
        mediaUrls: [],
        userId: c.user_id || '',
        updatedAt: c.updated_at || c.created_at || new Date().toISOString()
      }));
      setIncidents(mapped as any as IncidentReport[]);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIncident = async (incident: IncidentReport) => {
    setSelectedIncident(incident);
    setDetailedComplaint(null);
    try {
      const detail = await complaintService.getComplaintDetail(incident.id);
      setDetailedComplaint(detail);
    } catch (e) {
      console.error('Failed to retrieve complaint detail:', e);
    }
  };

  const handleUpdateStatus = async (status: 'investigating' | 'resolved' | 'dismissed') => {
    if (!selectedIncident) return;
    setIsActionLoading(true);
    try {
      let mappedStatus = 'in_progress';
      if (status === 'resolved') {
        mappedStatus = 'resolved';
      } else if (status === 'dismissed') {
        mappedStatus = 'dismissed';
      } else {
        mappedStatus = 'investigating';
      }

      await PollutionService.updateIncidentStatus(
        selectedIncident.id,
        mappedStatus,
        actionNotes || undefined
      );
      
      // Load details again to show fresh timeline
      const freshDetail = await complaintService.getComplaintDetail(selectedIncident.id);
      setDetailedComplaint(freshDetail);
      
      // Update selected incident state
      setSelectedIncident(prev => prev ? { ...prev, status: mappedStatus as any } : null);
      setActionNotes('');
      loadDashboardData();
    } catch (e) {
      console.error('Status change error:', e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssignOfficer = async () => {
    if (!selectedIncident) return;
    setIsActionLoading(true);
    try {
      await PollutionService.assignIncident(selectedIncident.id, selectedOfficer);
      
      const freshDetail = await complaintService.getComplaintDetail(selectedIncident.id);
      setDetailedComplaint(freshDetail);

      setSelectedIncident(prev => prev ? { ...prev, status: 'investigating' as any, assignedTo: selectedOfficer } : null);
      loadDashboardData();
    } catch (e) {
      console.error('Assignment error:', e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'air': return '💨 Air Quality';
      case 'land': return '🗑️ Land Waste';
      case 'water': return '💧 Water Pollution';
      case 'noise': return '📢 Industrial Noise';
      default: return '📍 Incident';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400';
      case 'high': return 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400';
      case 'medium': return 'border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400';
      default: return 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900';
      case 'dismissed': return 'bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
      case 'investigating': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      default: return 'bg-amber-50 dark:bg-amber-950/20 text-amber-750 dark:text-amber-400 border-amber-250 dark:border-amber-900';
    }
  };

  return (
    <div className="space-y-8 fade-in text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-lg bg-zinc-950 p-8 border border-zinc-800 text-left">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-zinc-800 rounded">
                  <Shield className="h-5 w-5 text-zinc-400" />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Administrator Workspace</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Smart City Dashboard</h1>
              <p className="text-zinc-400 text-sm max-w-xl">
                Hyperlocal community environmental monitoring and AI-powered pollution predictions.
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs text-zinc-500 font-medium">
              <div className="text-right">
                <div>System Status</div>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Operational
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-right">
                <div>AI Classifier</div>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Reports', value: dashboardData?.overview?.total_reports ?? 0, icon: Building2 },
              { label: 'Active Issues', value: dashboardData?.overview?.active_reports ?? 0, icon: Target },
              { label: 'Resolved Issues', value: dashboardData?.overview?.resolved_reports ?? 0, icon: Clock },
              { label: 'Pending Action', value: dashboardData?.overview?.pending_reports ?? 0, icon: Users },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-md p-3 text-left">
                <div className="flex items-center gap-2 text-zinc-400">
                  <item.icon className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">{loading ? '...' : item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Callout */}
      {dashboardData && dashboardData.overview?.pending_reports > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-left flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-950 dark:text-red-200">Immediate Review Required</h4>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              There are {dashboardData.overview.pending_reports} active pending reports currently awaiting municipality review.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: 'Total Reports', value: dashboardData?.overview?.total_reports ?? 0, icon: Activity },
          { name: 'Active Reports', value: dashboardData?.overview?.active_reports ?? 0, icon: AlertTriangle },
          { name: 'Resolved Reports', value: dashboardData?.overview?.resolved_reports ?? 0, icon: CheckCircle },
          { name: 'Pending Reports', value: dashboardData?.overview?.pending_reports ?? 0, icon: Clock },
        ].map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-lg p-6 text-left relative overflow-hidden group hover:border-zinc-350 dark:hover:border-zinc-700 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-900 dark:text-zinc-950 dark:text-white group-hover:bg-zinc-950 dark:group-hover:bg-white group-hover:text-zinc-950 dark:text-white dark:group-hover:text-zinc-950 transition-colors">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{stat.name}</div>
            <div className="text-2xl font-extrabold text-zinc-950 dark:text-white mt-1">
              {loading ? <span className="h-7 w-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse inline-block" /> : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Placeholder Panel */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col text-left">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-zinc-800 dark:text-zinc-200" />
                Live Incident Map
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Community verified pollution coordinates</p>
            </div>
            <Link 
              href="/admin/map" 
              className="text-xs dark:text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-950 dark:text-white font-bold flex items-center gap-1"
            >
              Expand Map
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 flex-1 flex flex-col items-center justify-center min-h-[300px] bg-[#fafafa] dark:bg-zinc-950">
            <MapPinned className="h-10 w-10 text-zinc-400 dark:text-zinc-400 mb-3" />
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 dark:text-zinc-200">Map Canvas Interface</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center max-w-xs leading-normal">
              Click "Expand Map" to review location points, filters, and hotspot cluster trends.
            </p>
          </div>
        </div>

        {/* Recent Incidents Feed */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col text-left">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-zinc-950 dark:text-white">Recent Logs</h3>
            <Link href="/admin/media" className="text-xs dark:text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-950 dark:text-white font-bold transition-colors">
              Review Flow
            </Link>
          </div>
          
          <div className="p-4 space-y-3 overflow-y-auto max-h-[350px]">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded animate-pulse" />
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">No incidents registered.</div>
            ) : (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => handleSelectIncident(incident)}
                  className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-100 dark:bg-zinc-800/40 transition-all cursor-pointer text-left"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1">{incident.description || 'No Description'}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border capitalize font-semibold shrink-0 ${getSeverityBadge(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                      {getTypeLabel(incident.type)}
                    </span>
                    <span>{new Date(incident.reportedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Incident Detail Drawer / Modal Overlay */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Overlay mask */}
          <div 
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectedIncident(null)}
          />
          
          {/* Drawer container */}
          <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl p-6 text-left z-10 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <div>
                <span className={`text-[10px] px-2 py-0.5 rounded border capitalize font-bold ${getSeverityBadge(selectedIncident.severity)}`}>
                  {selectedIncident.severity} Severity
                </span>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white mt-2">Inspect Incident Log</h3>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 text-zinc-400 hover:dark:text-zinc-400 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Description</p>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mt-1">{selectedIncident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Logged By</p>
                  <p className="text-xs font-bold dark:text-zinc-200 dark:text-zinc-200 mt-1">{selectedIncident.userName}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{selectedIncident.userEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Coordinates</p>
                  <p className="text-xs dark:text-zinc-200 dark:text-zinc-200 mt-1 font-mono">
                    {selectedIncident.location.latitude.toFixed(4)}, {selectedIncident.location.longitude.toFixed(4)}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{selectedIncident.location.address || 'Address Verified'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Log Type</p>
                  <p className="text-xs dark:text-zinc-200 dark:text-zinc-200 font-semibold mt-1">{getTypeLabel(selectedIncident.type)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Workflow Status</p>
                  <div className="mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded border capitalize font-semibold ${getStatusBadge(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Media images if present */}
              {detailedComplaint?.attachments && detailedComplaint.attachments.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Reported Media</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {detailedComplaint.attachments.map((a: any, i: number) => (
                      <img 
                        key={a.id || i} 
                        src={a.public_url} 
                        alt={a.file_name || "Attachment"} 
                        className="rounded-lg object-cover w-full h-32 border border-zinc-200 dark:border-zinc-800"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Log */}
              {detailedComplaint?.timeline && detailedComplaint.timeline.length > 0 && (
                <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Workflow Timeline</p>
                  <div className="mt-3 space-y-3">
                    {detailedComplaint.timeline.map((evt: any) => (
                      <div key={evt.id} className="flex gap-2 text-xs">
                        <span className="text-zinc-400 dark:text-zinc-500 shrink-0 font-medium">{new Date(evt.created_at).toLocaleDateString()}</span>
                        <div className="flex-1">
                          <span className="font-bold capitalize text-zinc-800 dark:text-zinc-200">{evt.status.replace(/_/g, ' ')}</span>
                          {evt.remarks && <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-0.5">{evt.remarks}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment actions */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-150 dark:border-zinc-850 space-y-3">
                <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5" />
                  Assign Municipal Officer
                </p>
                <div className="flex gap-2">
                  <select 
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-xs rounded-md px-2 py-1.5 text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400"
                  >
                    <option value="Rajesh Kumar">Rajesh Kumar (Air Control)</option>
                    <option value="Priya Sharma">Priya Sharma (Waste Manager)</option>
                    <option value="Amit Patel">Amit Patel (Water Quality)</option>
                  </select>
                  <button
                    onClick={handleAssignOfficer}
                    disabled={isActionLoading}
                    className="px-3 py-1.5 bg-zinc-950 dark:bg-white hover:bg-zinc-900 dark:hover:bg-zinc-100 text-zinc-950 dark:text-white dark:text-zinc-950 text-xs font-bold rounded-md transition-colors cursor-pointer"
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* Remarks/Notes */}
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Action Remarks</p>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={2}
                  placeholder="Enter notes explaining status transition..."
                  className="w-full mt-1.5 px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-450 dark:focus:border-zinc-600 resize-none"
                />
              </div>
            </div>

            {/* Action buttons footer */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6 grid grid-cols-3 gap-2">
              <button
                onClick={() => handleUpdateStatus('investigating')}
                disabled={isActionLoading}
                className="py-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 disabled:opacity-50 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
              >
                Investigate
              </button>
              <button
                onClick={() => handleUpdateStatus('resolved')}
                disabled={isActionLoading}
                className="py-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-50 text-xs font-bold rounded-lg border border-emerald-250 dark:border-emerald-900 transition-colors cursor-pointer"
              >
                Resolve
              </button>
              <button
                onClick={() => handleUpdateStatus('dismissed')}
                disabled={isActionLoading}
                className="py-2.5 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:text-zinc-300 hover:bg-zinc-100 disabled:opacity-50 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Layout - Quick Actions grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-lg p-6 text-left">
        <h3 className="font-bold text-zinc-950 dark:text-white mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Generate Reports', icon: BarChart3, path: '/admin/reports' },
            { label: 'Review Media Library', icon: Eye, path: '/admin/media' },
            { label: 'Manage Accounts', icon: Users, path: '/admin/users' },
            { label: 'System Configuration', icon: Settings, path: '/admin/settings' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.path}
              className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 hover:border-zinc-350 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-zinc-950 dark:text-white p-2 mb-2 group-hover:bg-zinc-950 dark:group-hover:bg-white group-hover:text-zinc-950 dark:text-white dark:group-hover:text-zinc-950 transition-colors flex items-center justify-center">
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
