import React from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "../SectionHeader";
import { HotspotMap } from "./HotspotMap";
import { HotspotList } from "./HotspotList";
import { HotspotItem, ComplaintMapData } from "../../../types/dashboard";

interface HotspotSectionProps {
  hotspots?: HotspotItem[];
  mapData?: ComplaintMapData;
  loading?: boolean;
}

export function HotspotSection({
  hotspots,
  mapData,
  loading = false,
}: HotspotSectionProps) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push("/hotspots");
  };

  return (
    <div className="space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm text-left">
      <SectionHeader title="Nearby Hotspots" actionLabel="Expand →" onAction={handleNavigate} />
      <HotspotMap mapData={mapData} loading={loading} />
      <HotspotList hotspots={hotspots} loading={loading} />
    </div>
  );
}
