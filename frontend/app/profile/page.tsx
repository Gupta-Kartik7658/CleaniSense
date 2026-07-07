"use client";

import React, { useEffect, useState } from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useProfile } from "@/hooks/useProfile";

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { profile, preferences, loading, error, updateProfile, updatePreferences } = useProfile();
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [language, setLanguage] = useState("en");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.name || user?.name || "");
    setProfilePicture(profile?.profile_picture || user?.profile_picture || "");
  }, [profile, user]);

  useEffect(() => {
    setLanguage(preferences?.language || "en");
    setNotificationsEnabled(preferences?.notifications_enabled ?? true);
  }, [preferences]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileMessage(null);
    try {
      await updateProfile(name.trim(), profilePicture.trim() || undefined);
      setProfileMessage("Profile details updated.");
    } catch (saveError) {
      console.error("Failed to update profile", saveError);
    }
  };

  const savePreference = async (
    key: "theme" | "language" | "notifications_enabled",
    value: string | boolean,
  ) => {
    setPreferenceMessage(null);
    try {
      if (key === "notifications_enabled") {
        await updatePreferences({ notifications_enabled: Boolean(value) });
      } else if (key === "language") {
        await updatePreferences({ language: String(value) });
      } else {
        await updatePreferences({ theme: String(value) });
      }
      setPreferenceMessage("Preferences saved.");
    } catch (saveError) {
      console.error("Failed to update preferences", saveError);
    }
  };

  return (
    <PortalLayout>
      <div className="mx-auto max-w-5xl space-y-6 text-left">
        <div className="hero-card">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.7fr)] lg:items-end">
            <div className="space-y-4">
              <p className="page-kicker">Profile</p>
              <h1 className="page-title text-3xl sm:text-4xl">Manage your citizen identity and saved workspace preferences.</h1>
              <p className="page-copy max-w-2xl">
                This page is connected to the live profile and preference APIs. You can update your visible
                name, profile image URL, theme, language, and notification settings without leaving the portal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="metric-card">
                <p className="metric-label">Role</p>
                <p className="metric-value text-2xl capitalize">{user?.role || "citizen"}</p>
                <p className="metric-note">Current account role from the authenticated session.</p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Status</p>
                <p className="metric-value text-2xl">{user?.is_active ? "Active" : "Inactive"}</p>
                <p className="metric-note">Profile availability for complaint and dashboard actions.</p>
              </div>
            </div>
          </div>
        </div>

        {error ? <div className="note-danger">{error}</div> : null}
        {profileMessage ? <div className="note-success">{profileMessage}</div> : null}
        {preferenceMessage ? <div className="note-success">{preferenceMessage}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
          <form onSubmit={saveProfile} className="section-card space-y-6">
            <div className="flex items-center gap-4">
              {profilePicture || user?.profile_picture ? (
                <img
                  src={profilePicture || user?.profile_picture || ""}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border border-[color:var(--line)] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--surface-muted)] text-xl font-semibold text-[color:var(--brand-strong)]">
                  {(name || user?.name || "U").charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <p className="metric-label">Signed-in account</p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink-strong)]">
                  {profile?.name || user?.name || "Citizen User"}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{profile?.email || user?.email}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="field-group sm:col-span-2">
                <label className="field-label">Display Name</label>
                <p className="field-help">This name is used in the citizen portal and complaint records.</p>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="field-input"
                  placeholder="Enter your display name"
                />
              </div>

              <div className="field-group sm:col-span-2">
                <label className="field-label">Profile Picture URL</label>
                <p className="field-help">Optional public image URL for the avatar shown across the portal.</p>
                <input
                  type="url"
                  value={profilePicture}
                  onChange={(event) => setProfilePicture(event.target.value)}
                  className="field-input"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <div className="soft-divider" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="fine-print">
                Member since{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
              <button type="submit" disabled={loading || !name.trim()} className="primary-action">
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="section-card">
              <div className="space-y-1">
                <p className="metric-label">Theme Preference</p>
                <p className="text-sm text-[color:var(--ink-soft)]">Choose how the interface appears on this device.</p>
              </div>
              <div className="mt-5 grid gap-3">
                {(["light", "dark", "system"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setTheme(option);
                      void savePreference("theme", option);
                    }}
                    className={`rounded-[28px] border px-4 py-4 text-left transition ${
                      theme === option
                        ? "border-[color:var(--brand-strong)] bg-[color:var(--surface)] shadow-[0_18px_32px_-28px_rgba(44,95,74,0.6)]"
                        : "border-[color:var(--line)] bg-[color:var(--surface-muted)] hover:bg-[color:var(--surface)]"
                    }`}
                  >
                    <p className="text-sm font-semibold capitalize text-[color:var(--ink-strong)]">{option}</p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      {option === "system" ? "Follow the device preference automatically." : `Use ${option} mode in the portal.`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="section-card space-y-5">
              <div className="field-group">
                <label className="field-label">Language</label>
                <select
                  value={language}
                  onChange={(event) => {
                    setLanguage(event.target.value);
                    void savePreference("language", event.target.value);
                  }}
                  className="field-select"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              <div className="field-group">
                <div className="flex items-start justify-between gap-4 rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--ink-strong)]">Notifications</p>
                    <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                      Keep complaint and hotspot updates visible in the portal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notificationsEnabled;
                      setNotificationsEnabled(next);
                      void savePreference("notifications_enabled", next);
                    }}
                    className={notificationsEnabled ? "pill-badge tone-success" : "pill-badge"}
                  >
                    {notificationsEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
