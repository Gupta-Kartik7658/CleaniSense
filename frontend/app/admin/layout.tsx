// frontend/app/admin/layout.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { PollutionService } from '@/services/pollutionService';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Eye,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Activity,
  ShieldAlert,
  Home,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileVideo,
  FileImage
} from 'lucide-react';

const baseNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Manage Users', href: '/admin/users', icon: Users },
  { name: 'Review Media', href: '/admin/media', icon: Eye },
  { name: 'Generate Report', href: '/admin/reports', icon: FileText },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const superAdminNavigation = [
  { name: 'Role Access', href: '/admin/roles', icon: ShieldAlert },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, isAuthenticated } = useAuth();

  // Notifications states
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', title: 'Critical AQI Alert', desc: 'Sector-4 AQI crossed 180 threshold', time: '10 min ago', unread: true },
    { id: '2', title: 'New Attachment Uploaded', desc: 'Rajesh K. uploaded sewage photo', time: '1 hour ago', unread: true },
    { id: '3', title: 'Settings Backup Created', desc: 'Auto system backup completed', time: '5 hours ago', unread: false }
  ]);

  // Quick Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [quickSearchIncident, setQuickSearchIncident] = useState<any | null>(null);
  
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allMedia, setAllMedia] = useState<any[]>([]);

  // Route protection client-side
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/');
      } else if (
        user &&
        user.role !== 'admin' &&
        user.role !== 'super_admin' &&
        user.role !== 'municipality_admin' &&
        user.role !== 'municipality_officer'
      ) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Load all search targets (incidents, users, media)
  useEffect(() => {
    const fetchSearchData = async () => {
      let realIncidents: any[] = [];
      try {
        const incRes = await PollutionService.getIncidents({ limit: 100 });
        if (incRes?.incidents) {
          realIncidents = incRes.incidents;
          setAllIncidents(realIncidents);
        } else {
          setAllIncidents([]);
        }
      } catch {
        setAllIncidents([]);
      }

      try {
        const userRes = await PollutionService.getUsers();
        if (userRes?.users) {
          setAllUsers(userRes.users);
        } else {
          setAllUsers([]);
        }
      } catch {
        setAllUsers([]);
      }

      // Extract real media attachments from database incidents
      const derivedMedia: any[] = [];
      realIncidents.forEach((inc: any) => {
        const urls: string[] = inc.mediaUrls || (inc.imageUrl ? [inc.imageUrl] : []);
        urls.forEach((url: string, uIdx: number) => {
          derivedMedia.push({
            id: `media-${inc.id}-${uIdx}`,
            complaintId: inc.id,
            name: inc.title || inc.name || `Report #${inc.id}`,
            url: url,
            type: url.match(/\.(mp4|webm|mov|ogg)$/i) ? 'video' : 'image',
            user: inc.userName || inc.name || 'Reporter',
            location: inc.location || inc.location_name || '',
            categoryName: inc.category || '',
            status: inc.status || '',
            resolutionSummary: inc.resolutionSummary || inc.resolution_summary || '',
            resolutionActions: inc.resolutionActions || inc.actions_performed || '',
            assignedOfficer: inc.assignedOfficer || inc.officer_name || ''
          });
        });
      });
      setAllMedia(derivedMedia);
    };
    fetchSearchData();
  }, []);

  // Multi-target categorized matching selector
  const searchResults = useMemo(() => {
    if (!searchQuery) {
      return { incidents: [], users: [], media: [] };
    }
    const term = searchQuery.toLowerCase();

    const matchedIncidents = allIncidents.filter(inc => 
      (inc.title && String(inc.title).toLowerCase().includes(term)) ||
      (inc.name && String(inc.name).toLowerCase().includes(term)) ||
      (inc.city && String(inc.city).toLowerCase().includes(term)) ||
      (inc.id && String(inc.id).toLowerCase().includes(term)) ||
      (inc.description && String(inc.description).toLowerCase().includes(term)) ||
      (inc.location && String(inc.location).toLowerCase().includes(term)) ||
      (inc.category && String(inc.category).toLowerCase().includes(term)) ||
      (inc.status && String(inc.status).toLowerCase().includes(term)) ||
      (inc.officer_name && String(inc.officer_name).toLowerCase().includes(term)) ||
      (inc.assigned_officer && String(inc.assigned_officer).toLowerCase().includes(term)) ||
      (inc.resolution_summary && String(inc.resolution_summary).toLowerCase().includes(term)) ||
      (inc.work_details && String(inc.work_details).toLowerCase().includes(term)) ||
      (inc.actions && String(inc.actions).toLowerCase().includes(term))
    );

    const matchedUsers = allUsers.filter(u => 
      (u.name && String(u.name).toLowerCase().includes(term)) ||
      (u.email && String(u.email).toLowerCase().includes(term)) ||
      (u.role && String(u.role).toLowerCase().includes(term)) ||
      (u.city && String(u.city).toLowerCase().includes(term)) ||
      (u.phone && String(u.phone).toLowerCase().includes(term)) ||
      (u.status && String(u.status).toLowerCase().includes(term)) ||
      (u.department && String(u.department).toLowerCase().includes(term))
    );

    const matchedMedia = allMedia.filter(m => 
      (m.name && String(m.name).toLowerCase().includes(term)) ||
      (m.type && String(m.type).toLowerCase().includes(term)) ||
      (m.user && String(m.user).toLowerCase().includes(term)) ||
      (m.email && String(m.email).toLowerCase().includes(term)) ||
      (m.location && String(m.location).toLowerCase().includes(term)) ||
      (m.status && String(m.status).toLowerCase().includes(term)) ||
      (m.categoryName && String(m.categoryName).toLowerCase().includes(term)) ||
      (m.resolutionSummary && String(m.resolutionSummary).toLowerCase().includes(term)) ||
      (m.resolutionActions && String(m.resolutionActions).toLowerCase().includes(term)) ||
      (m.assignedOfficer && String(m.assignedOfficer).toLowerCase().includes(term))
    );

    return { incidents: matchedIncidents, users: matchedUsers, media: matchedMedia };
  }, [searchQuery, allIncidents, allUsers, allMedia]);

  const totalMatches = searchResults.incidents.length + searchResults.users.length + searchResults.media.length;
  const hasUnread = useMemo(() => notifications.some(n => n.unread), [notifications]);

  const clearNotifications = () => setNotifications([]);
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-10 w-10 text-zinc-955 dark:text-white animate-pulse" />
          <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Checking authorization...</span>
        </div>
      </div>
    );
  }

  if (
    !isAuthenticated ||
    (user &&
      user.role !== 'admin' &&
      user.role !== 'super_admin' &&
      user.role !== 'municipality_admin' &&
      user.role !== 'municipality_officer')
  ) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
        <div className="flex flex-col items-center gap-3 max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center shadow-sm">
          <ShieldAlert className="h-12 w-12 text-red-650 shrink-0" />
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">Access Denied</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You do not have the required permissions to view the admin section of CleaniSense.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-zinc-950 dark:bg-white hover:bg-zinc-900 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Go to User Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const displayName = user?.name || 'Administrator';
  const displayEmail = user?.email || 'admin@cleanisense.gov';
  const avatarUrl = user?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=171717&color=fff`;

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-6">
          <SidebarContent pathname={pathname} userRole={user?.role || 'admin'} onClose={() => setSidebarOpen(false)} handleSignOut={handleSignOut} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 px-6 pb-4">
          <SidebarContent pathname={pathname} userRole={user?.role || 'admin'} handleSignOut={handleSignOut} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 relative">
          <div className="flex h-16 items-center gap-x-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="lg:hidden -m-2.5 p-2.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 relative">
              {/* Quick Search bar */}
              <div className="relative flex flex-1 items-center">
                <Search className="pointer-events-none absolute left-3 h-5 w-5 text-zinc-450 dark:text-zinc-500" />
                <input
                  className="block h-full w-full border-0 bg-transparent py-0 pl-10 pr-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-0 sm:text-sm outline-none"
                  placeholder="Quick search reports, photos/videos, or user info..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Categorized Quick Search Results Dropdown Menu */}
                {searchQuery && !isSearchDrawerOpen && (
                  <div className="absolute top-14 left-0 right-0 max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl p-4.5 z-50 text-left font-sans flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-3">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Categorized Matches ({totalMatches})</span>
                      <button 
                        onClick={() => setIsSearchDrawerOpen(true)}
                        className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        See More Results
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                      {totalMatches === 0 ? (
                        <p className="text-xs text-zinc-500 py-3 text-center">No matching files, users or reports found.</p>
                      ) : (
                        <>
                          {/* Matching Users */}
                          {searchResults.users.length > 0 && (
                            <div>
                              <h5 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Users</h5>
                              <div className="space-y-1">
                                {searchResults.users.slice(0, 3).map(u => (
                                  <div 
                                    key={u.id}
                                    onClick={() => {
                                      setSearchQuery('');
                                      router.push(`/profile?email=${u.email}`);
                                    }}
                                    className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded text-xs flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="font-bold text-zinc-900 dark:text-white truncate">{u.name}</span>
                                    <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 rounded">{u.role}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Matching Incidents */}
                          {searchResults.incidents.length > 0 && (
                            <div>
                              <h5 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Reports</h5>
                              <div className="space-y-1">
                                {searchResults.incidents.slice(0, 3).map(inc => (
                                  <div 
                                    key={inc.id}
                                    onClick={() => {
                                      setQuickSearchIncident(inc);
                                      setSearchQuery('');
                                    }}
                                    className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded text-xs flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="font-bold text-zinc-900 dark:text-white truncate">{inc.title || inc.name}</span>
                                    <span className="text-[9px] bg-red-100/10 text-red-500 px-1.5 rounded capitalize font-bold">
                                      {inc.severityPercentage ?? inc.severityScore ? `${Math.round(Number(inc.severityPercentage ?? inc.severityScore))}% ` : ''}
                                      {inc.severity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Matching Media */}
                          {searchResults.media.length > 0 && (
                            <div>
                              <h5 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Media Files</h5>
                              <div className="space-y-1">
                                {searchResults.media.slice(0, 3).map(m => (
                                  <div 
                                    key={m.id}
                                    onClick={() => {
                                      setSearchQuery('');
                                      router.push('/admin/media');
                                    }}
                                    className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded text-xs flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="font-bold text-zinc-900 dark:text-white truncate flex items-center gap-1">
                                      {m.type === 'video' ? <FileVideo className="h-3 w-3 text-indigo-400" /> : <FileImage className="h-3 w-3 text-emerald-405" />}
                                      {m.name}
                                    </span>
                                    <span className="text-[9px] text-zinc-450 dark:text-zinc-500">{m.sizeLabel}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Notification Bell with POPUP dropdown and empty state */}
                <div className="relative">
                  <button 
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative text-zinc-500 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Bell className="h-6 w-6" />
                    {hasUnread && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-650 animate-pulse" />
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setNotifDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-2xl z-20 text-left">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">System Alerts</span>
                          {notifications.length > 0 && (
                            <div className="flex gap-2">
                              <button onClick={markAllRead} className="text-[9px] font-bold text-emerald-650 hover:underline cursor-pointer">Mark read</button>
                              <button onClick={clearNotifications} className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer">Clear all</button>
                            </div>
                          )}
                        </div>

                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-xs font-bold">No new notifications</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Everything is operating smoothly.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {notifications.map(notif => (
                              <div 
                                key={notif.id} 
                                className={`p-2 rounded border text-xs text-left transition-colors ${
                                  notif.unread 
                                    ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800' 
                                    : 'bg-transparent border-transparent'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <p className="font-bold text-zinc-900 dark:text-white">{notif.title}</p>
                                  <span className="text-[9px] text-zinc-450 dark:text-zinc-500">{notif.time}</span>
                                </div>
                                <p className="text-[10px] text-zinc-550 dark:text-zinc-300 mt-0.5 leading-normal">{notif.desc}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-zinc-200 dark:lg:bg-zinc-800" />
                
                {/* User Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-x-3 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <img
                      className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 object-cover"
                      src={avatarUrl}
                      alt={displayName}
                    />
                    <span className="hidden lg:flex lg:items-center">
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-250">{displayName}</span>
                      <ChevronDown className="ml-2 h-4 w-4 text-zinc-400" />
                    </span>
                  </button>

                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 shadow-2xl z-20">
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                          <p className="text-xs text-zinc-400">Logged in as</p>
                          <p className="text-sm font-bold truncate text-zinc-900 dark:text-white">{displayName}</p>
                          <p className="text-xs truncate text-zinc-500 dark:text-zinc-400">{displayEmail}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-650 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Activity className="h-4 w-4" />
                          Citizen Panel
                        </Link>
                        <Link
                          href="/admin/settings"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-650 hover:text-zinc-955 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Preferences
                        </Link>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleSignOut();
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Quick Search Overlay Detail Modal */}
        {quickSearchIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setQuickSearchIncident(null)} />
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xl w-full max-w-md p-6 z-10 text-left">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-mono font-bold text-zinc-450 dark:text-zinc-550">{quickSearchIncident.id}</span>
                <button onClick={() => setQuickSearchIncident(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">{quickSearchIncident.title || quickSearchIncident.name}</h3>
              <p className="text-xs text-zinc-550 mt-1">Location Sector: {quickSearchIncident.city}</p>
              
              <div className="my-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-450">Severity Level:</span>
                  <span className="capitalize font-bold text-red-500">
                    {quickSearchIncident.severityPercentage ?? quickSearchIncident.severityScore ? `${Math.round(Number(quickSearchIncident.severityPercentage ?? quickSearchIncident.severityScore))}% ` : ''}
                    {quickSearchIncident.severity}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-450">Work Status:</span>
                  <span className="capitalize font-bold text-emerald-500">{quickSearchIncident.status}</span>
                </div>
                {quickSearchIncident.desc && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Report Details</p>
                    <p className="text-xs text-zinc-650 dark:text-zinc-300 mt-1 leading-relaxed">{quickSearchIncident.desc}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  onClick={() => {
                    setQuickSearchIncident(null);
                    router.push('/admin');
                  }}
                  className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Inspect in Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Paned Search Results Overlay Panel Drawer */}
        {isSearchDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsSearchDrawerOpen(false)} />
            
            {/* Drawer container */}
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full shadow-2xl p-6 flex flex-col z-10 text-left animate-slide-in">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-150 dark:border-zinc-800 mb-5">
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">Quick Search Panel</h3>
                  <p className="text-xs text-zinc-550 mt-0.5">Explore reports, media, and user profiles</p>
                </div>
                <button 
                  onClick={() => setIsSearchDrawerOpen(false)} 
                  className="p-1.5 text-zinc-400 hover:text-zinc-650 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* top Search input inside panel */}
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-450 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 outline-none focus:border-zinc-450"
                  placeholder="Filter users, photos/videos, or complaints..."
                />
              </div>

              {/* Scrollable results list */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {totalMatches === 0 ? (
                  <div className="text-center py-16 text-zinc-500">
                    <Search className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm font-bold">No results found</p>
                    <p className="text-xs text-zinc-450 mt-0.5">Try a different query term.</p>
                  </div>
                ) : (
                  <>
                    {/* Incidents / Reports list */}
                    {searchResults.incidents.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1">
                          Reports ({searchResults.incidents.length})
                        </h4>
                        <div className="space-y-2">
                          {searchResults.incidents.map(inc => (
                            <div 
                              key={inc.id}
                              onClick={() => {
                                setIsSearchDrawerOpen(false);
                                setQuickSearchIncident(inc);
                              }}
                              className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-450 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                            >
                              <p className="text-xs font-bold text-zinc-900 dark:text-white">{inc.title || inc.name}</p>
                              <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1">
                                {inc.city} • Severity: {inc.severityPercentage ?? inc.severityScore ? `${Math.round(Number(inc.severityPercentage ?? inc.severityScore))}% ` : ''}{inc.severity} • Status: {inc.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users list */}
                    {searchResults.users.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-zinc-455 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1">
                          User Accounts ({searchResults.users.length})
                        </h4>
                        <div className="space-y-2">
                          {searchResults.users.map(u => (
                            <div 
                              key={u.id}
                              onClick={() => {
                                setIsSearchDrawerOpen(false);
                                router.push(`/profile?email=${encodeURIComponent(u.email)}&name=${encodeURIComponent(u.name)}&role=${u.role}&status=active&city=${u.city || 'Mumbai'}`);
                              }}
                              className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-450 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                            >
                              <p className="text-xs font-bold text-zinc-900 dark:text-white">{u.name}</p>
                              <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1">{u.email} • Role: {u.role} • Location: {u.city}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Media list */}
                    {searchResults.media.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-zinc-455 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1">
                          Media & Attachments ({searchResults.media.length})
                        </h4>
                        <div className="space-y-2">
                          {searchResults.media.map(m => (
                            <div 
                              key={m.id}
                              onClick={() => {
                                setIsSearchDrawerOpen(false);
                                router.push('/admin/media');
                              }}
                              className="p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-450 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                            >
                              <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                {m.type === 'video' ? <FileVideo className="h-3.5 w-3.5 text-indigo-400" /> : <FileImage className="h-3.5 w-3.5 text-emerald-450" />}
                                {m.name}
                              </p>
                              <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1">{m.type.toUpperCase()} • Size: {m.sizeLabel} • Uploaded by: {m.user}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-zinc-950">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

interface SidebarProps {
  pathname: string;
  userRole: string;
  onClose?: () => void;
  handleSignOut: () => void;
}

function SidebarContent({ pathname, userRole, onClose, handleSignOut }: SidebarProps) {
  const roleLabel = userRole === 'super_admin' ? 'Super Admin' : userRole === 'municipality_officer' ? 'Officer' : 'Admin';
  const navigation = userRole === 'super_admin'
    ? [...baseNavigation, ...superAdminNavigation]
    : baseNavigation;

  return (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
          <div className="h-8 w-8 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center">
            <Activity className="h-5 w-5 text-zinc-955 dark:text-zinc-950" />
          </div>
          <span className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight">CleaniSense</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full border border-zinc-200 dark:border-zinc-750">
            {roleLabel}
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-zinc-405 hover:text-zinc-650 p-1.5 rounded-lg hover:bg-zinc-105 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`group flex gap-x-3 rounded-lg p-2.5 text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white border-l-2 border-zinc-905 dark:border-white pl-2 font-extrabold'
                          : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-55 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0 animate-fade-in" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <button 
              onClick={handleSignOut}
              className="group -mx-2 flex gap-x-3 rounded-lg p-2.5 text-sm font-semibold text-zinc-500 hover:text-red-650 hover:bg-red-500/5 transition-all w-full text-left cursor-pointer"
            >
              <LogOut className="h-5 w-5 shrink-0 text-zinc-405 group-hover:text-red-500" />
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
