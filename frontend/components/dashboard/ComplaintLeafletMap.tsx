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

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }
    map.fitBounds(points, { padding: [48, 48], maxZoom: 17 });
  }, [map, points]);

  return null;
}

function SingleMarker({ point }: { point: ComplaintMapPoint }) {
  const color = statusColor(point.status);
  return (
    <CircleMarker
      center={[point.latitude, point.longitude]}
      radius={9}
      pathOptions={{
        color: "#ffffff",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95,
      }}
    >
      <Popup>
        <div className="text-xs space-y-1 min-w-[160px]">
          <p className="font-bold text-slate-900">{point.title}</p>
          <p className="text-slate-500">{point.location_name}</p>
          <p className="text-emerald-700 font-semibold uppercase text-[10px]">
            {point.status.replace(/_/g, " ")}
          </p>
          <Link
            href={`/complaints/${point.id}`}
            className="text-emerald-600 font-bold text-[10px] hover:underline"
          >
            View report →
          </Link>
        </div>
      </Popup>
    </CircleMarker>
  );
}

function HotspotMarker({
  cluster,
  radiusMeters,
}: {
  cluster: ComplaintHotspotCluster;
  radiusMeters: number;
}) {
  const countIcon = L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#f43f5e;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(244,63,94,0.5)">${cluster.count}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <>
      <Circle
        center={[cluster.latitude, cluster.longitude]}
        radius={radiusMeters}
        pathOptions={{
          color: "#f43f5e",
          weight: 2,
          dashArray: "6 4",
          fillColor: "#f43f5e",
          fillOpacity: 0.12,
        }}
      />
      <Marker
        position={[cluster.latitude, cluster.longitude]}
        icon={countIcon}
      >
        <Popup>
          <div className="text-xs space-y-1 min-w-[180px]">
            <p className="font-bold text-rose-600">
              Hotspot · {cluster.count} reports
            </p>
            <p className="text-slate-500 text-[10px]">
              Within {radiusMeters}m of each other
            </p>
            <ul className="mt-1 space-y-0.5">
              {cluster.complaints.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/complaints/${c.id}`}
                    className="text-slate-700 hover:text-emerald-600 font-medium"
                  >
                    • {c.title}
                  </Link>
                </li>
              ))}
              {cluster.count > 4 && (
                <li className="text-slate-400 text-[10px]">
                  +{cluster.count - 4} more
                </li>
              )}
            </ul>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export function ComplaintLeafletMap({
  mapData,
  loading = false,
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
    return [23.0225, 72.5714]; // Ahmedabad fallback
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
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Single
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <span className="w-3 h-3 rounded-full border-2 border-rose-500 bg-rose-500/20" />
            Hotspot
          </span>
        </div>
      </div>

      <div className="h-[400px] w-full relative z-0">
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
        <span>·</span>
        <span className="text-amber-600">● Pending</span>
        <span className="text-rose-500">● Active</span>
        <span className="text-emerald-600">● Resolved</span>
      </div>
    </div>
  );
}
