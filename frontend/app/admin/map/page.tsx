// app/admin/map/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { complaintService } from '@/services/complaint';
import { HotspotCluster, IncidentReport } from '@/types/pollution';
import { 
  MapPin, 
  Filter, 
  AlertTriangle, 
  Activity, 
  MapPinned, 
  Layers, 
  Compass, 
  Search,
  Eye,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';

export default function IncidentsMapPage() {
  const [clustersList, setClustersList] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [mapLayer, setMapLayer] = useState<'vector' | 'satellite' | 'heatmap' | 'aqi'>('vector');

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const mapData = await complaintService.getMapData();
      
      const defaultClusters = [
        { id: 'c1', center: { latitude: 19.076, longitude: 72.877, city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra' }, radius: 250, incidentCount: 14, averageSeverity: 3.8, dominantType: 'air', trend: 'growing', createdAt: '2026-06-01', top: '35%', left: '25%' },
        { id: 'c2', center: { latitude: 28.704, longitude: 77.102, city: 'Delhi', district: 'North West Delhi', state: 'Delhi' }, radius: 400, incidentCount: 22, averageSeverity: 4.5, dominantType: 'air', trend: 'stable', createdAt: '2026-06-05', top: '25%', left: '60%' },
        { id: 'c3', center: { latitude: 12.971, longitude: 77.594, city: 'Bangalore', district: 'Bangalore Urban', state: 'Karnataka' }, radius: 150, incidentCount: 9, averageSeverity: 2.9, dominantType: 'land', trend: 'shrinking', createdAt: '2026-06-10', top: '65%', left: '45%' },
        { id: 'c4', center: { latitude: 13.082, longitude: 80.270, city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu' }, radius: 300, incidentCount: 12, averageSeverity: 3.2, dominantType: 'water', trend: 'growing', createdAt: '2026-06-12', top: '50%', left: '75%' },
      ];
      
      if (mapData && mapData.hotspots && mapData.hotspots.length > 0) {
        const mapped = mapData.hotspots.map((c: any, index: number) => {
          const positions = [
            { top: '35%', left: '25%' },
            { top: '25%', left: '60%' },
            { top: '65%', left: '45%' },
            { top: '50%', left: '75%' }
          ];
          const pos = positions[index % positions.length];
          return {
            id: c.id,
            center: {
              latitude: c.latitude,
              longitude: c.longitude,
              city: `Hotspot Cluster #${index + 1}`,
              district: `Contains ${c.count} Reports`,
              state: `Radius: ${c.radius_meters}m`
            },
            radius: c.radius_meters,
            incidentCount: c.count,
            averageSeverity: 3.5,
            dominantType: 'air',
            trend: 'stable',
            createdAt: c.created_at || new Date().toISOString(),
            top: pos.top,
            left: pos.left
          };
        });
        setClustersList(mapped);
      } else {
        setClustersList(defaultClusters);
      }

      // Load incident points if returned by singles
      if (mapData && mapData.singles) {
        const mappedIncidents = mapData.singles.map((s: any) => ({
          id: s.id,
          description: s.title,
          severity: 'medium' as const,
          status: s.status as any,
          type: s.category_name?.toLowerCase() || 'general',
          reportedAt: new Date().toISOString(),
          userName: 'Anonymous Citizen',
          userEmail: 'N/A',
          location: {
            latitude: s.latitude,
            longitude: s.longitude,
            address: s.location_name
          }
        }));
        setIncidents(mappedIncidents);
      }
    } catch (e) {
      console.error('Error loading map details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Read-only canvas. Hotspot creation is not available in the current backend.
    return;
  };

  const getDominantIcon = (type: string) => {
    switch (type) {
      case 'air': return '💨';
      case 'land': return '🗑️';
      case 'water': return '💧';
      case 'noise': return '📢';
      default: return '📍';
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'growing': return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900';
      case 'shrinking': return 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900';
      default: return 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-805 dark:text-yellow-400 border-yellow-250 dark:border-yellow-900';
    }
  };

  const filteredClusters = selectedType === 'all' 
    ? clustersList 
    : clustersList.filter(c => c.dominantType === selectedType);

  return (
    <div className="space-y-6 fade-in text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <MapPin className="h-8 w-8 text-zinc-950 dark:text-white" />
            Incidents Map
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Hyperlocal pollution clusters and real-time citizen-reported hotspots</p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'air', 'land', 'water', 'noise'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all cursor-pointer border ${
                selectedType === t 
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm' 
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 dark:text-zinc-400 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch text-left">
        
        {/* Left Side: Hotspot Clusters List */}
        <div className="lg:col-span-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800 mb-4">
            <h3 className="font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-zinc-400" />
              Active Hotspots ({filteredClusters.length})
            </h3>
          </div>
          
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {filteredClusters.map((cluster) => {
              const isSelected = selectedCluster?.id === cluster.id;
              return (
                <div
                  key={cluster.id}
                  onClick={() => setSelectedCluster(cluster)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-100 dark:bg-zinc-800 shadow-sm' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg">{getDominantIcon(cluster.dominantType)}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border capitalize font-bold ${getTrendBadge(cluster.trend)}`}>
                      {cluster.trend}
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white dark:text-white truncate">{cluster.center.city}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{cluster.center.district}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span className="font-medium">Radius: {cluster.radius}m</span>
                    <span className="text-zinc-950 dark:text-white font-bold">{cluster.incidentCount} Reports</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Map Canvas Simulation */}
        <div className="lg:col-span-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#0c111c] overflow-hidden flex flex-col relative min-h-[500px]">
          
          {/* Map Controls */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
            {/* Search HUD */}
            <div className="bg-white/95 dark:bg-zinc-900/95 rounded-lg p-2 flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 pointer-events-auto shadow-xl">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search coordinates..."
                className="bg-transparent border-0 outline-none text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 w-36"
              />
            </div>
            
            {/* Layer Toggles & Refresh */}
            <div className="flex gap-2 pointer-events-auto">
              <div className="bg-white/95 dark:bg-zinc-900/95 rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 flex gap-1 shadow-xl">
                {(['vector', 'satellite', 'heatmap', 'aqi'] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setMapLayer(layer)}
                    className={`px-2 py-1 text-[10px] font-bold rounded capitalize cursor-pointer transition-all ${
                      mapLayer === layer 
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={loadMapData}
                className="p-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all cursor-pointer shadow-xl"
                title="Refresh logs"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interactive Map Visual Simulator */}
          <div 
            onClick={handleMapClick}
            className={`flex-1 relative flex items-center justify-center transition-all duration-300 ${
              mapLayer === 'satellite' ? 'bg-[#0f1d13]' :
              mapLayer === 'heatmap' ? 'bg-[#180a1a]' :
              mapLayer === 'aqi' ? 'bg-[#1b1c0e]' : 'bg-[#0a0f1d]'
            } overflow-hidden cursor-crosshair`}
            title="Click anywhere to simulate placing a new incident marker!"
          >
            {/* Grid Pattern Overlay representing map mesh */}
            {mapLayer === 'vector' && (
              <>
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#4f46e5_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [background-size:96px_96px]" />
              </>
            )}

            {mapLayer === 'satellite' && (
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]" />
            )}

            {mapLayer === 'heatmap' && (
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#a855f7]/5 to-[#e11d48]/10" />
            )}

            {mapLayer === 'aqi' && (
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#ca8a04_1px,transparent_1px)] [background-size:40px_40px]" />
            )}
            
            {/* Compass HUD */}
            <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-[9px] text-zinc-500 font-mono shadow-xl">
              <p>LAT: {selectedCluster ? selectedCluster.center.latitude.toFixed(4) : '19.0760'}</p>
              <p>LNG: {selectedCluster ? selectedCluster.center.longitude.toFixed(4) : '72.8777'}</p>
              <p className="text-indigo-500 font-bold mt-1 uppercase">Grid HUD ACTIVE</p>
            </div>

            {/* Simulated Hotspots Canvas Pins */}
            {filteredClusters.map((cluster) => {
              const isSelected = selectedCluster?.id === cluster.id;
              return (
                <div 
                  key={cluster.id}
                  className="absolute cursor-pointer group"
                  style={{ top: cluster.top, left: cluster.left }}
                  onClick={() => setSelectedCluster(cluster)}
                >
                  {/* Outer Severity Pulsing Ring */}
                  <div className={`absolute -inset-8 rounded-full opacity-30 ${
                    cluster.dominantType === 'air' ? 'bg-red-500/20 border border-red-500/20' :
                    cluster.dominantType === 'water' ? 'bg-cyan-555/20 border border-cyan-500/20' :
                    cluster.dominantType === 'noise' ? 'bg-yellow-500/20 border border-yellow-500/20' :
                    'bg-orange-500/20 border border-orange-500/20'
                  } ${isSelected ? 'scale-125 animate-ping' : 'animate-pulse'}`} />
                  
                  {/* Pin Dot */}
                  <div className={`relative h-6.5 w-6.5 rounded-full flex items-center justify-center border shadow-xl transition-all ${
                    isSelected 
                      ? 'scale-125 border-zinc-950 dark:border-white bg-zinc-950 dark:bg-white text-white dark:text-zinc-950' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:scale-110'
                  }`}>
                    <span className="text-xs">{getDominantIcon(cluster.dominantType)}</span>
                  </div>
                  
                  {/* Hover Info Card */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-2xl">
                    <p className="text-xs font-bold text-zinc-950 dark:text-white">{cluster.center.city}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-bold">{cluster.incidentCount} active reports</p>
                    <div className="h-1 bg-zinc-950 dark:bg-white rounded-full mt-2" style={{ width: `${(cluster.averageSeverity / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}

            {/* Instructions info box */}
            {!selectedCluster && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="bg-white/95 dark:bg-zinc-900/95 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-xs text-center shadow-2xl">
                  <Compass className="h-8 w-8 text-zinc-950 dark:text-white mx-auto mb-2 animate-bounce" />
                  <p className="text-xs text-zinc-950 dark:text-white dark:text-white font-bold">Interactive Telemetry Mesh</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                    Select a hotspot from the left list, or click anywhere directly on the map to drop a new incident coordinate marker pin.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details footer if cluster is selected */}
          {selectedCluster && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-inner">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{getDominantIcon(selectedCluster.dominantType)}</span>
                <div>
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white dark:text-white">Hotspot: {selectedCluster.center.city}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{selectedCluster.center.district}, {selectedCluster.center.state}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-1.5 rounded min-w-[70px]">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Severity</p>
                  <p className="text-zinc-950 dark:text-white font-bold mt-0.5">{selectedCluster.averageSeverity}/5.0</p>
                </div>
                <div className="text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-1.5 rounded min-w-[70px]">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Incidents</p>
                  <p className="text-zinc-950 dark:text-white font-bold mt-0.5">{selectedCluster.incidentCount}</p>
                </div>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:text-zinc-200 rounded transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
