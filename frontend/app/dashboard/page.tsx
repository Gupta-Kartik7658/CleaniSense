"use client";

import React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ReportHero } from "@/components/dashboard/ReportHero";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { ComplaintMapSection } from "@/components/dashboard/ComplaintMapSection";
import { ReportsSection } from "@/components/dashboard/reports/ReportsSection";
import { HotspotSection } from "@/components/dashboard/hotspots/HotspotSection";

export default function DashboardPage() {
  // Pass user?.id so useDashboard waits for auth before fetching.
  // This fixes the production race condition where Firebase Auth initializes
  // AFTER the component mounts, causing an unauthenticated API request that
  // returns empty/401 data which then gets stuck as the "loaded" state.
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error } = useDashboard(user?.id ?? null);

  // While auth is still resolving, show the loading spinner from PortalLayout.
  // Once auth resolves (user is set), useDashboard will fire its authenticated request.
  const isLoading = authLoading || loading;

  return (
    <div className="space-y-8">
      
      {/* 1. Dashboard Header */}
      <DashboardHeader />

      {/* 2. Report Hero Section */}
      <ReportHero />

      {/* 3. Overview Statistics (OverviewSection) */}
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center">
          {error}
        </div>
      ) : (
        <OverviewSection summary={data?.summary} loading={isLoading} />
      )}

      {/* Complaint geo graph with 50m hotspot clustering */}
      {!error && (
        <ComplaintMapSection mapData={data?.complaintMap} loading={isLoading} />
      )}

      {/* Split Two-Column Layout (Desktop) */}
      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - 60% Width (col-span-7) */}
          <div className="lg:col-span-7">
            <ReportsSection reports={data?.reports} loading={isLoading} />
          </div>

          {/* Right Column - 40% Width (col-span-5) */}
          <div className="lg:col-span-5">
            <HotspotSection hotspots={data?.hotspots} mapData={data?.hotspotMap} loading={isLoading} />
          </div>

        </div>
      )}

    </div>
  );
}
