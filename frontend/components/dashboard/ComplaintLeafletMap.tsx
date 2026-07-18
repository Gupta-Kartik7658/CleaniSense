"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Skeleton } from "../common/Skeleton";
import {
  ComplaintMapData,
  ComplaintMapPoint,
  ComplaintHotspotCluster,
} from "../../types/dashboard";

interface ComplaintLeafletMapProps {
  mapData?: ComplaintMapData;
  loading?: boolean;
  height?: string;
}

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "resolved") return "#10b981";
  if (s === "rejected") return "#94a3b8";
  if (s === "submitted" || s === "draft") return "#f59e0b";
  return "#f43f5e";
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const hasFittedRef = React.useRef(false);

  useEffect(() => {
    if (hasFittedRef.current) return;
    if (points.length === 0) return;

    hasFittedRef.current = true;
    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }
    map.fitBounds(points, { padding: [48, 48], maxZoom: 17 });
  }, [map, points]);

  return null;
}

function SingleMarker({ point }: { point: ComplaintMapPoint }) {
  return (
    <CircleMarker
      center={[point.latitude, point.longitude]}
      radius={7}
      pathOptions={{
        color: "#ffffff",
        weight: 1.5,
        fillColor: "#2563eb", // Vibrant blue dot
        fillOpacity: 0.95,
      }}
    >
      <Popup>
        <div className="text-xs space-y-1 min-w-[160px] text-left">
          <p className="font-bold text-slate-900">{point.title}</p>
          <p className="text-slate-500">{point.location_name}</p>
          <p className="text-blue-700 font-semibold uppercase text-[10px]">
            {point.status.replace(/_/g, " ")}
          </p>
          <Link
            href={`/complaints/${point.id}`}
            className="text-blue-600 font-bold text-[10px] hover:underline"
          >
            View report →
          </Link>
        </div>
      </Popup>
    </CircleMarker>
  );
}

function getCategoryColor(type: string = ""): string {
  const t = type.toLowerCase();
  if (t.includes("air") || t.includes("aqi") || t.includes("smoke")) return "#06b6d4"; // Cyan
  if (t.includes("water") || t.includes("sewage") || t.includes("drain")) return "#2563eb"; // Blue
  if (t.includes("noise") || t.includes("sound")) return "#8b5cf6"; // Purple
  return "#10b981"; // Emerald for Land/Waste/General
}

function HotspotMarker({
  cluster,
  radiusMeters,
}: {
  cluster: ComplaintHotspotCluster;
  radiusMeters: number;
}) {
  const color = getCategoryColor(cluster.dominant_category || '');
  const effectiveRadius = cluster.radius_meters || radiusMeters;

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    cluster.complaints.forEach((c) => {
      const cat = c.category_name || cluster.dominant_category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    if (Object.keys(counts).length === 0 && cluster.dominant_category) {
      counts[cluster.dominant_category] = cluster.count;
    }
    return counts;
  }, [cluster.complaints, cluster.dominant_category, cluster.count]);

  const countIcon = L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};color:#ffffff;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.25)">${cluster.count}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  return (
    <>
      <Circle
        center={[cluster.latitude, cluster.longitude]}
        radius={effectiveRadius}
        pathOptions={{
          color: color,
          weight: 2,
          dashArray: "6 4",
          fillColor: color,
          fillOpacity: 0.18,
        }}
      />
      <Marker
        position={[cluster.latitude, cluster.longitude]}
        icon={countIcon}
      >
        <Popup>
          <div className="text-xs space-y-1.5 min-w-[200px] text-left">
            <p className="font-bold text-slate-900 flex items-center justify-between" style={{ color: color }}>
              <span>Hotspot · {cluster.count} total reports</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-extrabold">{cluster.dominant_category || 'General'}</span>
            </p>
            <p className="text-slate-500 text-[10px]">
              Polluted Area Radius: <strong className="text-slate-700">{effectiveRadius}m</strong>
            </p>
            
            {Object.keys(categoryBreakdown).length > 0 && (
              <div className="text-[10px] text-slate-700 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg mt-1 space-y-1">
                <p className="font-extrabold text-slate-900 dark:text-white uppercase text-[9px] tracking-wider">
                  Pollution Types Present:
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(categoryBreakdown).map(([cat, cnt]) => (
                    <span key={cat} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded font-bold">
                      {cat} ({cnt})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {cluster.complaints.length > 0 && (
              <ul className="mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                {cluster.complaints.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/complaints/${c.id}`}
                      className="text-slate-700 hover:text-emerald-600 font-medium"
                    >
                      • {c.title}
                    </Link>
                  </li>
                ))}
                {cluster.count > 5 && (
                  <li className="text-slate-400 text-[10px]">
                    +{cluster.count - 5} more reports
                  </li>
                )}
              </ul>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export function ComplaintLeafletMap({
  mapData,
  loading = false,
  height,
}: ComplaintLeafletMapProps) {
  const radiusMeters = mapData?.hotspot_radius_meters ?? 50;

  const boundsPoints = useMemo<[number, number][]>(() => {
    if (!mapData) return [];
    const singles = mapData.singles.map(
      (p) => [p.latitude, p.longitude] as [number, number]
    );
    const hotspots = mapData.hotspots.map(
      (h) => [h.latitude, h.longitude] as [number, number]
    );
    return [...singles, ...hotspots];
  }, [mapData]);

  const defaultCenter = useMemo<[number, number]>(() => {
    if (boundsPoints.length > 0) return boundsPoints[0];
    return [26.875, 80.997]; // Lucknow / India centroid default
  }, [boundsPoints]);

  if (loading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  if (!mapData || mapData.total_complaints === 0) {
    return (
      <div className="h-[420px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8">
        <span className="text-4xl mb-3">🗺️</span>
        <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
          No complaint markers yet
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Report an environmental issue with GPS coordinates to see your complaints on the map.
        </p>
        <Link
          href="/complaints"
          className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Report your first issue →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            OpenStreetMap
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
            {mapData.total_complaints} report{mapData.total_complaints !== 1 ? "s" : ""} ·{" "}
            {mapData.hotspots.length} hotspot{mapData.hotspots.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1 text-blue-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Nearby Complaint
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-slate-500 bg-slate-500/20" />
            Hotspot Zone
          </span>
        </div>
      </div>

      <div className="w-full relative z-0" style={{ height: height || "400px" }}>
        <MapContainer
          center={defaultCenter}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={boundsPoints} />
          {mapData.singles.map((point) => (
            <SingleMarker key={point.id} point={point} />
          ))}
          {mapData.hotspots.map((cluster) => (
            <HotspotMarker
              key={cluster.id}
              cluster={cluster}
              radiusMeters={radiusMeters}
            />
          ))}
        </MapContainer>
      </div>

      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-500 flex flex-wrap gap-3">
        <span>Dashed circle = {radiusMeters}m hotspot zone</span>
      </div>
    </div>
  );
}
