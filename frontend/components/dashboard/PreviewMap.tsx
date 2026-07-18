"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet default marker icons setup
const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface PreviewMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

function RecenterMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], 15);
  }, [map, latitude, longitude]);
  return null;
}

export function PreviewMap({ latitude, longitude, locationName }: PreviewMapProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full animate-fade-in"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap latitude={latitude} longitude={longitude} />
        <Marker position={[latitude, longitude]} icon={markerIcon}>
          <Popup>
            <div className="text-xs text-left min-w-[140px]">
              <p className="font-bold text-slate-800">Incident Location</p>
              <p className="text-slate-500 mt-0.5">{locationName}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
