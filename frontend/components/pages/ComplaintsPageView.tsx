"use client";

import React from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { CategoryResponse } from "@/types/config";

interface ComplaintsPageViewProps {
  categories: CategoryResponse[];
  configLoading: boolean;
  configError: string | null;
  submitError: string | null;
  maxUploadSizeMb: number;
  maxAttachments: number;
  allowedTypes: string[];
  acceptedTypesLabel: string;
  coords: { latitude: number; longitude: number } | null;
  loadingLocation: boolean;
  title: string;
  description: string;
  categoryId: string;
  locationName: string;
  lat: string;
  lng: string;
  selectedFiles: File[];
  fileErrors: string | null;
  submitting: boolean;
  showSuccessToast: boolean;
  submitDisabled: boolean;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setCategoryId: React.Dispatch<React.SetStateAction<string>>;
  setLocationName: React.Dispatch<React.SetStateAction<string>>;
  setLat: React.Dispatch<React.SetStateAction<string>>;
  setLng: React.Dispatch<React.SetStateAction<string>>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export function ComplaintsPageView({
  categories,
  configLoading,
  configError,
  submitError,
  maxUploadSizeMb,
  maxAttachments,
  allowedTypes,
  acceptedTypesLabel,
  coords,
  loadingLocation,
  title,
  description,
  categoryId,
  locationName,
  lat,
  lng,
  selectedFiles,
  fileErrors,
  submitting,
  showSuccessToast,
  submitDisabled,
  setTitle,
  setDescription,
  setCategoryId,
  setLocationName,
  setLat,
  setLng,
  handleFileChange,
  removeFile,
  handleSubmit,
  onCancel,
}: ComplaintsPageViewProps) {
  return (
    <PortalLayout>
      <div className="relative mx-auto max-w-5xl space-y-6 text-left">
        {showSuccessToast ? (
          <div className="note-success fixed right-6 top-20 z-50 shadow-[0_18px_44px_-28px_rgba(26,54,43,0.65)]">
            Complaint submitted. Redirecting to the detail page...
          </div>
        ) : null}

        <div className="hero-card">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.7fr)] lg:items-start">
            <div className="space-y-4">
              <p className="page-kicker">Complaint Intake</p>
              <h1 className="page-title text-3xl sm:text-4xl">Report a local environmental issue with enough detail to act on it.</h1>
              <p className="page-copy max-w-2xl">
                This form is wired to the live complaint API. Add a clear title, exact location, category,
                coordinates, and supporting files so the report starts with usable field evidence.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="metric-card">
                <p className="metric-label">Categories</p>
                <p className="metric-value">{configLoading ? "..." : categories.length}</p>
                <p className="metric-note">Loaded from backend configuration.</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Location</p>
                <p className="metric-value">{loadingLocation ? "Syncing" : coords ? "Ready" : "Manual"}</p>
                <p className="metric-note">Browser coordinates can prefill latitude and longitude.</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Attachments</p>
                <p className="metric-value">{maxAttachments}</p>
                <p className="metric-note">Up to {maxUploadSizeMb} MB each. {acceptedTypesLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {configLoading ? (
          <div className="section-card flex min-h-[320px] items-center justify-center">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--line)] border-t-[color:var(--brand-strong)]" />
              <p className="text-sm font-medium text-[color:var(--ink-soft)]">Loading complaint configuration...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="section-card space-y-8">
            {configError ? <div className="note-warn">{configError}</div> : null}
            {submitError ? <div className="note-danger">{submitError}</div> : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
              <div className="space-y-6">
                <div className="field-group">
                  <label className="field-label">Issue Title</label>
                  <p className="field-help">Minimum 5 characters. Keep it specific and location-oriented.</p>
                  <input
                    type="text"
                    placeholder="Example: Open burning near market road"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    minLength={5}
                    maxLength={500}
                    className="field-input"
                  />
                  {title && title.length < 5 ? (
                    <p className="text-sm text-[color:var(--danger-strong)]">Title must be at least 5 characters.</p>
                  ) : null}
                </div>

                <div className="field-group">
                  <label className="field-label">Description</label>
                  <p className="field-help">Minimum 20 characters. Mention source, visibility, impact, and urgency.</p>
                  <textarea
                    placeholder="Describe what is happening, how long it has been visible, and what kind of pollution is involved."
                    rows={6}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    required
                    minLength={20}
                    className="field-textarea"
                  />
                  {description && description.length < 20 ? (
                    <p className="text-sm text-[color:var(--danger-strong)]">Description must be at least 20 characters.</p>
                  ) : null}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="field-group">
                    <label className="field-label">Category</label>
                    <p className="field-help">Loaded from backend configuration.</p>
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      required
                      disabled={categories.length === 0}
                      className="field-select"
                    >
                      {categories.length === 0 ? (
                        <option value="">No categories available</option>
                      ) : (
                        categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Location Address</label>
                    <p className="field-help">Use a landmark, road, or area name a field team can recognize.</p>
                    <input
                      type="text"
                      placeholder="Example: Near Sagar Society Gate, Satellite Road"
                      value={locationName}
                      onChange={(event) => setLocationName(event.target.value)}
                      required
                      className="field-input"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="field-group">
                    <label className="field-label">Latitude</label>
                    <p className="field-help">Accepts decimal coordinates.</p>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="23.0305"
                      value={lat}
                      onChange={(event) => setLat(event.target.value)}
                      required
                      className="field-input"
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Longitude</label>
                    <p className="field-help">Accepts decimal coordinates.</p>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="72.5074"
                      value={lng}
                      onChange={(event) => setLng(event.target.value)}
                      required
                      className="field-input"
                    />
                  </div>
                </div>

                <div className="field-group">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="field-label">Attachments</label>
                      <p className="field-help">Allowed: {acceptedTypesLabel}. Max {maxAttachments} files.</p>
                    </div>
                    <span className="pill-badge">
                      {selectedFiles.length}/{maxAttachments}
                    </span>
                  </div>

                  {fileErrors ? <div className="note-danger">{fileErrors}</div> : null}

                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed border-[color:var(--line-strong)] bg-[color:var(--surface-muted)] px-6 py-10 text-center transition hover:border-[color:var(--brand-strong)] hover:bg-[color:var(--surface)]">
                    <span className="pill-badge">Evidence Upload</span>
                    <span className="text-base font-semibold text-[color:var(--ink-strong)]">Choose image or PDF files</span>
                    <span className="text-sm text-[color:var(--ink-soft)]">Up to {maxUploadSizeMb} MB per file.</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept={allowedTypes.join(",")}
                    />
                  </label>

                  {selectedFiles.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[color:var(--ink-strong)]">{file.name}</p>
                            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button type="button" onClick={() => removeFile(idx)} className="ghost-action">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="section-card !p-5">
                  <p className="metric-label">Submission Checklist</p>
                  <div className="mt-4 space-y-3 text-sm text-[color:var(--ink-soft)]">
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                      Add a recognizable location so the report can be verified quickly.
                    </div>
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                      Use attachments when the issue is visible in photos or a scanned document.
                    </div>
                    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                      Longer descriptions help the complaint history and resolution pages stay useful later.
                    </div>
                  </div>
                </div>

                <div className="section-card !p-5">
                  <p className="metric-label">Location Status</p>
                  <div className="mt-4 space-y-3">
                    <div className={loadingLocation ? "note-neutral" : coords ? "note-success" : "note-neutral"}>
                      {loadingLocation
                        ? "Reading browser coordinates..."
                        : coords
                          ? `Coordinates ready: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                          : "Automatic coordinates are unavailable. You can still enter them manually."}
                    </div>
                    <p className="fine-print">
                      The form accepts manual coordinates even if browser location is blocked.
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            <div className="soft-divider" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="fine-print">
                After submission, you will be redirected to the complaint detail page and can track progress from history.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onCancel} className="secondary-action">
                  Cancel
                </button>
                <button type="submit" disabled={submitDisabled} className="primary-action">
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </PortalLayout>
  );
}
