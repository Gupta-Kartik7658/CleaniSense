"use client";

import React, { Suspense } from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useProfile } from "@/hooks/useProfile";
import { useSearchParams } from "next/navigation";

function ProfileContent() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { updatePreferences } = useProfile();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email");
  const nameParam = searchParams.get("name");
  const roleParam = searchParams.get("role");
  const statusParam = searchParams.get("status");
  const cityParam = searchParams.get("city");

  // Dynamic inspector details for admins viewing specific profiles
  const displayedUser = emailParam
    ? {
        name: nameParam || "Authorized User",
        email: emailParam,
        role: roleParam || "user",
        is_active: statusParam === "active" || statusParam === "Active",
        profile_picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          nameParam || "User"
        )}&background=059669&color=fff`,
        created_at: new Date().toISOString(),
      }
    : user;

  return (
    <div className="max-w-2xl space-y-6 p-4 text-left mx-auto">
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {emailParam ? "Inspecting User Profile" : "User Profile"}
      </h2>
      
      {/* Profile Details Card */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex items-center space-x-4">
          {displayedUser?.profile_picture ? (
            <img
              src={displayedUser.profile_picture}
              alt="Profile"
              className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold">
              {displayedUser?.name ? displayedUser.name[0].toUpperCase() : "U"}
            </div>
          )}
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {displayedUser?.name || "Authorized User"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {displayedUser?.email}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4 text-xs">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
              Organization Role
            </span>
            <p className="text-slate-800 dark:text-slate-250 font-bold capitalize">
              {displayedUser?.role || "citizen"}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
              Account Status
            </span>
            <p className={`font-bold ${displayedUser?.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {displayedUser?.is_active ? "Active" : "Suspended"}
            </p>
          </div>
          {cityParam && (
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                City / Region
              </span>
              <p className="text-slate-800 dark:text-slate-250 font-medium">
                {cityParam}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
              Member Since
            </span>
            <p className="text-slate-800 dark:text-slate-250 font-medium">
              {displayedUser?.created_at
                ? new Date(displayedUser.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Theme Preferences Card (only show if viewing own profile) */}
      {!emailParam && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
              Theme Preference
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal">
              Select how the CleaniSense interface appears on your device.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => {
                setTheme("light");
                updatePreferences({ theme: "light" });
              }}
              className={`p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all duration-150 ${
                theme === "light"
                  ? "border-emerald-600 bg-emerald-50/10 text-emerald-800 font-bold"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
            >
              <span className="text-xl font-bold">☀️</span>
              <span className="text-xs">Light</span>
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                updatePreferences({ theme: "dark" });
              }}
              className={`p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all duration-150 ${
                theme === "dark"
                  ? "border-emerald-600 bg-emerald-950/20 text-emerald-400 font-bold"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
            >
              <span className="text-xl font-bold">🌙</span>
              <span className="text-xs">Dark</span>
            </button>
            <button
              onClick={() => {
                setTheme("system");
                updatePreferences({ theme: "system" });
              }}
              className={`p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all duration-150 ${
                theme === "system"
                  ? "border-emerald-600 bg-emerald-50/10 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-bold"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
            >
              <span className="text-xl font-bold">💻</span>
              <span className="text-xs">System</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PortalLayout>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading profile data...</div>}>
        <ProfileContent />
      </Suspense>
    </PortalLayout>
  );
}
