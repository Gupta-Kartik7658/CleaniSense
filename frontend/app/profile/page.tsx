"use client";

import React from "react";
import { PortalLayout } from "@/components/dashboard/PortalLayout";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <PortalLayout>
      <div className="max-w-2xl space-y-6 p-4 text-left mx-auto">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          User Profile
        </h2>
        
        {/* Profile Details Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center space-x-4">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {user?.name || "Authorized User"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4 text-xs">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                Organization Role
              </span>
              <p className="text-slate-800 dark:text-slate-250 font-bold capitalize">
                {user?.role || "citizen"}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                Account Status
              </span>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                {user?.is_active ? "Active" : "Suspended"}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                Member Since
              </span>
              <p className="text-slate-800 dark:text-slate-250 font-medium">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Preferences Card */}
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
              onClick={() => setTheme("light")}
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
              onClick={() => setTheme("dark")}
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
              onClick={() => setTheme("system")}
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

      </div>
    </PortalLayout>
  );
}
