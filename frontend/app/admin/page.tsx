// app/admin/page.tsx (Merged Geist Theme Admin Dashboard)
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { dashboardService } from '@/services/dashboard';
import { complaintService } from '@/services/complaint';
import { PollutionService } from '@/services/pollutionService';
import { IncidentReport } from '@/types/pollution';
import { AdminMapCanvas } from '@/components/admin/AdminMapCanvas';
import { AdminHotspotItem } from '@/components/admin/AdminIncidentsLeafletMap';
import { matchesCategoryFilter, filterComplaintsByPollutionType } from '@/utils/hotspotFilters';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MapPin,
  Building2,
  Search,
  RefreshCw,
  ChevronLeft,
  AlertCircle,
  X,
  CheckCircle2,
  FileText,
  Shield,
  Zap
} from 'lucide-react';

import { useAuth } from '@/providers/AuthProvider';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [hotspotsList, setHotspotsList] = useState<AdminHotspotItem[]>([]);
  const [singlesList, setSinglesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Map Navigation & Filter States
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'hotspots' | 'incidents' | 'severity' | 'alphabetical'>('hotspots');
  const [searchCity, setSearchCity] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<AdminHotspotItem | null>(null);
  const [mapMode, setMapMode] = useState<'vector' | 'clusters'>('vector');

  // Drawer / Inspector states
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [detailedComplaint, setDetailedComplaint] = useState<any | null>(null);
  const [officersList, setOfficersList] = useState<string[]>([]);
  const [isAssigningOfficer, setIsAssigningOfficer] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    loadDashboardData();
    PollutionService.getOfficers().then((list) => {
      if (Array.isArray(list)) setOfficersList(list);
    }).catch((e) => console.error("Failed to fetch officers list:", e));
  }, [user, authLoading]);

  const handleAssignOfficer = async (officerName: string) => {
    if (!selectedIncident || !officerName) return;
    setIsAssigningOfficer(true);
    try {
      await PollutionService.assignOfficer(selectedIncident.id, officerName);
      setSelectedIncident((prev: any) => prev ? { ...prev, assignedOfficer: officerName } : null);
      loadDashboardData();
    } catch (err: any) {
      console.error('Failed to assign officer:', err);
    } finally {
      setIsAssigningOfficer(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch System-Wide Admin Stats, Incidents & Hotspots
      const [adminStats, incData, hotspotRes] = await Promise.all([
        PollutionService.getDashboardStats().catch(() => null),
        PollutionService.getIncidents({ limit: 100 }).catch(() => ({ incidents: [], total: 0 })),
        api.get('/admin/hotspots').catch(() => null)
      ]);

      setDashboardData(adminStats);
      const incList = incData.incidents || [];
      setIncidents(incList);

      // 2. Process Map & Hotspot Clusters
      const hData = hotspotRes?.data || hotspotRes || {};
      const hotspots = (hData.hotspots || []).map((h: any) => ({
        id: String(h.id),
        latitude: Number(h.center?.latitude || h.latitude),
        longitude: Number(h.center?.longitude || h.longitude),
        count: Number(h.incidentCount || h.count || 2),
        radius_meters: Number(h.radius || h.radius_meters || 50.0),
        city: String(h.center?.city || 'Local Region'),
        district: String(h.center?.district || 'Incident Zone'),
        dominantType: String(h.dominantType || 'General'),
        averageSeverity: Number(h.averageSeverity || 3.5),
        complaints: h.complaints || []
      }));

      setHotspotsList(hotspots);
      setSinglesList(hData.singles || []);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDominantIcon = (type: string = '') => {
    const t = type.toLowerCase();
    if (t.includes('air') || t.includes('aqi') || t.includes('smoke')) return '💨';
    if (t.includes('water') || t.includes('sewage') || t.includes('drain')) return '💧';
    if (t.includes('land') || t.includes('waste') || t.includes('garbage')) return '🗑️';
    if (t.includes('noise') || t.includes('sound')) return '📢';
    return '📍';
  };

  const getTypeTheme = (type: string = '') => {
    const t = type.toLowerCase();
    if (t.includes('air') || t.includes('aqi') || t.includes('smoke')) {
      return 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    }
    if (t.includes('water') || t.includes('sewage') || t.includes('drain')) {
      return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
    if (t.includes('noise') || t.includes('sound')) {
      return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    }
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700';
  };

  function getAreaName(locationName?: string, fallbackCity?: string, index: number = 0): string {
    if (!locationName) return `Area Zone ${index + 1}`;
    let clean = locationName.replace(/\(\s*[-+]?\d*\.?\d+\s*,\s*[-+]?\d*\.?\d+\s*\)/gi, '').trim();
    if (clean.toLowerCase().includes('gps coordinates location')) {
      clean = clean.replace(/gps coordinates location/gi, '').trim();
    }
    if (!clean) return `Locality Zone ${index + 1}`;
    const parts = clean.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      if (fallbackCity && parts[0].toLowerCase() === fallbackCity.toLowerCase()) {
        return parts[1] || parts[0];
      }
      return parts[0];
    }
    return parts[0] || `Area Zone ${index + 1}`;
  }

  // Level 1: Group hotspots dynamically by City
  const cityGroupings = useMemo(() => {
    const cityMap: Record<string, {
      cityName: string;
      hotspotCount: number;
      incidentCount: number;
      filteredIncidentCount: number;
      dominantType: string;
      totalSeverity: number;
      hotspots: AdminHotspotItem[];
    }> = {};

    hotspotsList.forEach((h: AdminHotspotItem) => {
      const cityRaw = h.city || 'Local Region';
      const type = h.dominantType || 'General';
      const count = h.count || 1;
      const severity = h.averageSeverity || 3.5;

      let filteredCount = count;
      if (selectedType !== 'all') {
        // Use shared filter utility for comprehensive keyword matching
        const matchingComplaints = filterComplaintsByPollutionType(
          (h.complaints || []) as Array<{category_name?: string}>,
          selectedType
        );
        // Also consider dominant type — hotspot counts if dom type matches even with no complaint details
        const domMatches = matchesCategoryFilter(h.dominantType, selectedType);
        filteredCount = matchingComplaints.length > 0 ? matchingComplaints.length : (domMatches ? count : 0);
      }

      if (!cityMap[cityRaw]) {
        cityMap[cityRaw] = {
          cityName: cityRaw,
          hotspotCount: 0,
          incidentCount: 0,
          filteredIncidentCount: 0,
          dominantType: type,
          totalSeverity: 0,
          hotspots: []
        };
      }

      cityMap[cityRaw].hotspotCount += 1;
      cityMap[cityRaw].incidentCount += count;
      cityMap[cityRaw].filteredIncidentCount += filteredCount;
      cityMap[cityRaw].totalSeverity += severity;
      cityMap[cityRaw].hotspots.push(h);
    });

    let result = Object.values(cityMap).map(c => ({
      ...c,
      averageSeverity: roundVal(c.totalSeverity / (c.hotspotCount || 1))
    }));

    if (selectedType !== 'all') {
      result = result.filter(c => {
        // Keep city if it has filtered incidents (matching complaints or matching dominant type)
        return c.filteredIncidentCount > 0;
      });
    }

    if (searchCity.trim()) {
      const term = searchCity.toLowerCase();
      result = result.filter(c => {
        // 1. City Name or Dominant Type match
        if (
          (c.cityName && c.cityName.toLowerCase().includes(term)) ||
          (c.dominantType && c.dominantType.toLowerCase().includes(term))
        ) {
          return true;
        }
        // 2. Check inner hotspots & complaints
        return (c.hotspots || []).some(h => {
          if (
            (h.city && h.city.toLowerCase().includes(term)) ||
            (h.district && h.district.toLowerCase().includes(term)) ||
            (h.dominantType && h.dominantType.toLowerCase().includes(term)) ||
            (h.id && h.id.toLowerCase().includes(term))
          ) {
            return true;
          }
          return (h.complaints || []).some((comp: any) => {
            return (
              (comp.id && String(comp.id).toLowerCase().includes(term)) ||
              (comp.title && String(comp.title).toLowerCase().includes(term)) ||
              (comp.description && String(comp.description).toLowerCase().includes(term)) ||
              (comp.location_name && String(comp.location_name).toLowerCase().includes(term)) ||
              (comp.category_name && String(comp.category_name).toLowerCase().includes(term)) ||
              (comp.category && String(comp.category).toLowerCase().includes(term)) ||
              (comp.status && String(comp.status).toLowerCase().includes(term)) ||
              (comp.severity && String(comp.severity).toLowerCase().includes(term)) ||
              (comp.assigned_officer && String(comp.assigned_officer).toLowerCase().includes(term)) ||
              (comp.officer_name && String(comp.officer_name).toLowerCase().includes(term)) ||
              (comp.resolution_summary && String(comp.resolution_summary).toLowerCase().includes(term)) ||
              (comp.resolutionActions && String(comp.resolutionActions).toLowerCase().includes(term)) ||
              (comp.actions && String(comp.actions).toLowerCase().includes(term)) ||
              (comp.work_details && String(comp.work_details).toLowerCase().includes(term))
            );
          });
        });
      });
    }

    // Default Sort: City with highest hotspot count at top
    result.sort((a, b) => {
      if (sortBy === 'hotspots') return b.hotspotCount - a.hotspotCount;
      if (sortBy === 'incidents') return b.incidentCount - a.incidentCount;
      if (sortBy === 'severity') return b.averageSeverity - a.averageSeverity;
      if (sortBy === 'alphabetical') return a.cityName.localeCompare(b.cityName);
      return b.hotspotCount - a.hotspotCount;
    });

    return result;
  }, [hotspotsList, selectedType, searchCity, sortBy]);

  function roundVal(n: number) {
    return Math.round(n * 10) / 10;
  }

  // Level 2: Hotspots in selected city
  const selectedCityHotspots = useMemo(() => {
    if (!selectedCity) return [];
    const cityObj = cityGroupings.find(c => c.cityName === selectedCity);
    return cityObj ? cityObj.hotspots : hotspotsList.filter(h => h.city === selectedCity);
  }, [selectedCity, cityGroupings, hotspotsList]);

  // Filtered hotspots for display on Leaflet Map
  const displayHotspots = useMemo(() => {
    let filtered = hotspotsList;
    if (selectedCity) {
      filtered = filtered.filter(h => h.city === selectedCity);
    }
    if (selectedType !== 'all') {
      filtered = filtered.filter(h => {
        const domMatches = matchesCategoryFilter(h.dominantType, selectedType);
        const anyComplaintMatches = filterComplaintsByPollutionType(
          (h.complaints || []) as Array<{category_name?: string}>,
          selectedType
        ).length > 0;
        return domMatches || anyComplaintMatches;
      });
    }
    if (searchCity.trim()) {
      const term = searchCity.toLowerCase();
      filtered = filtered.filter(h => {
        if (
          (h.city && h.city.toLowerCase().includes(term)) ||
          (h.district && h.district.toLowerCase().includes(term)) ||
          (h.dominantType && h.dominantType.toLowerCase().includes(term)) ||
          (h.id && h.id.toLowerCase().includes(term))
        ) return true;
        return (h.complaints || []).some((comp: any) =>
          (comp.id && String(comp.id).toLowerCase().includes(term)) ||
          (comp.title && String(comp.title).toLowerCase().includes(term)) ||
          (comp.description && String(comp.description).toLowerCase().includes(term)) ||
          (comp.location_name && String(comp.location_name).toLowerCase().includes(term)) ||
          (comp.category_name && String(comp.category_name).toLowerCase().includes(term)) ||
          (comp.status && String(comp.status).toLowerCase().includes(term)) ||
          (comp.assigned_officer && String(comp.assigned_officer).toLowerCase().includes(term)) ||
          (comp.resolution_summary && String(comp.resolution_summary).toLowerCase().includes(term)) ||
          (comp.work_details && String(comp.work_details).toLowerCase().includes(term))
        );
      });
    }
    return filtered;
  }, [hotspotsList, selectedCity, selectedType, searchCity]);

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

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high': return 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400';
      case 'medium': return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400';
      default: return 'bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200';
    }
  };

  // Recent reported incidents — filtered dynamically when search query is active
  const recentLogs = useMemo(() => {
    if (!searchCity.trim()) {
      return incidents.slice(0, 5);
    }
    const term = searchCity.toLowerCase();
    return incidents.filter((inc: any) => {
      return (
        (inc.id && String(inc.id).toLowerCase().includes(term)) ||
        (inc.name && String(inc.name).toLowerCase().includes(term)) ||
        (inc.title && String(inc.title).toLowerCase().includes(term)) ||
        (inc.description && String(inc.description).toLowerCase().includes(term)) ||
        (inc.city && String(inc.city).toLowerCase().includes(term)) ||
        (inc.location && String(inc.location).toLowerCase().includes(term)) ||
        (inc.location_name && String(inc.location_name).toLowerCase().includes(term)) ||
        (inc.category && String(inc.category).toLowerCase().includes(term)) ||
        (inc.categoryName && String(inc.categoryName).toLowerCase().includes(term)) ||
        (inc.status && String(inc.status).toLowerCase().includes(term)) ||
        (inc.severity && String(inc.severity).toLowerCase().includes(term)) ||
        (inc.officer_name && String(inc.officer_name).toLowerCase().includes(term)) ||
        (inc.assigned_officer && String(inc.assigned_officer).toLowerCase().includes(term)) ||
        (inc.resolution_summary && String(inc.resolution_summary).toLowerCase().includes(term)) ||
        (inc.work_details && String(inc.work_details).toLowerCase().includes(term))
      );
    });
  }, [incidents, searchCity]);

  // Single report markers on map filtered by search query
  const filteredSingles = useMemo(() => {
    if (!searchCity.trim()) return singlesList;
    const term = searchCity.toLowerCase();
    return singlesList.filter((s: any) =>
      (s.id && String(s.id).toLowerCase().includes(term)) ||
      (s.title && String(s.title).toLowerCase().includes(term)) ||
      (s.description && String(s.description).toLowerCase().includes(term)) ||
      (s.location_name && String(s.location_name).toLowerCase().includes(term)) ||
      (s.category_name && String(s.category_name).toLowerCase().includes(term)) ||
      (s.status && String(s.status).toLowerCase().includes(term))
    );
  }, [singlesList, searchCity]);

  return (
    <div className="space-y-6 fade-in text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Header Banner matching Settings / Review Media styling */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-zinc-800 dark:text-zinc-200" />
            Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Geospatial incident monitoring, active city hotspots, and citizen report verification flow
          </p>
        </div>

        {/* Action Toolbar buttons matching Settings / Review Media theme */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/media"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-xs"
          >
            Review Media
          </Link>
          <Link
            href="/admin/users"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/reports"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all"
          >
            Reports
          </Link>
          <Link
            href="/admin/settings"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Compact Height Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Total Reports', value: dashboardData?.totalIncidents ?? dashboardData?.overview?.total_reports ?? incidents.length, icon: Activity },
          { name: 'Active Issues', value: dashboardData?.pendingIncidents ?? dashboardData?.overview?.active_reports ?? incidents.filter(i => i.status !== 'resolved').length, icon: AlertTriangle },
          { name: 'Resolved Reports', value: dashboardData?.resolvedIncidents ?? dashboardData?.overview?.resolved_reports ?? incidents.filter(i => i.status === 'resolved').length, icon: CheckCircle },
          { name: 'Active Hotspots', value: dashboardData?.hotspotCount ?? hotspotsList.length, icon: MapPin },
        ].map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs rounded-xl py-3 px-4 text-left flex items-center justify-between hover:border-zinc-350 dark:hover:border-zinc-700 transition-all"
          >
            <div>
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{stat.name}</div>
              <div className="text-xl font-extrabold text-zinc-950 dark:text-white mt-0.5 leading-none">
                {loading ? <span className="h-5 w-10 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse inline-block" /> : stat.value}
              </div>
            </div>
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 shrink-0">
              <stat.icon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Merged Incidents Map Section with 2-Level Active Hotspots by City */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch text-left">
        
        {/* Left Sidebar: 2-Level Navigation */}
        <div className="lg:col-span-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs flex flex-col max-h-[650px]">
          
          {/* Sidebar Header */}
          <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
            {selectedCity ? (
              /* Level 2 Header with Back Button */
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setSelectedHotspot(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-900 dark:text-white hover:underline cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to All Cities
                </button>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-zinc-950 dark:text-white text-base truncate">
                    {selectedCity}
                  </h3>
                  <span className="text-[10px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2 py-0.5 rounded font-extrabold">
                    {selectedCityHotspots.length} Hotspots
                  </span>
                </div>
              </div>
            ) : (
              /* Level 1 Header */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-zinc-950 dark:text-white flex items-center gap-2 text-sm">
                    <Building2 className="h-4.5 w-4.5 text-zinc-800 dark:text-zinc-200" />
                    Active Hotspots by City ({cityGroupings.length})
                  </h3>
                </div>

                {/* Universal Search Bar */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search city, district, report, category, officer, resolution..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                </div>

                {/* Sort Option Dropdown */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Sort Cities</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-md text-xs py-1 px-2 font-bold outline-none cursor-pointer"
                  >
                    <option value="hotspots">Most Hotspots (Default)</option>
                    <option value="incidents">Most Incidents</option>
                    <option value="severity">Highest Severity</option>
                    <option value="alphabetical">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar Content Area */}
          <div className="space-y-3 overflow-y-auto flex-1 pr-1 mt-3">
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-zinc-700 dark:text-zinc-300" />
                <span className="font-semibold">Loading city hotspots...</span>
              </div>
            ) : selectedCity ? (
              /* Level 2 View: Hotspot Area Cards for Selected City */
              selectedCityHotspots.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400 font-semibold">
                  No hotspot areas in {selectedCity}.
                </div>
              ) : (
                selectedCityHotspots.map((h, idx) => {
                  const isSelected = selectedHotspot?.id === h.id;
                  const themeClass = getTypeTheme(h.dominantType);
                  const firstComplaintLoc = h.complaints[0]?.location_name || h.district;
                  const areaName = getAreaName(firstComplaintLoc, selectedCity, idx);

                  return (
                    <div
                      key={h.id}
                      onClick={() => setSelectedHotspot(h)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected 
                          ? 'border-zinc-900 dark:border-white bg-zinc-100/60 dark:bg-zinc-800/60 shadow-xs ring-1 ring-zinc-900/10 dark:ring-white/20' 
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {/* Area / Locality Name */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getDominantIcon(h.dominantType)}</span>
                          <div>
                            <h4 className="text-xs font-extrabold text-zinc-950 dark:text-white truncate max-w-[130px]">
                              {areaName}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-bold">
                              Radius: {h.radius_meters || 50.0}m Zone
                            </p>
                          </div>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-extrabold ${themeClass}`}>
                          {h.dominantType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold">
                          Severity: <strong className="text-zinc-800 dark:text-zinc-200">{h.averageSeverity || 3.5}/5.0</strong>
                        </span>
                        <span className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                          {h.count || 2} Reports
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Level 1 View: City Overview List */
              cityGroupings.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400 font-semibold space-y-1">
                  <AlertCircle className="h-6 w-6 mx-auto text-zinc-400 mb-1" />
                  <p>No city hotspots match criteria.</p>
                </div>
              ) : (
                cityGroupings.map((group) => {
                  const themeClass = getTypeTheme(group.dominantType);

                  return (
                    <div
                      key={group.cityName}
                      onClick={() => {
                        setSelectedCity(group.cityName);
                        if (group.hotspots.length > 0) {
                          setSelectedHotspot(group.hotspots[0]);
                        }
                      }}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100/40 transition-all cursor-pointer space-y-2.5"
                    >
                      {/* City Name as Block Title */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getDominantIcon(group.dominantType)}</span>
                          <div>
                            <h4 className="text-sm font-extrabold text-zinc-950 dark:text-white truncate max-w-[135px]">
                              {group.cityName}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-bold">
                              {group.hotspotCount} {group.hotspotCount === 1 ? 'Hotspot Region' : 'Hotspot Regions'}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-extrabold ${themeClass}`}>
                          {group.dominantType}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold">
                          Avg Severity: <strong className="text-zinc-800 dark:text-zinc-200">{group.averageSeverity}/5.0</strong>
                        </span>
                        <span className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md">
                          {selectedType === 'all' ? group.incidentCount : group.filteredIncidentCount} Reports
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Right Side: Leaflet OpenStreetMap Canvas */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col relative min-h-[550px]">
          
          {/* Map Controls & Pollution Type Filter Header Bar */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold">
              <Building2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <span>
                {selectedCity 
                  ? `City Focus: ${selectedCity} (${displayHotspots.length} Hotspot Regions)` 
                  : `System Map (${displayHotspots.length} Active Hotspots)`}
              </span>
              {selectedCity && (
                <button
                  onClick={() => { setSelectedCity(null); setSelectedHotspot(null); }}
                  className="text-[10px] bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded font-extrabold cursor-pointer"
                >
                  Reset City Filter
                </button>
              )}
            </div>

            {/* Pollution Filter & Map Layer Toggles directly above map container */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Pollution Filter Pills */}
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 shadow-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'air', label: 'Air' },
                  { id: 'water', label: 'Water' },
                  { id: 'land', label: 'Land' },
                  { id: 'noise', label: 'Noise' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.id)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      selectedType === t.id 
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Map Layer Mode Toggles */}
              <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 shadow-xs">
                <button
                  onClick={() => setMapMode('vector')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded capitalize cursor-pointer transition-all ${
                    mapMode === 'vector' 
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Standard Map
                </button>
                <button
                  onClick={() => setMapMode('clusters')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded capitalize cursor-pointer transition-all ${
                    mapMode === 'clusters' 
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Hotspot Regions View
                </button>
              </div>

              <button 
                onClick={loadDashboardData}
                className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all cursor-pointer shadow-xs"
                title="Refresh telemetry data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Leaflet OpenStreetMap Canvas Component */}
          <div className="flex-1 relative">
            <AdminMapCanvas
              hotspots={displayHotspots}
              singles={filteredSingles}
              selectedCity={selectedCity}
              selectedHotspotId={selectedHotspot?.id}
              pollutionFilter={selectedType}
              mapMode={mapMode}
              height="550px"
              onSelectHotspot={(hotspot) => {
                setSelectedHotspot(hotspot);
                if (hotspot.city) setSelectedCity(hotspot.city);
              }}
            />
          </div>

          {/* Details Footer HUD for Selected Hotspot */}
          {selectedHotspot && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getDominantIcon(selectedHotspot.dominantType)}</span>
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
                    50m Hotspot Area: {getAreaName(selectedHotspot.complaints[0]?.location_name || selectedHotspot.district, selectedHotspot.city)}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    City: {selectedHotspot.city} · Radius: {selectedHotspot.radius_meters || 50.0}m Zone
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-lg min-w-[85px]">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Avg Severity</p>
                  <p className="text-amber-600 dark:text-amber-400 font-extrabold mt-0.5">
                    {selectedHotspot.averageSeverity || 3.5}/5.0
                  </p>
                </div>

                <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-1.5 rounded-lg min-w-[85px]">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Incident Count</p>
                  <p className="text-zinc-900 dark:text-white font-extrabold mt-0.5">
                    {selectedHotspot.count || 1} Reports
                  </p>
                </div>

                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors cursor-pointer text-xs font-bold"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs / Search Results Section */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden flex flex-col text-left">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-zinc-950 dark:text-white text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
              {searchCity.trim()
                ? `Search Results (${recentLogs.length} matching incident${recentLogs.length !== 1 ? 's' : ''})`
                : 'Recent Logs (Last 5 Reported Incidents)'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {searchCity.trim()
                ? `Real-time search results matching "${searchCity.trim()}" across all report aspects`
                : 'Latest citizen incident submissions requiring municipal review'}
            </p>
          </div>

          <Link href="/admin/media" className="text-xs font-bold text-zinc-900 dark:text-white hover:underline">
            View All Media Logs →
          </Link>
        </div>
        
        <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))
          ) : recentLogs.length === 0 ? (
            <div className="col-span-5 py-8 text-center text-zinc-400 text-xs font-semibold">
              No recent incident logs registered in system.
            </div>
          ) : (
            recentLogs.map((incident) => (
              <div
                key={incident.id}
                onClick={() => handleSelectIncident(incident)}
                className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-950/50 transition-all cursor-pointer text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-extrabold capitalize ${getSeverityBadge(incident.severity)}`}>
                      {incident.severity || 'medium'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      {incident.reportedAt ? new Date(incident.reportedAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-zinc-950 dark:text-white line-clamp-2 leading-snug">
                    {incident.description || 'Reported Incident'}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-bold truncate text-zinc-700 dark:text-zinc-300">
                    👤 {incident.userName || 'Citizen'}
                  </span>
                  <span className="capitalize font-bold text-zinc-900 dark:text-zinc-100">
                    {incident.status ? incident.status.replace(/_/g, ' ') : 'Submitted'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Incident Detail Inspector Drawer */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div 
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectedIncident(null)}
          />
          
          <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl p-6 text-left z-10 animate-slide-in">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <div>
                <span className="text-[10px] px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800 bg-blue-50 text-blue-800 dark:bg-blue-955/40 dark:text-blue-300 font-extrabold">
                  Severity: {selectedIncident.severityScore !== undefined && selectedIncident.severityScore !== null ? `${Math.round(selectedIncident.severityScore)}%` : '45%'}
                </span>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white mt-2">Inspect Incident Log</h3>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Short Description</p>
                <h4 className="text-xs font-extrabold text-zinc-950 dark:text-white mt-0.5">{selectedIncident.title || selectedIncident.description?.slice(0, 45) || 'Environmental Incident'}</h4>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Full Description</p>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed mt-1 whitespace-pre-wrap">{selectedIncident.description}</p>
              </div>

              {/* Officer Assignment Section */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">
                    Assigned Municipal Officer
                  </span>
                  {selectedIncident.assignedOfficer && selectedIncident.assignedOfficer !== 'None' ? (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                      Assigned
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                      Unassigned
                    </span>
                  )}
                </div>
                <select
                  value={selectedIncident.assignedOfficer || ''}
                  onChange={(e) => handleAssignOfficer(e.target.value)}
                  disabled={isAssigningOfficer}
                  className="w-full text-xs font-bold border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="" disabled={!!selectedIncident.assignedOfficer}>
                    {selectedIncident.assignedOfficer ? `Current: ${selectedIncident.assignedOfficer} (Click to Change)` : "-- Select Officer to Assign --"}
                  </option>
                  {officersList.map((off) => (
                    <option key={off} value={off}>{off}</option>
                  ))}
                </select>
              </div>

              {/* Severity Score Percentage Card */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-955/20 border border-blue-200/80 dark:border-blue-900/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider block">
                    AI Evaluated Severity Score
                  </span>
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5 block">
                    AI Verification Complete
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {selectedIncident.severityScore !== undefined && selectedIncident.severityScore !== null
                      ? `${Math.round(selectedIncident.severityScore)}%`
                      : '45%'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Logged By</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">{selectedIncident.userName}</p>
                  <p className="text-[10px] text-zinc-500">{selectedIncident.userEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Coordinates</p>
                  <p className="text-xs text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
                    {selectedIncident.location.latitude.toFixed(4)}, {selectedIncident.location.longitude.toFixed(4)}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">{selectedIncident.location.address || 'Address Verified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
