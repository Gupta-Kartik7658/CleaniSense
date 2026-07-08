// app/admin/media/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { complaintService } from '@/services/complaint';
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

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [previewMedia, setPreviewMedia] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Custom multi-filter states
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedLength, setSelectedLength] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

  const [mediaList, setMediaList] = useState<any[]>([]);

  useEffect(() => {
    loadMediaData();
  }, []);

  const loadMediaData = async () => {
    setLoading(true);
    try {
      const response = await complaintService.getComplaints({ page_size: 50 });
      const items = response.items || [];
      
      // Concurrently load details to unpack attachments
      const details = await Promise.all(
        items.map(async (item: any) => {
          try {
            return await complaintService.getComplaintDetail(item.id);
          } catch {
            return null;
          }
        })
      );

      const attachmentsList: any[] = [];
      details.forEach((detail: any) => {
        if (detail && detail.attachments) {
          detail.attachments.forEach((att: any) => {
            attachmentsList.push({
              id: att.id,
              complaintId: detail.id,
              type: att.file_type.startsWith('video') ? 'video' : 'image',
              url: att.public_url,
              thumbnail: att.public_url,
              name: att.file_name || detail.title || 'Attachment',
              location: detail.location_name || 'Verified Coordinate',
              user: 'Citizen Reporter',
              uploadTimestamp: detail.created_at || new Date().toISOString(),
              date: new Date(detail.created_at).toLocaleDateString(),
              severity: detail.severity?.toLowerCase() || 'medium',
              status: detail.status || 'submitted',
              sizeInBytes: att.file_size_bytes || 800000,
              sizeLabel: `${Math.round((att.file_size_bytes || 800000) / 1024)} KB`,
              durationInSeconds: null,
              durationLabel: null
            });
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

  const stats = [
    { label: 'Total Media', value: mediaList.length, icon: Image, color: 'text-blue-500', bg: 'from-blue-500/10 to-blue-600/10' },
    { label: 'Pending Review', value: mediaList.filter(m => m.status === 'submitted' || m.status === 'in_progress').length, icon: Clock, color: 'text-yellow-500', bg: 'from-yellow-500/10 to-yellow-600/10' },
    { label: 'Flagged Logs', value: mediaList.filter(m => m.status === 'rejected').length, icon: Flag, color: 'text-red-500', bg: 'from-red-500/10 to-red-600/10' },
    { label: 'Approved Media', value: mediaList.filter(m => m.status === 'resolved').length, icon: Check, color: 'text-emerald-555', bg: 'from-green-500/10 to-green-600/10' },
  ];

  const handleBulkAction = (action: 'approve' | 'flag' | 'delete') => {
    // Moderation action is unavailable in backend. Disable mock update.
    alert('Moderation actions (Approve, Flag, Delete attachment) are unavailable in the current backend API.');
  };

  const handleSingleAction = (id: string, action: 'approve' | 'flag' | 'delete') => {
    // Moderation action is unavailable in backend. Disable mock update.
    alert('Moderation actions are not supported by the current backend.');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400';
      case 'high': return 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-400';
      case 'medium': return 'border-yellow-250 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-955/20 text-yellow-805 dark:text-yellow-400';
      default: return 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250';
      case 'submitted': return 'bg-amber-50 dark:bg-amber-955/20 text-amber-750 dark:text-amber-400 border-amber-250';
      case 'rejected': return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-205';
      default: return 'bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-205';
    }
  };

  // Multiple active filters processor
  const processedMedia = mediaList.filter(item => {
    // 1. Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.user.toLowerCase().includes(searchTerm.toLowerCase());
                          
    // 2. Type/Status filter
    const matchesTypeStatus = filter === 'all' || 
                              (filter === 'image' && item.type === 'image') ||
                              (filter === 'video' && item.type === 'video') ||
                              (item.status === filter);
                              
    // 3. Size Filter
    let matchesSize = true;
    if (selectedSize === 'small') matchesSize = item.sizeInBytes < 1048576; // < 1MB
    else if (selectedSize === 'medium') matchesSize = item.sizeInBytes >= 1048576 && item.sizeInBytes <= 5242880; // 1MB-5MB
    else if (selectedSize === 'large') matchesSize = item.sizeInBytes > 5242880; // > 5MB
    
    // 4. Video Duration Length Filter
    let matchesLength = true;
    if (selectedLength !== 'all') {
      if (item.type !== 'video') {
        matchesLength = false;
      } else {
        const duration = item.durationInSeconds || 0;
        if (selectedLength === 'short') matchesLength = duration < 15;
        else if (selectedLength === 'medium') matchesLength = duration >= 15 && duration <= 60;
        else if (selectedLength === 'long') matchesLength = duration > 60;
      }
    }
    
    // 5. Upload Date Filter
    let matchesDate = true;
    if (selectedDate !== 'all') {
      const uploadTime = new Date(item.uploadTimestamp).getTime();
      const diffDays = (Date.now() - uploadTime) / (1000 * 3600 * 24);
      if (selectedDate === 'today') matchesDate = diffDays <= 1;
      else if (selectedDate === 'week') matchesDate = diffDays <= 7;
      else if (selectedDate === 'month') matchesDate = diffDays <= 30;
    }
    
    return matchesSearch && matchesTypeStatus && matchesSize && matchesLength && matchesDate;
  });

  return (
    <div className="space-y-6 fade-in text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">Media Library</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300 font-medium">Review and validate citizen-submitted attachments in a single scroll list</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert(`Exporting ${selectedMedia.length || processedMedia.length} media items...`)}
            className="px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export Selected
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
                <p className="mt-1.5 text-2xl font-extrabold text-zinc-950 dark:text-white dark:text-white leading-none">{stat.value}</p>
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
              placeholder="Search by name, location, or reporter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-450 shadow-sm"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category / Type */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold dark:text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Type:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md font-bold text-zinc-700 dark:text-zinc-300 outline-none"
              >
                <option value="all">All Items</option>
                <option value="image">Images Only</option>
                <option value="video">Videos Only</option>
                <option value="pending">Pending review</option>
                <option value="approved">Approved only</option>
                <option value="flagged">Flagged logs</option>
              </select>
            </div>

            {/* Size Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold dark:text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Size:</span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md font-bold text-zinc-700 dark:text-zinc-300 outline-none"
              >
                <option value="all">All Sizes</option>
                <option value="small">Small (&lt; 1 MB)</option>
                <option value="medium">Medium (1 MB - 5 MB)</option>
                <option value="large">Large (&gt; 5 MB)</option>
              </select>
            </div>

            {/* Video Length Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold dark:text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Length:</span>
              <select
                value={selectedLength}
                onChange={(e) => setSelectedLength(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-md font-bold text-zinc-700 dark:text-zinc-300 outline-none"
              >
                <option value="all">All Durations</option>
                <option value="short">Short (&lt; 15s)</option>
                <option value="medium">Medium (15s - 60s)</option>
                <option value="long">Long (&gt; 60s)</option>
              </select>
            </div>

            {/* Upload Date Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-zinc-455 dark:text-zinc-500 uppercase tracking-wider">Upload Date:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md font-bold text-zinc-700 dark:text-zinc-300 outline-none"
              >
                <option value="all">All Times</option>
                <option value="today">Today Only</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Selection Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="text-zinc-500">
            Filtered matches: <span className="font-bold text-zinc-950 dark:text-white">{processedMedia.length}</span> items
          </div>
          <div className="flex bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 p-0.5 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-950 dark:hover:text-white'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-950 dark:hover:text-white'}`}
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
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 hover:bg-emerald-100 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              Approve Selected
            </button>
            <button 
              onClick={() => handleBulkAction('flag')} 
              className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 hover:bg-red-100 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              Flag Selected
            </button>
            <button 
              onClick={() => handleBulkAction('delete')} 
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded transition-colors cursor-pointer"
            >
              Delete Selected
            </button>
            <button 
              onClick={() => setSelectedMedia([])} 
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-950 dark:text-white hover:underline cursor-pointer"
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
            return (
              <div
                key={item.id}
                className={`rounded-lg border bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between ${
                  isChecked
                    ? 'border-zinc-950 dark:border-white shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700'
                }`}
              >
                <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full cursor-pointer" onClick={() => setPreviewMedia(item)}>
                      <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
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
                      className="w-full h-full object-cover cursor-pointer" 
                      onClick={() => setPreviewMedia(item)}
                    />
                  )}
                  
                  {/* Action Badges inside image */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border capitalize ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border capitalize ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-zinc-950/70 text-zinc-300 border border-zinc-700">
                      {item.sizeLabel}
                    </span>
                  </div>
                  
                  {/* Select Checkbox */}
                  <button
                    onClick={() => {
                      if (isChecked) {
                        setSelectedMedia(prev => prev.filter(id => id !== item.id));
                      } else {
                        setSelectedMedia(prev => [...prev, item.id]);
                      }
                    }}
                    className={`absolute top-2 left-2 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-zinc-950 dark:bg-white border-zinc-955 dark:border-white text-white dark:text-zinc-950' 
                        : 'bg-white/70 border-white/90 text-transparent hover:border-zinc-300'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-950 dark:text-white dark:text-white text-sm truncate">{item.name}</h3>
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
                    <span className="text-xs font-bold dark:text-zinc-400 dark:text-zinc-300">{item.user}</span>
                  </div>
                </div>

                {/* Inline Action Triggers */}
                <div className="flex border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <button 
                    onClick={() => setPreviewMedia(item)}
                    className="flex-1 py-2 text-xs font-bold dark:text-zinc-400 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button 
                    onClick={() => handleSingleAction(item.id, 'approve')}
                    className="flex-1 py-2 text-xs font-bold dark:text-zinc-400 dark:text-zinc-300 hover:text-emerald-650 hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-1 border-x border-zinc-150 dark:border-zinc-800 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button 
                    onClick={() => handleSingleAction(item.id, 'delete')}
                    className="flex-1 py-2 text-xs font-bold dark:text-zinc-400 dark:text-zinc-300 hover:text-red-650 hover:bg-red-500/5 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
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
                <tr className="bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-10">
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
                {processedMedia.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-10 rounded bg-zinc-100 dark:bg-zinc-950 overflow-hidden cursor-pointer shrink-0" onClick={() => setPreviewMedia(item)}>
                          <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                          {item.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-zinc-950 dark:text-white dark:text-white truncate max-w-xs">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold capitalize dark:text-zinc-500 dark:text-zinc-300">{item.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${getSeverityColor(item.severity)}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs dark:text-zinc-400 dark:text-zinc-300 font-bold">{item.sizeLabel}</td>
                    <td className="px-6 py-4 text-xs dark:text-zinc-400 dark:text-zinc-300 font-semibold">{item.durationLabel || '—'}</td>
                    <td className="px-6 py-4 text-xs text-zinc-655 dark:text-zinc-400 font-medium">{item.location}</td>
                    <td className="px-6 py-4 text-xs text-zinc-655 dark:text-zinc-400 font-bold">{item.user}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setPreviewMedia(item)}
                          className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleSingleAction(item.id, 'approve')}
                          className="p-1.5 text-zinc-500 hover:text-green-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleSingleAction(item.id, 'delete')}
                          className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Preview Modal Overlay */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setPreviewMedia(null)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl text-left z-10 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border capitalize ${getSeverityColor(previewMedia.severity)}`}>
                {previewMedia.severity} Severity
              </span>
              <button 
                onClick={() => setPreviewMedia(null)}
                className="p-1 text-zinc-400 hover:dark:text-zinc-400 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Media viewer panel */}
              <div className="bg-zinc-950 flex items-center justify-center aspect-video md:aspect-auto md:h-96 relative">
                {previewMedia.type === 'video' ? (
                  <video 
                    src={previewMedia.url} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={previewMedia.url} 
                    alt={previewMedia.name} 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              
              {/* Metadata Details panel */}
              <div className="p-6 flex flex-col justify-between h-96">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Title</span>
                    <h3 className="text-base font-extrabold text-zinc-950 dark:text-white dark:text-white mt-0.5 leading-snug">{previewMedia.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Reporter</span>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{previewMedia.user}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Reported Date</span>
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 mt-0.5">{previewMedia.date}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">File Size</span>
                      <p className="text-xs font-bold dark:text-zinc-200 dark:text-zinc-200 mt-0.5">{previewMedia.sizeLabel}</p>
                    </div>
                    {previewMedia.type === 'video' && (
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Duration</span>
                        <p className="text-xs font-bold dark:text-zinc-200 dark:text-zinc-200 mt-0.5">{previewMedia.durationLabel}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Location</span>
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                      {previewMedia.location}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Review Status</span>
                    <div className="mt-1">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded border capitalize ${getStatusColor(previewMedia.status)}`}>
                        {previewMedia.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approve/Flag actions */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4 flex items-center gap-2">
                  <button 
                    onClick={() => handleSingleAction(previewMedia.id, 'approve')}
                    className="flex-1 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-250 text-xs font-bold rounded-md transition-colors cursor-pointer text-center"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleSingleAction(previewMedia.id, 'flag')}
                    className="flex-1 py-2.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 hover:bg-red-100 border border-red-200 text-xs font-bold rounded-md transition-colors cursor-pointer text-center"
                  >
                    Flag Item
                  </button>
                  <button 
                    onClick={() => handleSingleAction(previewMedia.id, 'delete')}
                    className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:text-red-650 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-850 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}