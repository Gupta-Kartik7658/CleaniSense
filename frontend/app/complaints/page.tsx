"use client";

import React, { useState, useEffect } from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { useComplaints } from "@/hooks/useComplaints";
import { configService } from "@/services/config";
import { CategoryResponse } from "@/types/config";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useRouter } from "next/navigation";

export default function ComplaintsPage() {
  const router = useRouter();
  const { coords, loading: loadingLocation } = useCurrentLocation();
  const { createComplaint, loading: submitting, error: submitError } = useComplaints();

  // Categories and configurations configuration
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(10);
  const [allowedTypes, setAllowedTypes] = useState<string[]>(["image/jpeg", "image/png", "application/pdf"]);
  const [maxAttachments, setMaxAttachments] = useState(5);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [areaAffected, setAreaAffected] = useState("");
  const [populationAffected, setPopulationAffected] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [severityHint, setSeverityHint] = useState("moderate");
  const [vulnerablePeopleNearby, setVulnerablePeopleNearby] = useState(false);
  const [activeLeakOrFire, setActiveLeakOrFire] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string | null>(null);

  // Status flags
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Load config on mount
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigError(null);
        const config = await configService.getConfig();
        setCategories(config.categories);
        if (config.categories.length > 0) {
          setCategoryId(config.categories[0].id);
        } else {
          setConfigError("No complaint categories are configured. Please contact support or try again later.");
        }
        setMaxUploadSizeMb(config.max_upload_size_mb || 10);
        setAllowedTypes(config.allowed_file_types || ["image/jpeg", "image/png", "application/pdf"]);
        setMaxAttachments(config.max_attachments || 5);
      } catch (err) {
        console.error("Failed to load configurations:", err);
        setConfigError("Failed to load categories. Check that the backend is running.");
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Sync geolocation coordinates
  useEffect(() => {
    if (coords) {
      setLat(String(coords.latitude.toFixed(6)));
      setLng(String(coords.longitude.toFixed(6)));
    }
  }, [coords]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileErrors(null);
    if (!e.target.files) return;
    
    const filesArray = Array.from(e.target.files);
    
    // Check maximum attachments count
    if (selectedFiles.length + filesArray.length > maxAttachments) {
      setFileErrors(`Maximum of ${maxAttachments} attachments are allowed per complaint.`);
      return;
    }

    // Validate size and type for each file
    for (const file of filesArray) {
      if (!allowedTypes.includes(file.type)) {
        setFileErrors(`Unsupported file format: ${file.name}. Only JPEG, PNG, and PDF files are allowed.`);
        return;
      }
      if (file.size > maxUploadSizeMb * 1024 * 1024) {
        setFileErrors(`File too large: ${file.name}. Maximum file size limit is ${maxUploadSizeMb}MB.`);
        return;
      }
    }

    setSelectedFiles((prev) => [...prev, ...filesArray]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedArea = areaAffected ? parseFloat(areaAffected) : undefined;
    const parsedPopulation = populationAffected ? parseInt(populationAffected, 10) : undefined;
    const parsedDuration = durationHours ? parseFloat(durationHours) : undefined;

    if (!categoryId || !title.trim() || !description.trim() || !locationName.trim() || !lat || !lng) {
      return;
    }

    if (title.trim().length < 5) {
      return;
    }

    if (description.trim().length < 20) {
      return;
    }

    if (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      return;
    }

    if (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      return;
    }

    if (
      (parsedArea !== undefined && (Number.isNaN(parsedArea) || parsedArea < 0)) ||
      (parsedPopulation !== undefined && (Number.isNaN(parsedPopulation) || parsedPopulation < 0)) ||
      (parsedDuration !== undefined && (Number.isNaN(parsedDuration) || parsedDuration < 0))
    ) {
      return;
    }

    try {
      const complaint = await createComplaint(
        {
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId,
          location_name: locationName.trim(),
          latitude: parsedLat,
          longitude: parsedLng,
          area_affected_sqm: parsedArea,
          population_affected: parsedPopulation,
          duration_hours: parsedDuration,
          survey_data: {
            severity: severityHint,
            vulnerable_people_nearby: vulnerablePeopleNearby,
            active_leak_or_fire: activeLeakOrFire
          }
        },
        selectedFiles
      );

      // Trigger Success Toast
      setShowSuccessToast(true);

      // Wait 1.5 seconds for visual feedback, refresh dashboard, and redirect
      setTimeout(() => {
        router.push(`/complaints/${complaint.id}`);
      }, 1500);

    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-2xl mx-auto p-4 text-left relative">
        
        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
            <span>✅</span>
            <span>Complaint submitted successfully! Redirecting...</span>
          </div>
        )}

        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Report Environmental Issue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit details of environmental pollution in your locality for municipal verification
          </p>
        </div>

        {configLoading ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center py-20 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-emerald-600 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-550 dark:text-slate-400 text-xs font-semibold">Loading configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            
            {configError && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300 rounded-xl text-xs font-semibold">
                ⚠️ {configError}
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
                ⚠️ {submitError}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Issue Title <span className="text-slate-400 font-normal">(min 5 characters)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Blocked Drainage Overflow, Plastic dumping"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={5}
                maxLength={500}
                className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              {title && title.length < 5 && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">Title must be at least 5 characters long.</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={categories.length === 0}
                className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Description <span className="text-slate-400 font-normal">(min 20 characters)</span>
              </label>
              <textarea
                placeholder="Provide a detailed description of the pollution issue, source, and severity..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={20}
                className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              {description && description.length < 20 && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">Description must be at least 20 characters long.</p>
              )}
            </div>

            {/* Location Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Area Affected
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="sq. meters"
                  value={areaAffected}
                  onChange={(e) => setAreaAffected(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  People Affected
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="count"
                  value={populationAffected}
                  onChange={(e) => setPopulationAffected(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Duration
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="hours"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Observed Severity
                </label>
                <select
                  value={severityHint}
                  onChange={(e) => setSeverityHint(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="normal">Normal</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={vulnerablePeopleNearby}
                  onChange={(e) => setVulnerablePeopleNearby(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                Vulnerable people nearby
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={activeLeakOrFire}
                  onChange={(e) => setActiveLeakOrFire(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                Active leak or fire
              </label>
            </div>

            {/* Location Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Location Address
              </label>
              <input
                type="text"
                placeholder="e.g. Near Sagar Society Gate, Satellite Road"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                required
                className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Geolocation Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 23.0305"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 72.5074"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {loadingLocation && (
              <p className="text-[10px] text-emerald-600 font-semibold italic animate-pulse">
                📍 Fetching live browser coordinates...
              </p>
            )}

            {/* Media Uploads */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Attachments (Evidence)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedFiles.length}/{maxAttachments} files
                </span>
              </div>

              {fileErrors && (
                <p className="text-[10px] text-rose-600 font-semibold">⚠️ {fileErrors}</p>
              )}

              {/* Upload Drag Target */}
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-emerald-600 rounded-xl p-6 text-center cursor-pointer transition-colors duration-150">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/jpeg,image/png,application/pdf"
                />
                <span className="text-2xl block mb-1">📸</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Click to select files
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  JPEG, PNG, or PDF up to {maxUploadSizeMb}MB
                </span>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg flex items-center justify-between border border-slate-150 dark:border-slate-800 text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>📄</span>
                        <span className="font-semibold text-slate-850 dark:text-white truncate">
                          {file.name}
                        </span>
                        <span className="text-slate-400 shrink-0">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-rose-600 hover:text-rose-700 font-bold px-2 py-0.5 rounded cursor-pointer transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Panel */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850 font-bold py-2.5 px-6 rounded-xl transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || categories.length === 0 || title.length < 5 || description.length < 20}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </PortalLayout>
  );
}
