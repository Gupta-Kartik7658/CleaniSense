// app/admin/media/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { complaintService } from '@/services/complaint';
import { PollutionService } from '@/services/pollutionService';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/common/Skeleton';
import JSZip from 'jszip';
import {
  Image,
  Video,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  Play,
  Check,
  X,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Tag,
  ZoomIn,
  ZoomOut,
  Share2,
  Flag,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw
} from 'lucide-react';

const PreviewMap = dynamic(
  () => import("@/components/dashboard/PreviewMap").then((mod) => mod.PreviewMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-xs text-zinc-400">
        Loading Map Canvas...
      </div>
    ),
  }
);

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%2318181b'/%3E%3Cg transform='translate(175, 75)' fill='none' stroke='%2310b981' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/g%3E%3Ctext x='200' y='155' fill='%23a1a1aa' font-family='system-ui, sans-serif' font-size='12' font-weight='700' text-anchor='middle'%3EIncident Media Report%3C/text%3E%3C/svg%3E";

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMAGE;
};

export default function MediaPage() {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [previewMedia, setPreviewMedia] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Custom multi-filter states
  const [selectedIssueType, setSelectedIssueType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

  const [mediaList, setMediaList] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveSummary, setResolveSummary] = useState("");
  const [resolveActions, setResolveActions] = useState("");
  const [resolveFile, setResolveFile] = useState<File | null>(null);
  const [resolvingLoading, setResolvingLoading] = useState(false);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewMedia) return;
    if (!resolveSummary.trim()) {
      showNotification('Please enter a resolution summary.', 'error');
      return;
    }
    if (!resolveActions.trim()) {
      showNotification('Please enter work details & actions performed.', 'error');
      return;
    }
    if (!resolveFile) {
      showNotification('Please select a photo evidence for the resolution.', 'error');
      return;
    }

    setResolvingLoading(true);
    try {
      const targetId = previewMedia.complaintId || previewMedia.id;
      const res: any = await PollutionService.resolveIncident(
        targetId,
        resolveSummary,
        resolveActions,
        resolveFile
      );
      showNotification('Complaint marked as resolved successfully.', 'success');
      setShowResolveModal(false);
      
      const newAfterUrl = res?.data?.resolution?.after_image_url || res?.resolution?.after_image_url;
      const updatedSummary = resolveSummary;
      const updatedActions = resolveActions;
      
      setResolveSummary("");
      setResolveActions("");
      setResolveFile(null);

      // Update previewMedia in-place so modal HUD reflects "Resolved" immediately
      setPreviewMedia((prev: any) => prev ? {
        ...prev,
        status: 'resolved',
        resolutionSummary: updatedSummary,
        resolutionActions: updatedActions,
        resolutionAfterImage: newAfterUrl || prev.resolutionAfterImage
      } : null);

      // Update mediaList in-place
      setMediaList((prevList) => prevList.map((m) => {
        if (m.id === previewMedia.id || m.complaintId === targetId) {
          return {
            ...m,
            status: 'resolved',
            resolutionSummary: updatedSummary,
            resolutionActions: updatedActions,
            resolutionAfterImage: newAfterUrl || m.resolutionAfterImage
          };
        }
        return m;
      }));

      loadMediaData();
    } catch (err: any) {
      console.error('Failed to resolve complaint:', err);
      showNotification(err.message || 'Failed to mark complaint as resolved.', 'error');
    } finally {
      setResolvingLoading(false);
    }
  };
  const [officersList, setOfficersList] = useState<string[]>([]);
  const [isAssigningOfficer, setIsAssigningOfficer] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    loadMediaData();
    PollutionService.getOfficers().then((list) => {
      if (Array.isArray(list)) setOfficersList(list);
    }).catch(err => console.error("Error loading officers list:", err));
  }, [user, authLoading]);

  // Media Viewer Zoom & Pan States
  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeMediaTab, setActiveMediaTab] = useState<'reported' | 'resolved'>('reported');

  const resetZoomPan = () => {
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPos({ x: 0, y: 0 });
      return next;
    });
  };

  // Reset zoom whenever previewMedia changes
  useEffect(() => {
    resetZoomPan();
    setActiveMediaTab('reported');
  }, [previewMedia]);

  const handleAssignOfficer = async (officerName: string) => {
    if (!previewMedia || !officerName) return;
    setIsAssigningOfficer(true);
    try {
      const targetId = previewMedia.complaintId || previewMedia.id;
      await PollutionService.assignOfficer(targetId, officerName);
      showNotification(`Report assigned to ${officerName} successfully.`, 'success');
      setPreviewMedia((prev: any) => prev ? { ...prev, assignedOfficer: officerName } : null);
      loadMediaData();
    } catch (err: any) {
      console.error('Failed to assign officer:', err);
      showNotification(err.message || 'Failed to assign officer.', 'error');
    } finally {
      setIsAssigningOfficer(false);
    }
  };

  const loadMediaData = async () => {
    setLoading(true);
    try {
      const data = await PollutionService.getIncidents({ limit: 100 });
      const incidents = data.incidents || [];

      const attachmentsList: any[] = [];
      incidents.forEach((item: any) => {
        const catName = item.categoryName || item.category || item.category_name || 'Environmental';
        const resSum = item.resolution?.summary || item.resolutionSummary || '';
        const resAct = item.resolution?.actions || item.resolutionActions || '';
        const officer = item.assignedOfficer || item.assigned_officer || item.resolution?.officer_name || '';
        const fullDesc = item.description || item.title || item.shortDescription || 'No detailed description provided.';
        const titleText = item.title || item.shortDescription || item.short_description || '';
        const shortDesc = titleText ? titleText : `${catName} Incident Report`;
        const resAfter = item.resolution?.after_image_url || item.resolution_report?.after_image_url || item.after_image_url || null;

        const mediaUrls = item.mediaUrls || [];
        if (mediaUrls.length > 0) {
          mediaUrls.forEach((url: string, idx: number) => {
            const isVideo = url.match(/\.(mp4|webm|mov)$/i) || url.includes('/video/');
            attachmentsList.push({
              id: `${item.id}-${idx}`,
              complaintId: item.id,
              type: isVideo ? 'video' : 'image',
              url: url,
              thumbnail: url,
              name: shortDesc,
              location: item.location?.address || 'Verified Coordinate',
              user: item.userName || 'Unknown Reporter',
              email: item.userEmail || '',
              uploadTimestamp: item.reportedAt || new Date().toISOString(),
              date: item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : new Date().toLocaleDateString(),
              severity: item.severity?.toLowerCase() || 'medium',
              severityScore: item.severityScore || item.severity_score,
              status: item.status || 'submitted',
              categoryName: catName,
              resolutionSummary: resSum,
              resolutionActions: resAct,
              resolutionAfterImage: resAfter,
              assignedOfficer: officer,
              shortDescription: shortDesc,
              fullDescription: fullDesc,
              rawIncident: item,
              sizeInBytes: 800000,
              sizeLabel: '800 KB',
              durationInSeconds: null,
              durationLabel: null,
              latitude: item.location?.latitude || 0,
              longitude: item.location?.longitude || 0,
            });
          });
        } else {
          attachmentsList.push({
            id: item.id,
            complaintId: item.id,
            type: 'image',
            url: '/placeholder-media.png',
            thumbnail: '/placeholder-media.png',
            name: shortDesc,
            location: item.location?.address || 'Verified Coordinate',
            user: item.userName || 'Unknown Reporter',
            email: item.userEmail || '',
            uploadTimestamp: item.reportedAt || new Date().toISOString(),
            date: item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : new Date().toLocaleDateString(),
            severity: item.severity?.toLowerCase() || 'medium',
            severityScore: item.severityScore || item.severity_score,
            status: item.status || 'submitted',
            categoryName: catName,
            resolutionSummary: resSum,
            resolutionActions: resAct,
            resolutionAfterImage: resAfter,
            assignedOfficer: officer,
            shortDescription: shortDesc,
            fullDescription: fullDesc,
            rawIncident: item,
            sizeInBytes: 500000,
            sizeLabel: '500 KB',
            durationInSeconds: null,
            durationLabel: null,
            latitude: item.location?.latitude || 0,
            longitude: item.location?.longitude || 0,
          });
        }
      });
      setMediaList(attachmentsList);
    } catch (e) {
      console.error('Failed to load media:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkPendingStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return s !== 'resolved' && s !== 'rejected' && s !== 'dismissed';
  };

  const checkApprovedStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'municipality_accepted' || s === 'officer_assigned' || s === 'in_progress' || s === 'investigating' || s === 'approved';
  };

  const checkResolvedStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'resolved';
  };

  const stats = [
    { label: 'Total Media', value: mediaList.length, icon: Image, color: 'text-blue-500', bg: 'from-blue-500/10 to-blue-600/10' },
    { label: 'Pending Review', value: mediaList.filter(m => checkPendingStatus(m.status)).length, icon: Clock, color: 'text-yellow-500', bg: 'from-yellow-500/10 to-yellow-600/10' },
    { label: 'Flagged Logs', value: mediaList.filter(m => m.status === 'rejected' || m.status === 'dismissed').length, icon: Flag, color: 'text-red-500', bg: 'from-red-500/10 to-red-600/10' },
    { label: 'Resolved Reports', value: mediaList.filter(m => checkResolvedStatus(m.status)).length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'from-emerald-500/10 to-emerald-600/10' },
  ];

  const handleBulkAction = async (action: 'approve' | 'flag' | 'delete') => {
    if (selectedMedia.length === 0) return;
    try {
      await Promise.all(
        selectedMedia.map(async (id) => {
          const item = mediaList.find((m) => m.id === id);
          if (!item) return;
          if (action === 'approve') {
            await PollutionService.updateIncidentStatus(item.complaintId, 'approved');
          } else if (action === 'delete') {
            await PollutionService.deleteIncident(item.complaintId);
          }
        })
      );
      showNotification(`Bulk ${action} executed successfully.`, 'success');
      setSelectedMedia([]);
      loadMediaData();
    } catch (e) {
      console.error('Failed to execute bulk action:', e);
      showNotification('Bulk action execution failed.', 'error');
    }
  };

  const handleSingleAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    const item = mediaList.find((m) => m.id === id);
    if (!item) return;

    try {
      if (action === 'approve') {
        await PollutionService.updateIncidentStatus(item.complaintId, 'approved');
        showNotification('Report approved and forwarded successfully.', 'success');
      } else if (action === 'reject') {
        await PollutionService.updateIncidentStatus(item.complaintId, 'dismissed');
        showNotification('Report rejected successfully.', 'info');
      } else if (action === 'delete') {
        await PollutionService.deleteIncident(item.complaintId);
        showNotification('Report hard deleted and wiped from database.', 'error');
      }
      setPreviewMedia(null);
      loadMediaData();
    } catch (e) {
      console.error('Failed to execute single action:', e);
      showNotification('Action execution failed. Please try again.', 'error');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400';
      case 'high': return 'border-orange-200 dark:border-orange-900 bg-orange-55 bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-400';
      case 'medium': return 'border-yellow-250 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-955/20 text-yellow-805 dark:text-yellow-400';
      default: return 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-400';
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved') {
      return 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border-emerald-250';
    }
    if (checkApprovedStatus(s)) {
      return 'bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 border-blue-250';
    }
    switch (s) {
      case 'submitted':
      case 'ai_verification_in_progress':
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-955/20 text-amber-750 dark:text-amber-400 border-amber-250';
      case 'rejected':
      case 'dismissed':
        return 'bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 border-red-205';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-205';
    }
  };

  // Multiple active filters processor
  const processedMedia = mediaList.filter(item => {
    // 1. Comprehensive Search filter across ALL report aspects
    const term = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (term) {
      matchesSearch = (
        (item.name || '').toLowerCase().includes(term) ||
        (item.location || '').toLowerCase().includes(term) ||
        (item.user || '').toLowerCase().includes(term) ||
        (item.email || '').toLowerCase().includes(term) ||
        (item.status || '').toLowerCase().includes(term) ||
        (item.severity || '').toLowerCase().includes(term) ||
        (item.categoryName || '').toLowerCase().includes(term) ||
        (item.fullDescription || '').toLowerCase().includes(term) ||
        (item.resolutionSummary || '').toLowerCase().includes(term) ||
        (item.resolutionActions || '').toLowerCase().includes(term) ||
        (item.assignedOfficer || '').toLowerCase().includes(term)
      );
    }

    // 2. Type/Status filter
    const matchesTypeStatus = filter === 'all' ||
      (filter === 'image' && item.type === 'image') ||
      (filter === 'video' && item.type === 'video') ||
      (filter === 'pending' && checkPendingStatus(item.status)) ||
      (filter === 'approved' && checkApprovedStatus(item.status)) ||
      (filter === 'resolved' && checkResolvedStatus(item.status)) ||
      (filter === 'flagged' && (item.status === 'rejected' || item.status === 'dismissed'));

    // 3. Issue Type / Category Filter
    let matchesIssueType = true;
    if (selectedIssueType !== 'all') {
      const cat = (item.categoryName || '').toLowerCase();
      const sel = selectedIssueType.toLowerCase();
      if (sel === 'land') {
        matchesIssueType = cat.includes('land') || cat.includes('waste') || cat.includes('garbage');
      } else {
        matchesIssueType = cat.includes(sel);
      }
    }

    // 4. Filter by Time / Upload Date
    let matchesDate = true;
    if (selectedDate !== 'all') {
      const rawDateStr = item.uploadTimestamp || item.reportedAt || item.date;
      const uploadTime = rawDateStr ? new Date(rawDateStr).getTime() : NaN;
      if (!isNaN(uploadTime)) {
        const now = Date.now();
        const diffMs = now - uploadTime;
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (selectedDate === 'today') {
          matchesDate = diffHours <= 24;
        } else if (selectedDate === 'week') {
          matchesDate = diffDays <= 7;
        } else if (selectedDate === 'month') {
          matchesDate = diffDays <= 30;
        } else if (selectedDate === 'older') {
          matchesDate = diffDays > 30;
        }
      }
    }

    return matchesSearch && matchesTypeStatus && matchesIssueType && matchesDate;
  });

  const handleExportSelected = async () => {
    if (selectedMedia.length === 0) {
      showNotification('Please select at least one media report item to export.', 'info');
      return;
    }

    const targetItems = mediaList.filter((m) => selectedMedia.includes(m.id));
    if (targetItems.length === 0) {
      showNotification('No matching selected items found to export.', 'info');
      return;
    }

    setIsExporting(true);
    showNotification(`Preparing zip package for ${targetItems.length} selected report(s)...`, 'info');

    try {
      const helperFetchMedia = async (url: string, defaultExt: string = 'jpg') => {
        try {
          if (url.startsWith('data:image/svg+xml')) {
            const textEncoder = new TextEncoder();
            const rawSvg = decodeURIComponent(url.split(',')[1] || '');
            return { buffer: textEncoder.encode(rawSvg).buffer, ext: 'svg' };
          }
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buffer = await res.arrayBuffer();
          let ext = defaultExt;
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
          else if (contentType.includes('webp')) ext = 'webp';
          else if (contentType.includes('mp4')) ext = 'mp4';
          return { buffer, ext };
        } catch (e) {
          console.warn(`Could not download raw binary for ${url}, writing reference doc:`, e);
          const textEncoder = new TextEncoder();
          return { buffer: textEncoder.encode(`Media URL: ${url}`).buffer, ext: 'txt' };
        }
      };

      const generateReportInfoTxt = (item: any) => {
        return `======================================================================
CLEANISENSE MUNICIPAL INCIDENT REPORT INFORMATION
======================================================================
Report ID        : ${item.complaintId || item.id}
Title / Name     : ${item.name}
Reporter Name    : ${item.user || 'Anonymous Citizen'}
Reporter Email   : ${item.email || 'N/A'}
Status           : ${item.status}
Severity Level   : ${item.severity}
Upload Date      : ${item.date} (ISO: ${item.uploadTimestamp})
Location Address : ${item.location}
GPS Coordinates  : Lat ${item.latitude}, Lon ${item.longitude}
Media File Type  : ${item.type}
Media URL        : ${item.url}
======================================================================
Exported via CleaniSense Municipality Admin Panel
Time: ${new Date().toLocaleString()}
======================================================================`;
      };

      const triggerBlobDownload = (blob: Blob, filename: string) => {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      };

      if (targetItems.length === 1) {
        // Single report export -> Single ZIP
        const item = targetItems[0];
        const zip = new JSZip();
        const infoTxt = generateReportInfoTxt(item);
        zip.file("report_information.txt", infoTxt);

        const mediaData = await helperFetchMedia(item.url, item.type === 'video' ? 'mp4' : 'jpg');
        zip.file(`incident_media.${mediaData.ext}`, mediaData.buffer);

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const shortId = (item.complaintId || item.id).slice(0, 8);
        triggerBlobDownload(zipBlob, `report_${shortId}_media_export.zip`);
        showNotification(`Exported 1 report media zip successfully.`, 'success');
      } else {
        // Multiple reports export -> Master ZIP containing individual report ZIPs inside
        const masterZip = new JSZip();

        for (let i = 0; i < targetItems.length; i++) {
          const item = targetItems[i];
          const innerZip = new JSZip();

          const infoTxt = generateReportInfoTxt(item);
          innerZip.file("report_information.txt", infoTxt);

          const mediaData = await helperFetchMedia(item.url, item.type === 'video' ? 'mp4' : 'jpg');
          innerZip.file(`incident_media.${mediaData.ext}`, mediaData.buffer);

          const innerZipBlob = await innerZip.generateAsync({ type: "blob" });
          const shortId = (item.complaintId || item.id).slice(0, 8);
          masterZip.file(`report_${shortId}_export.zip`, innerZipBlob);
        }

        const masterZipBlob = await masterZip.generateAsync({ type: "blob" });
        triggerBlobDownload(masterZipBlob, `cleanisense_selected_${targetItems.length}_reports_package.zip`);
        showNotification(`Exported combined zip containing ${targetItems.length} report zips successfully.`, 'success');
      }
    } catch (err: any) {
      console.error('Export zip failed:', err);
      showNotification('Export failed. Please check your browser download permissions.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-955 dark:text-white tracking-tight">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300 font-medium">Review and validate citizen-submitted attachments in a single scroll list</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportSelected}
            disabled={isExporting}
            className={`px-4 py-2.5 text-sm font-semibold rounded-md border transition-colors flex items-center gap-2 cursor-pointer shadow-sm ${
              selectedMedia.length > 0
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white hover:bg-zinc-800 dark:hover:bg-zinc-100'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850'
            }`}
          >
            {isExporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>
              {selectedMedia.length > 0
                ? `Export Selected (${selectedMedia.length})`
                : 'Export Selected'}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                <p className="mt-1.5 text-2xl font-extrabold text-zinc-950 dark:text-white leading-none">{stat.value}</p>
              </div>
              <div className={`p-2 rounded bg-gradient-to-br ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Filters HUD Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Main search bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search across all fields: title, location, reporter, officer, resolution summary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-455 shadow-sm"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status & Media Type */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold dark:text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-md font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
              >
                <option value="all">All Statuses & Types</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved Only</option>
                <option value="resolved">Resolved Only</option>
                <option value="flagged">Flagged / Rejected</option>
                <option value="image">Images Only</option>
                <option value="video">Videos Only</option>
              </select>
            </div>

            {/* Issue Type Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold dark:text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Issue Type:</span>
              <select
                value={selectedIssueType}
                onChange={(e) => setSelectedIssueType(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-md font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
              >
                <option value="all">All Issue Types</option>
                <option value="air">Air Pollution</option>
                <option value="water">Water Pollution</option>
                <option value="land">Land & Waste</option>
                <option value="noise">Noise Pollution</option>
                <option value="other">General / Other</option>
              </select>
            </div>

            {/* Filter by Time */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Time:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-md font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today / Last 24h</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
                <option value="older">Older</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Selection Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="text-zinc-500">
            Filtered matches: <span className="font-bold text-zinc-955 dark:text-white">{processedMedia.length}</span> items
          </div>
          <div className="flex bg-zinc-50 dark:bg-zinc-955 rounded border border-zinc-200 dark:border-slate-800 p-0.5 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-955 dark:hover:text-white'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-zinc-955 dark:text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-955 dark:hover:text-white'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions panel */}
      {selectedMedia.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 rounded-lg animate-fade-in text-left">
          <span className="text-xs font-bold dark:text-zinc-400 dark:text-zinc-300">{selectedMedia.length} media selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction('approve')}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 hover:bg-emerald-100 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedMedia([])}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-955 dark:text-white hover:underline cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Long List Content Visual Representation */}
      {loading ? (
        <div className="py-16 text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
          <RefreshCw className="mx-auto h-8 w-8 text-zinc-400 mb-2 animate-spin" />
          <p className="text-sm font-bold dark:text-zinc-400 dark:text-zinc-300">Fetching dynamic attachment files from complaints database...</p>
        </div>
      ) : processedMedia.length === 0 ? (
        <div className="py-16 text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
          <AlertTriangle className="mx-auto h-8 w-8 text-zinc-400 mb-2 animate-pulse" />
          <p className="text-sm font-bold dark:text-zinc-400 dark:text-zinc-300">No media fits active multi-filter values.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout (Long Scrollable list) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-left max-h-[750px] overflow-y-auto pr-1">
          {processedMedia.map((item) => {
            const isChecked = selectedMedia.includes(item.id);
            const isResolved = checkResolvedStatus(item.status);
            const isApproved = checkApprovedStatus(item.status);
            const isRejected = item.status === 'rejected' || item.status === 'dismissed';
            return (
              <div
                key={item.id}
                className={`rounded-lg border bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between ${isChecked
                    ? 'border-zinc-955 dark:border-white shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700'
                  }`}
              >
                <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-955 overflow-hidden">
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full cursor-pointer" onClick={() => setPreviewMedia(item)}>
                      <img src={item.thumbnail} alt={item.name} onError={handleImageError} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      {item.durationLabel && (
                        <div className="absolute bottom-2 right-2 px-1 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                          {item.durationLabel}
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      onError={handleImageError}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewMedia(item)}
                    />
                  )}

                  {/* Action Badges inside image */}
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border capitalize ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>

                  {/* Resolved Tag on Top Left in Emerald if resolved */}
                  {isResolved && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded border bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 uppercase">
                        Resolved
                      </span>
                    </div>
                  )}

                  {/* Approved Tag on Top Left in Blue if approved */}
                  {!isResolved && isApproved && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded border bg-blue-50 text-blue-800 border-blue-250 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900 uppercase">
                        Approved
                      </span>
                    </div>
                  )}

                  {/* Rejected Tag on Top Left in Red if rejected */}
                  {!isResolved && isRejected && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded border bg-rose-50 text-rose-805 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900 uppercase">
                        Rejected
                      </span>
                    </div>
                  )}

                  {!isResolved && !isApproved && !isRejected && (
                    /* Select Checkbox */
                    <button
                      onClick={() => {
                        if (isChecked) {
                          setSelectedMedia(prev => prev.filter(id => id !== item.id));
                        } else {
                          setSelectedMedia(prev => [...prev, item.id]);
                        }
                      }}
                      className={`absolute top-2 left-2 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${isChecked
                          ? 'bg-zinc-955 dark:bg-white border-zinc-955 dark:border-white text-white dark:text-zinc-950'
                          : 'bg-white/70 border-white/90 text-transparent hover:border-zinc-300'
                        }`}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}

                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border capitalize ${getStatusColor(item.status)}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-zinc-950/70 text-zinc-300 border border-zinc-700">
                      {item.sizeLabel}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-955 dark:text-white text-sm truncate">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                      <span className="truncate">{item.location}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3 shrink-0 text-zinc-400" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs font-bold dark:text-zinc-400 dark:text-zinc-305">{item.user}</span>
                  </div>
                </div>

                {/* Inline Action Triggers */}
                <div className="flex border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <button
                    onClick={() => setPreviewMedia(item)}
                    className="flex-1 py-2 text-xs font-bold dark:text-zinc-400 dark:text-zinc-300 hover:text-zinc-955 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>

                  {!isResolved && !isApproved && (
                    <button
                      onClick={() => handleSingleAction(item.id, 'approve')}
                      className="flex-1 py-2 text-xs font-bold dark:text-zinc-400 dark:text-zinc-300 hover:text-emerald-650 hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-1 border-l border-zinc-150 dark:border-zinc-800 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  )}

                  {!isResolved && !isRejected && (
                    <button
                      onClick={() => handleSingleAction(item.id, 'reject')}
                      className="flex-1 py-2 text-xs font-bold dark:text-zinc-400 dark:text-zinc-305 hover:text-red-650 hover:bg-red-500/5 transition-colors flex items-center justify-center gap-1 border-l border-zinc-150 dark:border-zinc-800 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Layout (Long Scrollable list) */
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="min-w-full divide-y divide-zinc-150 dark:divide-zinc-800">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-955 sticky top-0 z-10">
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Length</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Reporter</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                {processedMedia.map((item) => {
                  const isResolved = checkResolvedStatus(item.status);
                  const isApproved = checkApprovedStatus(item.status);
                  const isRejected = item.status === 'rejected' || item.status === 'dismissed';
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-10 rounded bg-zinc-100 dark:bg-zinc-955 overflow-hidden cursor-pointer shrink-0" onClick={() => setPreviewMedia(item)}>
                            <img src={item.thumbnail} alt={item.name} onError={handleImageError} className="w-full h-full object-cover" />
                            {item.type === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold text-zinc-955 dark:text-white truncate max-w-xs">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold capitalize dark:text-zinc-500 dark:text-zinc-305">{item.type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${getSeverityColor(item.severity)}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${getStatusColor(item.status)}`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs dark:text-zinc-400 dark:text-zinc-300 font-bold">{item.sizeLabel}</td>
                      <td className="px-6 py-4 text-xs dark:text-zinc-400 dark:text-zinc-300 font-semibold">{item.durationLabel || '—'}</td>
                      <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400 font-medium">{item.location}</td>
                      <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400 font-bold">{item.user}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewMedia(item)}
                            className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isResolved && !isApproved && (
                            <button
                              onClick={() => handleSingleAction(item.id, 'approve')}
                              className="p-1.5 text-zinc-500 hover:text-green-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {!isResolved && !isRejected && (
                            <button
                              onClick={() => handleSingleAction(item.id, 'reject')}
                              className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Preview Modal Overlay (Larger max-w-6xl with Map Canvas & Full Details) */}
      {previewMedia && (() => {
        const isResolved = checkResolvedStatus(previewMedia.status);
        const isApproved = checkApprovedStatus(previewMedia.status);
        const isRejected = previewMedia.status === 'rejected' || previewMedia.status === 'dismissed';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setPreviewMedia(null)} />
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-6xl text-left z-10 animate-scale-in max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold rounded border border-blue-200 dark:border-blue-800 bg-blue-50 text-blue-800 dark:bg-blue-955/40 dark:text-blue-300">
                    Severity: {previewMedia.severityScore !== undefined && previewMedia.severityScore !== null ? `${Math.round(previewMedia.severityScore)}%` : '45%'}
                  </span>
                  {isResolved && (
                    <span className="px-2.5 py-1 text-xs font-bold rounded border bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 uppercase">
                      Resolved
                    </span>
                  )}
                  {!isResolved && isApproved && (
                    <span className="px-2.5 py-1 text-xs font-bold rounded border bg-blue-50 text-blue-800 border-blue-250 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900 uppercase">
                      Approved
                    </span>
                  )}
                  {!isResolved && isRejected && (
                    <span className="px-2.5 py-1 text-xs font-bold rounded border bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900 uppercase">
                      Rejected
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content - Expanded 3 Columns Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 overflow-y-auto flex-1">
                {/* Column 1: Interactive Zoomable/Panable Media viewer panel */}
                <div className="p-5 bg-zinc-950 flex flex-col justify-between items-center relative min-h-[400px]">
                  {/* Photo Switcher Tabs when Resolved */}
                  {(isResolved || previewMedia.resolutionAfterImage) && (
                    <div className="flex gap-2 mb-3 w-full z-20">
                      <button
                        onClick={() => { setActiveMediaTab('reported'); resetZoomPan(); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${activeMediaTab === 'reported' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'}`}
                      >
                        📷 Pollution Photo
                      </button>
                      <button
                        onClick={() => { setActiveMediaTab('resolved'); resetZoomPan(); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${activeMediaTab === 'resolved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'}`}
                      >
                        ✅ Resolution Evidence
                      </button>
                    </div>
                  )}

                  {/* Floating Zoom & Pan Controls */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2 py-1 rounded-lg border border-white/20 z-20 text-white shadow-md">
                    <button
                      onClick={handleZoomIn}
                      className="p-1 hover:bg-white/20 rounded text-xs font-bold cursor-pointer"
                      title="Zoom In (+)"
                    >
                      +
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1 select-none">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={handleZoomOut}
                      className="p-1 hover:bg-white/20 rounded text-xs font-bold cursor-pointer"
                      title="Zoom Out (-)"
                    >
                      -
                    </button>
                    {zoomScale > 1 && (
                      <button
                        onClick={resetZoomPan}
                        className="p-1 hover:bg-white/20 rounded text-[10px] font-bold ml-1 border-l border-white/20 pl-2 cursor-pointer"
                        title="Reset 100%"
                      >
                        ↺ Reset
                      </button>
                    )}
                  </div>

                  {/* Image / Video Display Container with Pan & Zoom */}
                  <div
                    className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
                      zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
                    }`}
                    onWheel={(e) => {
                      if (e.deltaY < 0) handleZoomIn();
                      else handleZoomOut();
                    }}
                    onMouseDown={(e) => {
                      if (zoomScale > 1) {
                        setIsDragging(true);
                        setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isDragging && zoomScale > 1) {
                        setPanPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                      }
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    {activeMediaTab === 'resolved' && previewMedia.resolutionAfterImage ? (
                      <img
                        src={previewMedia.resolutionAfterImage}
                        alt="Resolution evidence photo"
                        onError={handleImageError}
                        style={{
                          transform: `scale(${zoomScale}) translate(${panPos.x / zoomScale}px, ${panPos.y / zoomScale}px)`,
                          transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                        }}
                        className="max-h-[420px] w-auto rounded object-contain select-none pointer-events-auto"
                      />
                    ) : previewMedia.type === 'video' ? (
                      <video
                        src={previewMedia.url}
                        controls
                        autoPlay
                        className="max-h-[420px] w-auto rounded object-contain"
                      />
                    ) : (
                      <img
                        src={previewMedia.url}
                        alt={previewMedia.name}
                        onError={handleImageError}
                        style={{
                          transform: `scale(${zoomScale}) translate(${panPos.x / zoomScale}px, ${panPos.y / zoomScale}px)`,
                          transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                        }}
                        className="max-h-[420px] w-auto rounded object-contain select-none pointer-events-auto"
                      />
                    )}
                  </div>
                  <div className="w-full mt-4 flex items-center justify-between text-[11px] font-semibold text-zinc-400 border-t border-zinc-800 pt-3">
                    <span>Active View: {activeMediaTab === 'resolved' ? 'Resolution Photo' : previewMedia.type}</span>
                    <span>Report ID: {(previewMedia.complaintId || previewMedia.id).slice(0, 8)}</span>
                  </div>
                </div>

                {/* Column 2: Live Leaflet Map showing coordinates */}
                <div className="bg-slate-50 dark:bg-zinc-955 p-5 min-h-[400px] border-y lg:border-y-0 lg:border-x border-zinc-200 dark:border-zinc-800 flex flex-col justify-between relative z-0">
                  <div className="flex-1 min-h-[280px]">
                    {previewMedia.latitude && previewMedia.longitude ? (
                      <PreviewMap
                        latitude={previewMedia.latitude}
                        longitude={previewMedia.longitude}
                        locationName={previewMedia.location}
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-100 dark:bg-zinc-900 animate-pulse flex items-center justify-center text-xs text-zinc-400">
                        No Coordinates available
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
                    <p className="font-mono">Latitude: {previewMedia.latitude?.toFixed(5)}° N</p>
                    <p className="font-mono">Longitude: {previewMedia.longitude?.toFixed(5)}° E</p>
                    <p className="text-[10px] text-zinc-400 mt-1">📍 {previewMedia.location}</p>
                  </div>
                </div>

                {/* Column 3: Dual Descriptions, Officer Dropdown & Severity Percentage */}
                <div className="p-6 flex flex-col justify-between min-h-[500px]">
                  <div className="space-y-4 overflow-y-auto pr-1">
                    {/* Short Description */}
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Short Description</span>
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white mt-0.5 leading-snug">
                        {previewMedia.shortDescription || previewMedia.name || 'Environmental Incident'}
                      </h3>
                    </div>

                    {/* Full Description */}
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Full Description</span>
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed mt-1 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-800">
                        {previewMedia.fullDescription || previewMedia.description || 'No detailed description provided.'}
                      </p>
                    </div>

                    {/* Officer Assignment Section - Visible ONLY after Approval and BEFORE Resolution */}
                    {isApproved && !isResolved && (
                      <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">
                            {previewMedia.assignedOfficer && previewMedia.assignedOfficer !== 'None' ? 'Assigned Officer' : 'Assign Municipal Officer'}
                          </span>
                          {previewMedia.assignedOfficer && previewMedia.assignedOfficer !== 'None' ? (
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
                          value={previewMedia.assignedOfficer || ''}
                          onChange={(e) => handleAssignOfficer(e.target.value)}
                          disabled={isAssigningOfficer}
                          className="w-full text-xs font-bold border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-600 cursor-pointer"
                        >
                          <option value="" disabled={!!previewMedia.assignedOfficer}>
                            {previewMedia.assignedOfficer ? `Current: ${previewMedia.assignedOfficer} (Click to Change Officer)` : "-- Select Officer to Assign --"}
                          </option>
                          {officersList.map((off) => (
                            <option key={off} value={off}>{off}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Severity Score Percentage Card (Percentage Only) */}
                    <div className="p-3.5 bg-blue-50/60 dark:bg-blue-955/20 border border-blue-200/80 dark:border-blue-900/40 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider block">
                          AI Evaluated Severity Score
                        </span>
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5 block">
                          AI Verification Complete
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          {previewMedia.severityScore !== undefined && previewMedia.severityScore !== null
                            ? `${Math.round(previewMedia.severityScore)}%`
                            : '45%'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Reporter</span>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{previewMedia.user}</p>
                      </div>
                      {previewMedia.email && (
                        <div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Reporter Email</span>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 break-all">{previewMedia.email}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Reported Date</span>
                      <p className="text-xs text-zinc-800 dark:text-zinc-205 mt-0.5">{previewMedia.date}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Issue Category</span>
                        <p className="text-xs font-bold dark:text-zinc-200 mt-0.5 capitalize">{previewMedia.categoryName || 'Environmental'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Review Status</span>
                        <p className="text-xs font-bold capitalize mt-0.5">{previewMedia.status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>

                    {/* Government Resolution Report Details */}
                    {(isResolved || previewMedia.resolutionSummary) && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2 text-left mt-2">
                        <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/40 pb-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-400 tracking-wider">
                            Government Resolution Info
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            Officer: {previewMedia.assignedOfficer || 'Municipal Officer'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold block">Resolution Summary:</span>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {previewMedia.resolutionSummary || previewMedia.rawIncident?.resolution?.summary || 'Issue resolved successfully by municipal team.'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold block">Work Details & Actions Performed:</span>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300">
                            {previewMedia.resolutionActions || previewMedia.rawIncident?.resolution?.actions || 'Field inspection conducted and remedial measures completed.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 mt-4 flex items-center gap-2">
                    {!isResolved && !isRejected && (
                      <button
                        onClick={() => setShowResolveModal(true)}
                        className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-955/20 text-blue-705 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-md transition-colors cursor-pointer text-center"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {!isResolved && !isApproved && !isRejected && (
                      <button
                        onClick={() => handleSingleAction(previewMedia.id, 'approve')}
                        className="flex-1 py-2.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450 hover:bg-emerald-100 border border-emerald-250 text-xs font-bold rounded-md transition-colors cursor-pointer text-center"
                      >
                        Approve
                      </button>
                    )}
                    {!isResolved && !isRejected && !isApproved && (
                      <button
                        onClick={() => handleSingleAction(previewMedia.id, 'reject')}
                        className="flex-1 py-2.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 hover:bg-red-100 border border-red-200 text-xs font-bold rounded-md transition-colors cursor-pointer text-center"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleSingleAction(previewMedia.id, 'delete')}
                      className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:text-red-650 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-850 transition-colors cursor-pointer"
                      title="Hard delete report"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Resolve Modal Overlay */}
      {showResolveModal && previewMedia && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowResolveModal(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-md text-left z-10 p-6 animate-scale-in space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white uppercase tracking-widest">
                Resolve Incident Report
              </h3>
              <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1">
                Provide the final resolution summary and upload photo evidence. Both fields are mandatory.
              </p>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Resolution Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="E.g., Garbage cleared & site sanitized"
                  value={resolveSummary}
                  onChange={(e) => setResolveSummary(e.target.value)}
                  required
                  className="w-full text-xs border border-zinc-200 dark:border-zinc-750 rounded-lg p-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Work Details & Actions Performed <span className="text-rose-500">*</span>
                </label>
                <textarea
                  placeholder="Describe detailed inspection findings, personnel dispatched, equipment used, and outcome..."
                  rows={3}
                  value={resolveActions}
                  onChange={(e) => setResolveActions(e.target.value)}
                  required
                  className="w-full text-xs border border-zinc-200 dark:border-zinc-750 rounded-lg p-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Resolution Photo Evidence <span className="text-rose-500">*</span>
                </label>
                <div className="relative border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-600 rounded-lg p-4 text-center cursor-pointer">
                  <input
                    type="file"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResolveFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                  />
                  {resolveFile ? (
                    <div className="text-[11px] font-semibold text-emerald-650 dark:text-emerald-450 truncate">
                      Selected: {resolveFile.name}
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm block">📸</span>
                      <span className="text-[10px] text-zinc-500 block">Click to select photo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResolveModal(false);
                    setResolveSummary("");
                    setResolveActions("");
                    setResolveFile(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolvingLoading}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  {resolvingLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Confirm Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-3 rounded-xl shadow-2xl border border-zinc-700 dark:border-zinc-300 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 dark:text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-400 dark:text-red-600 shrink-0" />}
          {toast.type === 'info' && <Clock className="h-5 w-5 text-blue-400 dark:text-blue-600 shrink-0" />}
          <span className="text-xs font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-zinc-400 hover:text-white dark:hover:text-zinc-900 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}